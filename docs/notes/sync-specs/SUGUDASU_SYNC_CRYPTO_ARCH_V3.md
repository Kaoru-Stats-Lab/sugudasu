# SUGUDASU Sync — 暗号アーキテクチャ仕様書 v3

対象: sync.sugudasu.com（有料版）
前提技術: Supabase (Auth / Postgres / Storage / RLS) + ブラウザ完結型 E2E暗号化

本ドキュメントはCursor等のAIコーディングエディタへの実装指示としてそのまま利用できるレベルの技術具体性で記述する。

---

## 0. 設計思想（憲法）

1. **F2: 完全データ非送信** — サーバー（Supabase）は暗号化データの土管に徹する。中身・鍵・パスワードを一切知り得ない。
2. **F3: 静的配信** — 暗号化・復号・鍵導出は100%ブラウザ（WebCrypto API / WASM / Web Worker）で行う。
3. **Identity ≠ Encryption** — Supabase Auth（ログインパスワード）とVault暗号鍵（Master Password）は完全に別物として扱う。同一文字列の使用は登録時に拒否する。

---

## 1. 全体構成図

```
┌──────────────────────────────────────┐
│ Browser                               │
│                                        │
│  Supabase Auth Login → JWT             │
│         │                              │
│  Device Keypair (Ed25519)              │
│  (IndexedDB, non-exportable wrap)      │
│         │                              │
│  Master Password + Secret Key          │
│         │                              │
│      [Web Worker]                      │
│      Argon2id → HKDF                   │
│         │                              │
│    VaultKey / MetadataKey(予約)        │
│         │                              │
│      AES-256-GCM                       │
│         │                              │
│  Encrypted Vault (+ Header)            │
└───────────────┬────────────────────────┘
                │ HTTPS
┌───────────────▼────────────────────────┐
│ Supabase                               │
│  Auth (JWT)                            │
│  Postgres: profiles / vaults / devices │
│            / subscriptions             │
│  Storage: vaults/{uid}/{version}.bin   │
│  RLS: user_id = auth.uid()             │
└──────────────────────────────────────────┘
```

Supabaseの責務は「誰のデータか（Auth）」「保存する（Storage）」「配信する（RLS）」のみ。暗号処理には一切関与しない。

---

## 2. データベース設計

### 2.1 profiles
```sql
create table profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 2.2 vaults（メタデータのみ。本体はStorage）
```sql
create table vaults (
  user_id uuid primary key references auth.users(id),
  current_version int not null default 0,
  content_hash text,              -- 整合性確認用（competition判定には使わない）
  size int,
  updated_at timestamptz not null default now()
);
```
- `current_version` が唯一の競合判定基準。
- `content_hash` はSHA-256。同一内容かどうかの重複/破損確認専用であり、versionとは役割を分離する（フィードバック②採用）。

### 2.3 devices（公開鍵ベース、フィードバック③採用）
```sql
create table devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  device_name text,
  public_key text not null,        -- Ed25519公開鍵（Base64）
  trusted boolean not null default true,
  secret_key_cached boolean not null default false, -- ④: Secret Keyをローカル保存しているか
  revoked_at timestamptz,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);
```

### 2.4 subscriptions
```sql
create table subscriptions (
  user_id uuid primary key references auth.users(id),
  plan text not null,
  expires_at timestamptz,
  stripe_customer_id text
);
```

### 2.5 RLS方針
```sql
alter table vaults enable row level security;
create policy vaults_owner on vaults
  for all using (user_id = auth.uid());

alter table devices enable row level security;
create policy devices_owner on devices
  for all using (user_id = auth.uid());
```
Storageも同様に `folder = auth.uid()` のみアクセス許可。

**廃止項目**: `activity_logs` は削除。`devices.last_seen` の1件更新で代替し、無料枠のAPI/行数消費を抑える。

---

## 3. Storage設計（Immutable版数付きオブジェクト）

フィードバック①・⑩を採用。Storage/DBの不整合（DBはversion5だがStorageは既にversion6に上書きされている状態）を構造的に防ぐ。

```
vaults/
  {user_id}/
    1.bin
    2.bin
    3.bin
    ...
    N.bin
