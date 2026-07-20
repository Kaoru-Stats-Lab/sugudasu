/**
 * Hub 検索エンジンのブラウザ boot（type=module）
 * classic の hub-ia.js が globalThis.SUGUDASU_HUB_SEARCH を使う。
 */
import * as HubSearch from './hub-search-engine.js';

globalThis.SUGUDASU_HUB_SEARCH = HubSearch;
document.dispatchEvent(new Event('sg-hub-search-ready'));
