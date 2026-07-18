/**
 * Hub IA — 検索 · カテゴリチップ · 最近/お気に入り
 * SSOT のみ読む（categories / hub-config / registry）。UI にカテゴリ名をハードコードしない。
 * 検索キーワード本文は Analytics に送らない。
 */
(function (global) {
  'use strict';

  var LS_FAV = 'favoriteTools';
  var LS_RECENT = 'recentTools';
  var LS_CAT = 'selectedCategory';
  var RECENT_MAX = 8;

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
    // shell 未読込時のフォールバック（クエリ付き .html 対応）
    if (!file) return 'hub.html';
    var qIdx = String(file).indexOf('?');
    var rawPath = qIdx >= 0 ? String(file).slice(0, qIdx) : String(file);
    var qs = qIdx >= 0 ? String(file).slice(qIdx) : '';
    var slug = rawPath.replace(/^\.\//, '').replace(/^\//, '').replace(/\.html$/i, '');
    var host = String(global.location && global.location.hostname || '');
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

  function init(categories, hubConfig, registry) {
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
    var cards = Array.prototype.slice.call(document.querySelectorAll('#sg-hub-grid .sg-hub-card'));

    var selected = localStorage.getItem(LS_CAT) || 'all';
    var query = '';

    function chipLabel(id) {
      return (hubConfig.chipLabels && hubConfig.chipLabels[id]) || (catById[id] && catById[id].label) || id;
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

      var main = ['all'].concat(order.filter(function (id) {
        if (!mobile) return true;
        return primarySet[id];
      }).slice(0, mobile ? maxMob : order.length));

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

    function cardVisible(card) {
      var cat = card.getAttribute('data-category-id') || '';
      var hay = card.getAttribute('data-search') || '';
      if (selected !== 'all' && cat !== selected) return false;
      if (query) {
        var q = query.toLowerCase().trim();
        if (q && hay.indexOf(q) === -1) return false;
      }
      return true;
    }

    function paint() {
      renderChips();
      var n = 0;
      cards.forEach(function (card) {
        var ok = cardVisible(card);
        card.classList.toggle('hidden', !ok);
        card.toggleAttribute('hidden', !ok);
        if (ok) n += 1;
      });
      if (emptyEl) {
        var showEmpty = n === 0;
        emptyEl.classList.toggle('hidden', !showEmpty);
        emptyEl.toggleAttribute('hidden', !showEmpty);
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
        sec.classList.add('hidden');
        sec.setAttribute('hidden', '');
        list.innerHTML = '';
        return;
      }
      sec.classList.remove('hidden');
      sec.removeAttribute('hidden');
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

    document.querySelectorAll('[data-fav-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
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

    global.addEventListener('resize', function () {
      paint();
    });

    paint();
  }

  function boot() {
    Promise.all([
      loadJson(dataUrl('categories.json')),
      loadJson(dataUrl('hub-config.json')),
      loadJson(dataUrl('tool-registry.json')),
    ])
      .then(function (pair) {
        init(pair[0], pair[1], pair[2]);
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

  /** shell から呼ぶ: 最近使った（id のみ） */
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
