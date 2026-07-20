/**
 * Hub IA — 検索 · カテゴリチップ · 最近/お気に入り · 検索モード / 人気
 * SSOT のみ読む（categories / hub-config / registry / hub-search-bundle）。
 * 検索キーワード本文は Analytics に送らない。
 */
(function (global) {
  'use strict';

  var LS_FAV = 'favoriteTools';
  var LS_RECENT = 'recentTools';
  var LS_CAT = 'selectedCategory';
  var RECENT_MAX = 8;

  // Fallback（hub-config 未読込時）。正本は hub-config.json の *Chips。
  var FALLBACK_SEARCH_CHIPS = [
    { label: '請求書', q: '請求書' },
    { label: 'PDF', q: 'PDF' },
    { label: '画像', q: '画像' },
    { label: 'QR', q: 'QR' },
    { label: 'シフト', q: 'シフト' },
  ];
  var FALLBACK_EMPTY_RECOMMEND = [
    { label: '請求書', q: '請求書' },
    { label: '画像切り出し', q: '画像切り出し' },
    { label: 'テキスト整え', q: 'テキスト整え' },
  ];
  var FALLBACK_EMPTY_POPULAR = [
    { label: 'インボイス', q: 'インボイス' },
    { label: '透かし', q: '透かし' },
    { label: '割り勘', q: '割り勘' },
  ];
  var FALLBACK_EMPTY_EXAMPLES = [
    { label: 'コピペ', q: 'コピペ' },
    { label: '表 / CSV', q: '表 CSV' },
    { label: 'PDF 抽出', q: 'PDF 画像' },
    { label: 'ハンコ', q: 'ハンコ' },
  ];

  // TODO(Phase2 · 保留): カテゴリをマルチタグ化する可能性。
  // 現状 tool-registry.categoryId は 1 値。100 ツール超で QR読取=画像+QR+OCR 等が必要になったら
  // categoryIds: string[] へ拡張し、chip 交差を OR/AND で再設計する。今回は実装しない。
  // SSOT 候補: data/categories.json · tool-registry · hub-ia cardMatchesCategory。

  function dataUrl(file) {
    if (global.SUGUDASU_SHELL && typeof global.SUGUDASU_SHELL.dataUrl === 'function') {
      return global.SUGUDASU_SHELL.dataUrl(file);
    }
    var link = document.querySelector('link[href*="sugudasu.css"]');
    if (link && link.getAttribute('href')) {
      var href = link.getAttribute('href');
      if (href.indexOf('/assets/') !== -1) return href.replace(/assets\/sugudasu\.css.*$/, 'data/' + file);
      return href.replace(/sugudasu\.css.*$/, '../data/' + file);
    }
    return '../data/' + file;
  }

  function pageHref(file) {
    if (global.SUGUDASU_SHELL && typeof global.SUGUDASU_SHELL.pageHref === 'function') {
      return global.SUGUDASU_SHELL.pageHref(file);
    }
    if (!file) return 'hub.html';
    var qIdx = String(file).indexOf('?');
    var rawPath = qIdx >= 0 ? String(file).slice(0, qIdx) : String(file);
    var qs = qIdx >= 0 ? String(file).slice(qIdx) : '';
    var slug = rawPath.replace(/^\.\//, '').replace(/^\//, '').replace(/\.html$/i, '');
    var host = String((global.location && global.location.hostname) || '');
    var prod = host === 'sugudasu.com' || /\.pages\.dev$/i.test(host);
    if (!slug || slug === 'hub' || slug === 'index') return (prod ? '/' : 'hub.html') + qs;
    if (prod) return '/' + slug + qs;
    return (rawPath.endsWith('.html') ? rawPath.replace(/^\//, '') : slug + '.html') + qs;
  }

  function readJsonArr(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch (_) {
      return [];
    }
  }

  function writeJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {
      /* quota / private mode */
    }
  }

  function track(name, params) {
    if (global.SUGUDASU_SHELL && typeof global.SUGUDASU_SHELL.trackGaEvent === 'function') {
      global.SUGUDASU_SHELL.trackGaEvent(name, params || {});
    }
  }

  function loadJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url);
      return r.json();
    });
  }

  function isMobile() {
    return global.matchMedia && global.matchMedia('(max-width: 639px)').matches;
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.classList.toggle('hidden', hidden);
    if (hidden) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
  }

  function init(categories, hubConfig, registry, searchBundle) {
    var catById = {};
    (categories.categories || []).forEach(function (c) {
      catById[c.id] = c;
    });

    var searchEl = document.getElementById('sg-hub-search');
    var chipsEl = document.getElementById('sg-hub-chips');
    var moreWrap = document.getElementById('sg-hub-more-wrap');
    var moreBtn = document.getElementById('sg-hub-more-btn');
    var morePanel = document.getElementById('sg-hub-more-panel');
    var emptyEl = document.getElementById('sg-hub-empty');
    var emptyRecommend = document.getElementById('sg-hub-empty-recommend');
    var emptyPopular = document.getElementById('sg-hub-empty-popular');
    var emptyExamples = document.getElementById('sg-hub-empty-examples');
    var searchPanel = document.getElementById('sg-hub-search-panel');
    var resultCountEl = document.getElementById('sg-hub-result-count');
    var clearBtn = document.getElementById('sg-hub-clear-search');
    var emptyClearBtn = document.getElementById('sg-hub-empty-clear');
    var browseRails = document.getElementById('sg-hub-browse-rails');
    var popularSection = document.getElementById('sg-hub-popular-section');
    var popularGrid = document.getElementById('sg-hub-popular-grid');
    var allSection = document.getElementById('sg-hub-all-section');
    var allTitle = document.getElementById('sg-hub-all-title');
    var searchExamples = document.getElementById('sg-hub-search-examples');
    var searchExampleChips = document.getElementById('sg-hub-search-example-chips');
    var gridEl = document.getElementById('sg-hub-grid');
    var cards = Array.prototype.slice.call(document.querySelectorAll('#sg-hub-grid .sg-hub-card'));

    var selected = localStorage.getItem(LS_CAT) || 'all';
    var query = '';
    var popularIds = hubConfig.popularToolIds || [];
    // DECISION: 辞書検索は hub-search-bundle + SUGUDASU_HUB_SEARCH。未読込時は data-search 部分一致にフォールバック。
    var dictIndex =
      searchBundle && Array.isArray(searchBundle.terms)
        ? {
            terms: searchBundle.terms,
            toolIds: searchBundle.toolIds || [],
            brandRules: searchBundle.brandRules || [],
            thesaurusRules: searchBundle.thesaurusRules || [],
            intentRules: searchBundle.intentRules || [],
          }
        : null;

    function chipLabel(id) {
      return (hubConfig.chipLabels && hubConfig.chipLabels[id]) || (catById[id] && catById[id].label) || id;
    }

    function isSearching() {
      return !!(query && String(query).trim());
    }

    function runSearchQuery(q, opts) {
      query = String(q || '');
      if (searchEl) searchEl.value = query;
      if (opts && opts.track && query.trim()) {
        track('search_used', { has_query: true });
      }
      paint();
      if (searchEl && opts && opts.focus) searchEl.focus();
    }

    function clearSearch() {
      runSearchQuery('', { focus: true });
    }

    function tipChipHtml(t) {
      var q = String((t && t.q) || '').replace(/"/g, '');
      var label = String((t && t.label) || q);
      return (
        '<button type="button" class="sg-hub-empty__chip" data-tip-q="' +
        q +
        '">' +
        label +
        '</button>'
      );
    }

    function bindTipChips(container) {
      if (!container) return;
      container.querySelectorAll('[data-tip-q]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          runSearchQuery(btn.getAttribute('data-tip-q') || '', { track: true });
        });
      });
    }

    function renderSearchExampleChips() {
      if (!searchExampleChips) return;
      var list = hubConfig.searchExampleChips || FALLBACK_SEARCH_CHIPS;
      searchExampleChips.innerHTML = list
        .map(function (t) {
          var q = String((t && t.q) || '').replace(/"/g, '');
          var label = String((t && t.label) || q);
          return (
            '<button type="button" class="sg-hub-search-exchip" data-tip-q="' +
            q +
            '">' +
            label +
            '</button>'
          );
        })
        .join('');
      bindTipChips(searchExampleChips);
    }

    function renderEmptyTips() {
      var rec = hubConfig.emptyRecommendChips || FALLBACK_EMPTY_RECOMMEND;
      var pop = hubConfig.emptyPopularSearchChips || FALLBACK_EMPTY_POPULAR;
      var ex = hubConfig.emptyExampleChips || FALLBACK_EMPTY_EXAMPLES;
      if (emptyRecommend) {
        emptyRecommend.innerHTML = rec.map(tipChipHtml).join('');
        bindTipChips(emptyRecommend);
      }
      if (emptyPopular) {
        emptyPopular.innerHTML = pop.map(tipChipHtml).join('');
        bindTipChips(emptyPopular);
      }
      if (emptyExamples) {
        emptyExamples.innerHTML = ex.map(tipChipHtml).join('');
        bindTipChips(emptyExamples);
      }
    }

    function renderChips() {
      if (!chipsEl) return;
      var order = hubConfig.chipOrder || Object.keys(catById);
      var primary = hubConfig.primaryCategories || [];
      var maxMob = hubConfig.maxVisibleChipsMobile || 4;
      var mobile = isMobile();
      var primarySet = {};
      primary.forEach(function (id) {
        primarySet[id] = true;
      });

      var main = ['all'].concat(
        order
          .filter(function (id) {
            if (!mobile) return true;
            return primarySet[id];
          })
          .slice(0, mobile ? maxMob : order.length)
      );

      var overflow = mobile
        ? order.filter(function (id) {
            return main.indexOf(id) === -1;
          })
        : [];

      function mkBtn(id, label, pressed) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sg-hub-chip' + (pressed ? ' is-active' : '');
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', pressed ? 'true' : 'false');
        b.dataset.category = id;
        b.textContent = label;
        b.addEventListener('click', function () {
          selected = id;
          try {
            localStorage.setItem(LS_CAT, id);
          } catch (_) {}
          track('category_selected', { category_id: id });
          paint();
        });
        return b;
      }

      chipsEl.innerHTML = '';
      chipsEl.appendChild(mkBtn('all', 'すべて', selected === 'all'));
      main.forEach(function (id) {
        if (id === 'all') return;
        if (!catById[id]) return;
        chipsEl.appendChild(mkBtn(id, chipLabel(id), selected === id));
      });

      if (moreWrap && moreBtn && morePanel) {
        if (overflow.length) {
          moreWrap.classList.remove('hidden');
          morePanel.innerHTML = '';
          overflow.forEach(function (id) {
            if (!catById[id]) return;
            morePanel.appendChild(mkBtn(id, chipLabel(id), selected === id));
          });
          moreBtn.onclick = function () {
            var open = morePanel.hasAttribute('hidden');
            if (open) {
              morePanel.removeAttribute('hidden');
              morePanel.classList.remove('hidden');
            } else {
              morePanel.setAttribute('hidden', '');
              morePanel.classList.add('hidden');
            }
          };
        } else {
          moreWrap.classList.add('hidden');
          morePanel.setAttribute('hidden', '');
          morePanel.classList.add('hidden');
        }
      }
    }

    function rankedHits() {
      var q = (query || '').trim();
      if (!q) return null;
      var eng = global.SUGUDASU_HUB_SEARCH;
      if (!dictIndex || !eng || typeof eng.search !== 'function') return null;
      return eng.search(dictIndex, q, { limit: 80, minScore: 1 });
    }

    function cardMatchesSearch(card, scoreMap) {
      var toolId = card.getAttribute('data-tool-id') || '';
      var hay = card.getAttribute('data-search') || '';
      if (!isSearching()) return true;
      if (scoreMap) return scoreMap.has(toolId);
      var q = String(query).toLowerCase().trim();
      return !q || hay.indexOf(q) !== -1;
    }

    function cardMatchesCategory(card) {
      // TODO(Phase2 · 保留): multi-tag — data-category-ids 交差に拡張する可能性。現状は単一 categoryId。
      var cat = card.getAttribute('data-category-id') || '';
      if (selected === 'all') return true;
      return cat === selected;
    }

    function renderPopularClones() {
      if (!popularGrid) return;
      popularGrid.innerHTML = '';
      if (isSearching()) return;
      var seen = {};
      popularIds.forEach(function (id) {
        if (seen[id]) return;
        seen[id] = true;
        var src = cards.filter(function (c) {
          return c.getAttribute('data-tool-id') === id && cardMatchesCategory(c);
        })[0];
        if (!src) return;
        var clone = src.cloneNode(true);
        clone.classList.add('sg-hub-card--clone');
        popularGrid.appendChild(clone);
      });
      setHidden(popularSection, !popularGrid.children.length);
    }

    function paint() {
      renderChips();
      var searching = isSearching();
      var hits = rankedHits();
      var scoreMap = null;
      var rankMap = {};
      if (hits && global.SUGUDASU_HUB_SEARCH && typeof global.SUGUDASU_HUB_SEARCH.hitScoreMap === 'function') {
        scoreMap = global.SUGUDASU_HUB_SEARCH.hitScoreMap(hits);
        hits.forEach(function (h, i) {
          rankMap[h.toolId] = i + 1;
        });
      }

      setHidden(searchPanel, !searching);
      setHidden(browseRails, searching);
      setHidden(searchExamples, searching);
      if (allTitle) {
        allTitle.textContent = searching ? '' : 'すべてのツール';
        setHidden(allTitle, searching);
      }
      if (popularSection) {
        if (searching) setHidden(popularSection, true);
      }

      var n = 0;
      cards.forEach(function (card, idx) {
        var toolId = card.getAttribute('data-tool-id') || '';
        var ok = cardMatchesCategory(card) && cardMatchesSearch(card, scoreMap);
        setHidden(card, !ok);
        if (searching && ok && rankMap[toolId]) {
          card.style.order = String(rankMap[toolId]);
        } else {
          card.style.order = String(1000 + idx);
        }
        if (ok) n += 1;
      });

      if (resultCountEl) {
        resultCountEl.textContent = n + '件見つかりました';
      }
      setHidden(emptyEl, !(searching && n === 0));
      if (gridEl) {
        setHidden(gridEl, searching && n === 0);
      }
      setHidden(allSection, searching && n === 0);

      if (!searching) {
        setHidden(allSection, false);
        setHidden(gridEl, false);
        renderPopularClones();
      }

      syncFavButtons();
      renderRails();
    }

    function syncFavButtons() {
      var favs = readJsonArr(LS_FAV);
      document.querySelectorAll('[data-fav-toggle]').forEach(function (btn) {
        var id = btn.getAttribute('data-fav-toggle');
        var on = favs.indexOf(id) !== -1;
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.textContent = on ? '★' : '☆';
        btn.classList.toggle('is-on', on);
      });
    }

    function toolMeta(id) {
      return (registry.tools && registry.tools[id]) || null;
    }

    function renderRails() {
      if (isSearching()) {
        setHidden(document.getElementById('sg-hub-favorites'), true);
        setHidden(document.getElementById('sg-hub-recent'), true);
        return;
      }
      renderRail('sg-hub-favorites', 'sg-hub-favorites-list', readJsonArr(LS_FAV));
      renderRail('sg-hub-recent', 'sg-hub-recent-list', readJsonArr(LS_RECENT).slice(0, RECENT_MAX));
    }

    function renderRail(secId, listId, ids) {
      var sec = document.getElementById(secId);
      var list = document.getElementById(listId);
      if (!sec || !list) return;
      var items = ids
        .map(function (id) {
          return { id: id, meta: toolMeta(id) };
        })
        .filter(function (x) {
          return x.meta && x.meta.inNav && x.meta.file;
        });
      if (!items.length) {
        setHidden(sec, true);
        list.innerHTML = '';
        return;
      }
      setHidden(sec, false);
      list.innerHTML = items
        .map(function (x) {
          var href = pageHref(x.meta.file);
          var label = x.meta.conceptName || x.meta.navLabel || x.id;
          return (
            '<a class="sg-hub-rail__link" href="' +
            href +
            '" data-rail-tool="' +
            x.id +
            '">' +
            label +
            '</a>'
          );
        })
        .join('');
      list.querySelectorAll('[data-rail-tool]').forEach(function (a) {
        a.addEventListener('click', function () {
          track('recent_opened', { tool_id: a.getAttribute('data-rail-tool') });
        });
      });
    }

    // クローン含むお気に入りは委譲
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('[data-fav-toggle]');
      if (!btn || !document.contains(btn)) return;
      if (!btn.closest('#sg-hub-grid, #sg-hub-popular-grid')) return;
      e.preventDefault();
      e.stopPropagation();
      var id = btn.getAttribute('data-fav-toggle');
      var favs = readJsonArr(LS_FAV);
      var i = favs.indexOf(id);
      if (i === -1) {
        favs.push(id);
        track('favorite_added', { tool_id: id });
      } else {
        favs.splice(i, 1);
        track('favorite_removed', { tool_id: id });
      }
      writeJson(LS_FAV, favs);
      syncFavButtons();
      renderRails();
    });

    if (searchEl) {
      var searchTracked = false;
      searchEl.addEventListener('input', function () {
        query = searchEl.value || '';
        if (!searchTracked && query.trim()) {
          searchTracked = true;
          track('search_used', { has_query: true });
        }
        paint();
      });
    }

    if (clearBtn) clearBtn.addEventListener('click', clearSearch);
    if (emptyClearBtn) emptyClearBtn.addEventListener('click', clearSearch);

    renderSearchExampleChips();
    renderEmptyTips();

    global.addEventListener('resize', function () {
      paint();
    });

    paint();
  }

  function waitHubSearch(ms) {
    if (global.SUGUDASU_HUB_SEARCH) return Promise.resolve();
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      document.addEventListener('sg-hub-search-ready', finish, { once: true });
      setTimeout(finish, ms || 1500);
    });
  }

  function boot() {
    Promise.all([
      loadJson(dataUrl('categories.json')),
      loadJson(dataUrl('hub-config.json')),
      loadJson(dataUrl('tool-registry.json')),
      loadJson(dataUrl('hub-search-bundle.json')).catch(function () {
        return null;
      }),
      waitHubSearch(1500),
    ])
      .then(function (pair) {
        init(pair[0], pair[1], pair[2], pair[3]);
      })
      .catch(function () {
        /* Hub は静的カードだけでも閲覧可 */
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.SUGUDASU_HUB_IA = {
    pushRecent: function (toolId) {
      if (!toolId || toolId === 'hub') return;
      var list = readJsonArr(LS_RECENT).filter(function (x) {
        return x !== toolId;
      });
      list.unshift(toolId);
      writeJson(LS_RECENT, list.slice(0, RECENT_MAX));
    },
  };
})(window);
