/** Load JSZip UMD once for browser modules. */
let cache = null;

export async function loadJSZip() {
  if (cache) return cache;
  if (globalThis.JSZip) {
    cache = globalThis.JSZip;
    return cache;
  }
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = new URL("./jszip.min.js", import.meta.url).href;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("JSZip failed to load"));
    document.head.appendChild(s);
  });
  if (!globalThis.JSZip) throw new Error("JSZip global missing after load");
  cache = globalThis.JSZip;
  return cache;
}