```

- 各ファイルは**一度書いたら二度と上書きしない**（Immutable）。
- 「現在の版」はDBの `vaults.current_version` のみが指す。
- 無料枠対策として、直近5〜10世代を超えたら古い世代を削除するクリーンアップジョブを用意する（数百KB級のVaultなら十分収まる）。

### 保存シーケンス（正しい順序）
```
1. クライアント: 暗号化Blobを作成
2. クライアント → Storage: N+1.bin としてアップロード（既存ファイルは変更しない）
3. クライアント → RPC(upsert_vault_version): expected_version=N を渡す
4. RPCが成功 → current_version = N+1 に更新
5. RPCが失敗(conflict) → アップロード済みの N+1.bin はそのまま残置
   （Immutableなので破損リスクなし。次回のGCで削除対象にできる）
```

Storageアップロードが先行してもDBのversionが更新されない限り「現在の版」にはならないため、①で問題視されていた「別端末が新しいBlobを古いversion番号で読んでしまう」事故が構造的に発生しない。

---

## 4. Vault Header（暗号アジリティ）

フィードバック⑥採用。将来のアルゴリズム移行（AES-GCM → XChaCha20-Poly1305、Argon2id → scrypt等）に備え、Blob先頭にヘッダーを持たせる。

```
[Magic:4B "SGDS"] [Version:1B] [Cipher:1B] [KDF:1B] [KDFCost:4B]
[Salt:16B] [IV:12B] [Ciphertext:可変長] [Tag:16B]
```

```javascript
// ヘッダー定義例
const CIPHER = { AES256_GCM: 0x01 };
const KDF = { ARGON2ID: 0x01, ARGON2ID_V2: 0x02, SCRYPT: 0x03 };

function buildVaultHeader({ cipher, kdf, kdfCost, salt, iv }) {
  const header = new Uint8Array(4 + 1 + 1 + 1 + 4 + 16 + 12);
  header.set(new TextEncoder().encode('SGDS'), 0);
  header[4] = 0x03; // header format version
  header[5] = cipher;
  header[6] = kdf;
  new DataView(header.buffer).setUint32(7, kdfCost, false);
  header.set(salt, 11);
  header.set(iv, 27);
  return header;
}
```

---

## 5. 鍵導出・暗号化フロー

### 5.1 鍵の分離（HKDF）
```
Master Password + Secret Key
        │
     Argon2id (Web Worker内で実行)
        │
      Root Key (32byte)
        │
      HKDF展開
     ┌──┴───────────────┐
  VaultKey        MetadataKey（予約・フェーズ2）
```

MetadataKeyは現時点では未使用（フィードバック⑦をフェーズ2送りとした判断）。HKDFのinfo文字列だけ予約しておき、後から追加コストなく拡張できるようにする。

```javascript
// Web Worker内
async function deriveKeys(masterPassword, secretKey, salt) {
  const rootKey = await argon2id({
    password: masterPassword + secretKey,
    salt,
    memoryCost: 19456, // ~19MB, OWASP推奨値目安
    timeCost: 2,
    parallelism: 1,
    hashLength: 32
  });

  const vaultKey = await hkdfExpand(rootKey, 'sugudasu-vault-key-v1', 32);
  // const metadataKey = await hkdfExpand(rootKey, 'sugudasu-metadata-key-v1', 32); // フェーズ2で有効化

  return { vaultKey };
}
```

### 5.2 暗号化・復号（AES-GCM）
```javascript
async function encryptVault(vaultJson, vaultKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey(
    'raw', vaultKey, 'AES-GCM', false, ['encrypt']
  );
  const plaintext = new TextEncoder().encode(JSON.stringify(vaultJson));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, cryptoKey, plaintext
  );
  return { iv, ciphertext: new Uint8Array(ciphertext) };
}

