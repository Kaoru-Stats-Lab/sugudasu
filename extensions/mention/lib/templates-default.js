/**
 * Mention by SUGUDASU — 既定テンプレ（ユーザーが Template タブで上書き可能）
 * キー: actionId|variant または actionId
 */

export const DEFAULT_TEMPLATES = {
  'google_reply|stars_45': `{{customer}} 様

このたびは {{brand}}{{store}} へご来店・ご利用いただき、誠にありがとうございます。
{{stars}} の評価をいただき、スタッフ一同励みになります。

またのご利用を心よりお待ちしております。`,

  'google_reply|default': `{{customer}} 様

このたびは {{brand}}{{store}} をご利用いただき、ありがとうございます。
貴重なご意見に感謝いたします。

またのご利用を心よりお待ちしております。`,

  'google_reply_improve|stars_3': `{{customer}} 様

このたびは {{brand}}{{store}} をご利用いただき、ありがとうございます。
{{stars}} のご評価とご指摘を真摯に受け止めております。

いただいたご意見をもとに、サービス改善に努めてまいります。
またの機会がございましたら、ぜひお知らせください。`,

  'google_reply_improve|default': `{{customer}} 様

このたびは {{brand}}{{store}} をご利用いただき、ありがとうございます。
いただいたご意見をもとに、改善に努めてまいります。`,

  'internal_share|stars_12': `【社内共有 · Google口コミ】
評価: {{stars}}
投稿者: {{customer}}
店舗: {{store}}
URL: {{url}}

本文:
{{body}}

※確認のうえ対応方針を相談してください。`,

  'internal_share|default': `【社内共有】
タイトル: {{article_title}}
URL: {{url}}

{{body}}`,

  'note_template|stars_12': `【確認メモ】
日付: {{date}}
投稿者: {{customer}}
評価: {{stars}}
URL: {{url}}

要点:
{{body}}

次アクション: （担当が記入）`,

  'note_template|default': `【確認メモ】
{{article_title}}
{{url}}

{{body}}`,

  'quote_post|default': `ご紹介ありがとうございました。

「{{article_title}}」
{{url}}

{{brand}}`,

  'thanks_mail|default': `件名: ご紹介のお礼 — {{article_title}}

お世話になっております。{{brand}} です。

「{{article_title}}」にてご紹介いただき、誠にありがとうございます。
{{url}}

引き続きよろしくお願いいたします。`,

  'slack_share|default': `【Mention】{{site}}
{{article_title}}
{{url}}

{{body}}`,

  'slack_share|stars_45': `【Google口コミ ★高評価】
{{stars}} · {{customer}}
{{store}}
{{url}}

{{body}}`,

  'slack_share|stars_3': `【Google口コミ】
{{stars}} · {{customer}}
{{url}}

{{body}}`,

  'slack_share|stars_12': `【Google口コミ · 要確認】
{{stars}} · {{customer}}
{{url}}

{{body}}`,

  'correction_request|default': `お世話になっております。{{brand}} です。

下記ページの記載について、事実と異なる可能性がございます。
ご確認・ご修正をご検討いただけますと幸いです。

タイトル: {{article_title}}
URL: {{url}}

該当箇所の要旨:
{{body}}`,

  'pr_log|default': `{{date}}\t{{site}}\t{{article_title}}\t{{url}}`,

  'sns_share|default': `掲載いただきました。ありがとうございます。
{{article_title}}
{{url}}`,
};

/**
 * @param {string} actionId
 * @param {string} [variant]
 */
export function templateKey(actionId, variant = 'default') {
  return `${actionId}|${variant}`;
}

export function listDefaultTemplateEntries() {
  return Object.entries(DEFAULT_TEMPLATES).map(([key, body]) => {
    const [actionId, variant] = key.split('|');
    return { key, actionId, variant: variant || 'default', body };
  });
}
