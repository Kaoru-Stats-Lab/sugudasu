let readBarcodesFn = null;

async function ensureDecoder() {
  if (readBarcodesFn) return readBarcodesFn;
  const mod = await import('https://cdn.jsdelivr.net/npm/@sec-ant/zxing-wasm@2.2.4/+esm');
  if (typeof mod.readBarcodes !== 'function') {
    throw new Error('Decoder module unavailable');
  }
  readBarcodesFn = mod.readBarcodes;
  return readBarcodesFn;
}

function pickRawValue(result) {
  if (!result) return '';
  return String(
    result.text ||
      result.rawValue ||
      result.raw ||
      result.value ||
      (result.bytes ? new TextDecoder().decode(result.bytes) : '')
  ).trim();
}

self.onmessage = async (event) => {
  if (event.data?.type !== 'decode' || !event.data.bitmap) return;
  const bitmap = event.data.bitmap;
  const id = event.data.id;
  try {
    const readBarcodes = await ensureDecoder();
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas context unavailable');
    ctx.drawImage(bitmap, 0, 0);
    const image = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    const results = await readBarcodes(image, { formats: ['QRCode'] });
    const rawValue = pickRawValue(results && results[0]);
    self.postMessage({ type: 'decoded', id, rawValue });
  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    bitmap.close();
  }
};