async function decryptVault(header, ciphertext, vaultKey) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', vaultKey, 'AES-GCM', false, ['decrypt']
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: header.iv }, cryptoKey, ciphertext
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}
```

---

## 6. 楽観的ロック（原子的version更新RPC）

```sql
create or replace function upsert_vault_version(
  p_user_id uuid,
  p_expected_version int,
  p_new_version int,
  p_content_hash text,
  p_size int
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_current int;
begin
  select current_version into v_current
  from vaults where user_id = p_user_id
  for update;

  if v_current is null then
    insert into vaults (user_id, current_version, content_hash, size)
    values (p_user_id, p_new_version, p_content_hash, p_size);
    return jsonb_build_object('status', 'created', 'version', p_new_version);
  end if;

  if v_current != p_expected_version then
    return jsonb_build_object('status', 'conflict', 'server_version', v_current);
  end if;

  update vaults
  set current_version = p_new_version,
      content_hash = p_content_hash,
      size = p_size,
      updated_at = now()
  where user_id = p_user_id;

  return jsonb_build_object('status', 'ok', 'version', p_new_version);
end;
$$;
```

```javascript
async function saveVault(userId, expectedVersion, encryptedBlobWithHeader) {
  const newVersion = expectedVersion + 1;
  const path = `vaults/${userId}/${newVersion}.bin`;
  const contentHash = await sha256(encryptedBlobWithHeader);

  // 1. Immutableオブジェクトとして先にアップロード
  await supabase.storage.from('vaults').upload(path, encryptedBlobWithHeader);

  // 2. 原子的にversionを確定
  const { data } = await supabase.rpc('upsert_vault_version', {
    p_user_id: userId,
    p_expected_version: expectedVersion,
    p_new_version: newVersion,
    p_content_hash: contentHash,
    p_size: encryptedBlobWithHeader.byteLength
  });

  if (data.status === 'conflict') {
    return { conflict: true, serverVersion: data.server_version };
  }
  return { conflict: false, version: data.version };
}
```

---

## 7. 差分マージ（revisionベース、フィードバック⑤採用）

`updated_at`のタイムスタンプ比較は端末間の時計ズレに弱いため、board単位の**単調増加するrevisionカウンタ**に置き換える。

```json
{
  "version": 3,
  "boards": [
    { "id": "b1", "revision": 4, "data": {} },
    { "id": "b2", "revision": 2, "data": {} }
  ],
  "settings": {}
}
```

```javascript
function mergeVaults(localVault, remoteVault) {
  const merged = { ...remoteVault, boards: [] };
  const remoteMap = new Map(remoteVault.boards.map(b => [b.id, b]));
  const localMap = new Map(localVault.boards.map(b => [b.id, b]));
  const allIds = new Set([...remoteMap.keys(), ...localMap.keys()]);

  for (const id of allIds) {
    const local = localMap.get(id);
    const remote = remoteMap.get(id);
    if (!local) merged.boards.push(remote);
    else if (!remote) merged.boards.push(local);
    else merged.boards.push(local.revision >= remote.revision ? local : remote);
  }
  return merged;
}
```

- board編集時は必ず `revision += 1` をクライアント側でインクリメント。
- 競合が発生しないケース（別々のboardを編集していた）は自動マージで解決。
- 同一boardが両方で編集された場合のみユーザーに選択UIを提示（「サーバー版」「自分の版」「両方保持」）。

---

## 8. Device管理（Ed25519公開鍵、フィードバック③採用）

### 8.1 端末登録
```javascript
async function registerDevice() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' }, false, ['sign', 'verify']
  );
  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  // 秘密鍵はnon-exportableのままIndexedDBにCryptoKeyオブジェクトとして保存
  await idbSaveKey('device_private_key', keyPair.privateKey);

  await supabase.from('devices').insert({
    user_id: userId,
    device_name: navigator.userAgent,
    public_key: arrayBufferToBase64(publicKeyRaw)
  });
}
```

### 8.2 失効チェック（起動時＋定期ハートビート）
```sql
create or replace function check_device_status(p_device_id uuid)
returns jsonb language plpgsql security definer as $$
declare v_trusted boolean;
begin
  select trusted into v_trusted from devices where id = p_device_id;
  update devices set last_seen = now() where id = p_device_id;
  return jsonb_build_object('trusted', coalesce(v_trusted, false));
