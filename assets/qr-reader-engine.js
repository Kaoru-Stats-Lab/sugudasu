function normalizeResult(result) {
  if (!result) return '';
  return String(result.rawValue || result.raw || result.value || '').trim();
}

export class QrReaderEngine {
  constructor() {
    // DECISION: BarcodeDetector優先で依存と処理コストを最小化し、非対応環境のみWorker/WASMへフォールバック。
    this.nativeDetector = 'BarcodeDetector' in window
      ? new BarcodeDetector({ formats: ['qr_code'] })
      : null;
    this.worker = null;
    this.pending = new Map();
    this.seq = 0;
  }

  hasNativeDetector() {
    return !!this.nativeDetector;
  }

  async decodeSource(source) {
    if (this.nativeDetector) {
      const results = await this.nativeDetector.detect(source);
      return normalizeResult(results && results[0]);
    }
    // DECISION: 非対応時のみImageBitmap経由でWorkerへ渡し、メインスレッド描画の引っ掛かりを回避。
    const bitmap = source instanceof ImageBitmap ? source : await createImageBitmap(source);
    return this.decodeWithWorker(bitmap);
  }

  async decodeBitmap(bitmap) {
    if (this.nativeDetector) {
      try {
        return await this.decodeSource(bitmap);
      } finally {
        bitmap.close();
      }
    }
    return this.decodeWithWorker(bitmap);
  }

  async decodeWithWorker(bitmap) {
    const worker = this.ensureWorker();
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ type: 'decode', id, bitmap }, [bitmap]);
    });
  }

  ensureWorker() {
    if (this.worker) return this.worker;
    this.worker = new Worker('../assets/qr-reader-worker.js', { type: 'module' });
    this.worker.onmessage = (event) => {
      const data = event.data || {};
      const request = this.pending.get(data.id);
      if (!request) return;
      this.pending.delete(data.id);
      if (data.type === 'decoded') request.resolve(String(data.rawValue || ''));
      else request.reject(new Error(data.message || 'QR decode failed'));
    };
    this.worker.onerror = () => {
      for (const [, request] of this.pending.entries()) {
        request.reject(new Error('Worker crashed'));
      }
      this.pending.clear();
    };
    return this.worker;
  }

  dispose() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pending.clear();
  }
}