end; $$;
```

```javascript
// 起動時 + 30〜60分ごと
async function verifyDeviceTrust(deviceId) {
  const { data } = await supabase.rpc('check_device_status', { p_device_id: deviceId });
  if (!data.trusted) {
    await idbDeleteKey('device_private_key');
    await idbDeleteKey('cached_secret_key');
    forceLogout('この端末はアクセスを取り消されました。再度Secret Keyを読み込んでください。');
  }
}
```

**残存リスク**: 完全オフライン端末は次回オンライン化まで失効を検知できない。これは物理的制約として利用規約に明記する。

---

## 9. Secret Keyの取り扱い（フィードバック④採用）

デフォルトはローカル非保存。ユーザーが明示的に「この端末を信頼する」を選んだ場合のみIndexedDBに保存する。

```javascript
async function handleSecretKeyStorage(secretKey, trustThisDevice) {
  if (!trustThisDevice) {
    // メモリ変数にのみ保持。タブを閉じたら消える。
    return { persisted: false };
  }
  // 保存する場合はnon-exportable AES鍵でラップしてIndexedDBへ
  const wrappingKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrapped = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await crypto.subtle.importKey('raw', secretKey, 'AES-GCM', false, ['encrypt']),
    secretKey
  );
  await idbSaveKey('wrapped_secret_key', { wrapped, iv });
  await supabase.from('devices').update({ secret_key_cached: true }).eq('id', deviceId);
  return { persisted: true };
}
```

UI文言例:
```
□ この端末を信頼する（次回からSecret Key入力を省略）
   ※チェックしない場合、次回ログイン時に再度QRスキャンが必要です
```

---

## 10. 保存トリガーとフォールバック

```javascript
let isDirty = false;
let pendingBlob = null;

// 3秒Debounce + 30秒最大保証
const debouncedSave = debounce(() => saveVault(...), 3000);
setInterval(() => { if (isDirty) saveVault(...); }, 30000);

window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && isDirty) flushOnExit();
});
window.addEventListener('pagehide', () => {
  if (isDirty) flushOnExit();
});

async function flushOnExit() {
  const blob = pendingBlob;
  if (blob.byteLength <= 60_000) {
    navigator.sendBeacon(UPLOAD_URL, new Blob([blob]));
  } else {
    try {
      await fetch(UPLOAD_URL, { method: 'PUT', body: blob, keepalive: true });
    } catch (e) {
      await savePendingQueue(blob); // 送信失敗時はローカル退避
    }
  }
}
```

### Pending Queue（フィードバック⑧採用: conflict時も削除しない）
```javascript
async function savePendingQueue(blob, expectedVersion) {
  await idbAdd('pending_uploads', { blob, expectedVersion, timestamp: Date.now() });
}

async function flushPendingQueue() {
  const items = await idbGetAll('pending_uploads');
  for (const item of items) {
    const result = await saveVault(userId, item.expectedVersion, item.blob);
    if (!result.conflict) {
      await idbDelete('pending_uploads', item.id); // 成功時のみ削除
    }
    // conflict時は削除せず残す → ユーザーに手動マージを促す
  }
}
```

---

## 11. CSP（フィードバック⑨採用）

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  connect-src 'self' https://*.supabase.co;
  style-src 'self' 'unsafe-inline';
  object-src 'none';
  base-uri 'self';
  require-trusted-types-for 'script';
```

- 依存ライブラリ（Argon2 WASM、QRデコーダ等）はCDN直参照せず自前バンドル。
- ReactアプリではTrusted Types Policyを明示的に定義し、`dangerouslySetInnerHTML`等の使用箇所を洗い出す。

---

## 12. フェーズ2予約事項（今回は実装しない）

- **Metadata暗号化**: board数・team名等が増えた場合に備え、HKDFのinfo文字列 `sugudasu-metadata-key-v1` のみ予約。実装コストが要件に見合うタイミングで着手。
- **手動での詳細差分UI**: revisionベースの自動マージで大半をカバーし、同一board競合時のみ簡易選択UIとする。将来的にboard内フィールド単位の差分表示に拡張可能。

---

## 13. 実装優先順位

1. Vault Header + Immutable版数付きStorage + 楽観的ロックRPC（データ整合性の根幹）
2. Device公開鍵登録・失効フロー
3. 保存トリガー（Debounce/pagehide/sendBeacon/Pending Queue）
4. revisionベース差分マージ
5. CSP設定
6. （フェーズ2）Metadata暗号化

---

## 14. プロダクト台帳サマリー

`実装方針：Supabase Auth分離＋Immutable版数Storage＋Ed25519端末鍵＋revisionマージのE2E暗号化Sync 理由：ゼロ知識性とデータ整合性を構造的に両立させつつ無料枠運用と将来拡張性を確保するため`
