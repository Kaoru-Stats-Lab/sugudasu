import { copyWithFeedback } from './sg-copy-feedback.js';
import {
  DEFAULT_DECK,
  adoptCurrentStoryPoint,
  createPokerState,
  exportResultCsv,
  getDiscussionTargets,
  parseParticipants,
  parseStories,
  resetRound,
  revealVotes,
  setCurrentStory,
  setReason,
  setVote,
  voteStats,
} from './planning-poker-engine.js';

/**
 * @param {HTMLElement} root
 */
export function mountPlanningPoker(root) {
  const els = {
    storiesInput: root.querySelector('#pp-stories-input'),
    participantsInput: root.querySelector('#pp-participants-input'),
    myName: root.querySelector('#pp-my-name'),
    start: root.querySelector('#pp-start'),
    error: root.querySelector('#pp-error'),
    workspace: root.querySelector('#pp-workspace'),
    empty: root.querySelector('#pp-empty'),
    setup: root.querySelector('#pp-setup'),
    setupToggle: root.querySelector('#pp-setup-toggle'),
    setupToggleLabel: root.querySelector('#pp-setup-toggle-label'),
    setupChevron: root.querySelector('#pp-setup-chevron'),
    storyBlock: root.querySelector('#pp-story-block'),
    storyToggle: root.querySelector('#pp-story-toggle'),
    storyChevron: root.querySelector('#pp-story-chevron'),
    storyList: root.querySelector('#pp-story-list'),
    participantList: root.querySelector('#pp-participant-list'),
    currentStory: root.querySelector('#pp-current-story'),
    cardGrid: root.querySelector('#pp-card-grid'),
    revealBtn: root.querySelector('#pp-reveal'),
    resetBtn: root.querySelector('#pp-reset-round'),
    nextStoryBtn: root.querySelector('#pp-next-story'),
    timerSelect: root.querySelector('#pp-timer-select'),
    timerStart: root.querySelector('#pp-timer-start'),
    timerStop: root.querySelector('#pp-timer-stop'),
    timerView: root.querySelector('#pp-timer-view'),
    statAvg: root.querySelector('#pp-stat-avg'),
    statMedian: root.querySelector('#pp-stat-median'),
    statMin: root.querySelector('#pp-stat-min'),
    statMax: root.querySelector('#pp-stat-max'),
    revealWaiting: root.querySelector('#pp-reveal-waiting'),
    revealPanel: root.querySelector('#pp-reveal-panel'),
    discussionPanel: root.querySelector('#pp-discussion-panel'),
    adoptSelect: root.querySelector('#pp-adopt-point'),
    adoptBtn: root.querySelector('#pp-adopt'),
    exportCsv: root.querySelector('#pp-export-csv'),
    darkToggle: root.querySelector('#pp-dark-toggle'),
    activeVoterLabel: root.querySelector('#pp-active-voter'),
  };

  let state = null;
  let myParticipantId = '';
  /** @type {string} 司会がカード入力する対象（参加者 id） */
  let activeVoterId = '';
  let timerId = 0;
  let timerLeftSec = 0;
  /** Reveal直後の理由欄フォーカスを1回だけ当てる */
  let focusReasonAfterReveal = false;

  function setSetupCollapsed(collapsed) {
    if (!els.setup) return;
    els.setup.classList.toggle('is-collapsed', collapsed);
    if (els.setupToggle) els.setupToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if (els.setupChevron) els.setupChevron.textContent = collapsed ? '▸' : '▾';
    if (els.setupToggleLabel) {
      els.setupToggleLabel.textContent = collapsed ? '開始セットアップ（再編集）' : '開始セットアップ';
    }
  }

  function setStoryListCollapsed(collapsed) {
    if (!els.storyBlock) return;
    els.storyBlock.classList.toggle('is-collapsed', collapsed);
    if (els.storyToggle) els.storyToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if (els.storyChevron) els.storyChevron.textContent = collapsed ? '▸' : '▾';
  }

  function setError(msg) {
    if (!els.error) return;
    if (!msg) {
      els.error.textContent = '';
      els.error.classList.add('hidden');
      return;
    }
    els.error.textContent = msg;
    els.error.classList.remove('hidden');
  }

  function startSession() {
    setError('');
    const stories = parseStories(els.storiesInput?.value || '');
    const participants = parseParticipants(els.participantsInput?.value || '');
    const myName = String(els.myName?.value || '').trim();

    if (!stories.length) return setError('Storyを1件以上入力してください。');
    if (!participants.length) return setError('参加者を1名以上入力してください。');
    if (!myName) return setError('あなたの名前を入力してください。');

    state = createPokerState(stories, participants);
    const me = participants.find((p) => p.name === myName);
    if (!me) return setError('あなたの名前は参加者一覧に含めてください。');
    myParticipantId = me.id;
    // DECISION: 開始直後は司会本人。一覧タップで入力先を切り替え全員分を伏せ入力できる（SPEC §3.1 core 次）。
    activeVoterId = me.id;
    els.empty?.classList.add('hidden');
    els.workspace?.classList.remove('hidden');
    setSetupCollapsed(true);
    setStoryListCollapsed(true);
    render();
  }

  function render() {
    if (!state) return;
    if (!state.participants.some((p) => p.id === activeVoterId)) {
      activeVoterId = myParticipantId || state.participants[0]?.id || '';
    }
    root.classList.toggle('pp-revealed', !!state.reveal);
    renderStories();
    renderParticipants();
    renderCurrentStory();
    renderActiveVoter();
    renderCards();
    renderRevealPanel();
    renderStats();
    renderDiscussion();
    syncAdoptOptions();
    els.nextStoryBtn.disabled = state.currentStoryIndex >= state.stories.length - 1;
    if (focusReasonAfterReveal) {
      focusReasonAfterReveal = false;
      const firstReason = els.discussionPanel?.querySelector('[data-reason-for]');
      if (firstReason instanceof HTMLInputElement) {
        queueMicrotask(() => firstReason.focus());
      }
    }
  }

  function renderStories() {
    const current = state.currentStoryIndex;
    els.storyList.innerHTML = state.stories
      .map((s, idx) => {
        const active = idx === current ? 'pp-story--active' : '';
        const final = s.finalPoint ? `<span class="pp-story-point">${esc(s.finalPoint)}</span>` : '';
        return `<button type="button" class="pp-story ${active}" data-story-idx="${idx}"><span>${esc(s.title)}</span>${final}</button>`;
      })
      .join('');
    els.storyList.querySelectorAll('[data-story-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-story-idx'));
        setCurrentStory(state, idx);
        stopTimer();
        render();
      });
    });
  }

  function renderParticipants() {
    els.participantList.innerHTML = state.participants
      .map((p) => {
        const vote = state.votes.get(p.id);
        const hasVote = !!vote;
        const mask = state.reveal ? esc(vote || '-') : hasVote ? '投票済み' : '未投票';
        const me = p.id === myParticipantId ? '（あなた）' : '';
        const active = p.id === activeVoterId ? 'pp-participant--active' : '';
        // Reveal前は未入力を薄く、入力済みを通常濃さで区別（色は増やさない）
        const voteState = state.reveal
          ? ''
          : hasVote
            ? 'pp-participant--voted'
            : 'pp-participant--pending';
        // ●/○ で色以外でも入力状況が分かる（投影・色覚配慮）
        const mark = state.reveal ? '' : hasVote ? '●' : '○';
        const markHtml = mark
          ? `<span class="pp-participant__mark" aria-hidden="true">${mark}</span>`
          : '';
        return `<li><button type="button" class="pp-participant ${active} ${voteState}" data-voter-id="${escAttr(p.id)}"><span class="inline-flex items-center gap-1.5 min-w-0">${markHtml}<span class="truncate">${esc(p.name)} ${me}</span></span><strong>${mask}</strong></button></li>`;
      })
      .join('');
    els.participantList.querySelectorAll('[data-voter-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.reveal) return;
        activeVoterId = btn.getAttribute('data-voter-id') || activeVoterId;
        render();
      });
    });
  }

  function renderActiveVoter() {
    if (!els.activeVoterLabel || !state) return;
    const p = state.participants.find((x) => x.id === activeVoterId);
    if (state.reveal) {
      els.activeVoterLabel.textContent = 'Reveal済み。再投票で入力を再開できます。';
      return;
    }
    els.activeVoterLabel.textContent = p
      ? `入力中: ${p.name} — 口頭・チャットで受けた点数をカードで伏せ入力。全員そろったら Reveal。`
      : '左の参加者を選んで入力してください。';
  }

  function renderCurrentStory() {
    const story = state.stories[state.currentStoryIndex];
    els.currentStory.textContent = story ? story.title : '—';
  }

  function renderCards() {
    const locked = !!state.reveal;
    els.cardGrid.innerHTML = DEFAULT_DECK
      .map((point) => {
        const selected = state.selectedPointByParticipant.get(activeVoterId) === point ? 'pp-card--selected' : '';
        return `<button type="button" class="pp-card ${selected}" data-point="${escAttr(point)}" ${locked ? 'disabled' : ''}>${esc(point)}</button>`;
      })
      .join('');
    els.cardGrid.querySelectorAll('[data-point]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.reveal || !activeVoterId) return;
        const point = btn.getAttribute('data-point') || '';
        setVote(state, activeVoterId, point);
        advanceActiveVoter();
        render();
      });
    });
  }

  /** 司会向け: 入力後は未投票の次の人へ（SPEC 司会代行の摩擦低減） */
  function advanceActiveVoter() {
    if (!state || state.reveal) return;
    const list = state.participants;
    const idx = list.findIndex((p) => p.id === activeVoterId);
    for (let step = 1; step <= list.length; step += 1) {
      const cand = list[(idx + step) % list.length];
      if (!state.votes.has(cand.id)) {
        activeVoterId = cand.id;
        return;
      }
    }
  }

  function renderRevealPanel() {
    const voted = state.votes.size;
    const total = state.participants.length;
    els.revealBtn.disabled = voted === 0 || state.reveal;
    if (els.revealWaiting) {
      els.revealWaiting.textContent = `Revealすると結果がここに表示されます（${voted}/${total} 投票済み）`;
    }
    if (!state.reveal) {
      els.revealPanel.innerHTML = '';
      return;
    }
    els.revealPanel.innerHTML = state.participants
      .map((p) => `<li class="pp-reveal-item"><span>${esc(p.name)}</span><strong>${esc(state.votes.get(p.id) || '-')}</strong></li>`)
      .join('');
  }

  function renderStats() {
    if (!state.reveal) {
      els.statAvg.textContent = '―';
      els.statMedian.textContent = '―';
      els.statMin.textContent = '―';
      els.statMax.textContent = '―';
      return;
    }
    const st = voteStats(state);
    els.statAvg.textContent = st.avg == null ? '―' : String(st.avg);
    els.statMedian.textContent = st.median == null ? '―' : String(st.median);
    els.statMin.textContent = st.min == null ? '―' : String(st.min);
    els.statMax.textContent = st.max == null ? '―' : String(st.max);
  }

  function renderDiscussion() {
    if (!state.reveal) {
      els.discussionPanel.innerHTML = '';
      return;
    }
    const targets = getDiscussionTargets(state);
    if (!targets.length) {
      els.discussionPanel.innerHTML = '<p class="text-xs text-slate-500">数値投票がないため理由欄は表示されません。</p>';
      return;
    }
    const st = voteStats(state);
    els.discussionPanel.innerHTML = targets
      .map((id) => {
        const p = state.participants.find((x) => x.id === id);
        const vote = state.votes.get(id) || '-';
        const reason = state.reasons.get(id) || '';
        const n = Number(vote);
        let tag = '';
        if (Number.isFinite(n) && st.min != null && n === st.min) tag = ' ▼最小';
        if (Number.isFinite(n) && st.max != null && n === st.max) tag = tag ? ' ▲最大/▼最小' : ' ▲最大';
        return `
          <label class="pp-reason">
            <span>${esc(p?.name || '')}（${esc(vote)}${tag}）の理由</span>
            <input type="text" data-reason-for="${escAttr(id)}" class="sg-input text-sm" value="${escAttr(reason)}" placeholder="例: API境界の未知要素が多い">
          </label>
        `;
      })
      .join('');
    els.discussionPanel.querySelectorAll('[data-reason-for]').forEach((input) => {
      input.addEventListener('input', () => {
        setReason(state, input.getAttribute('data-reason-for') || '', input.value);
      });
    });
  }

  function syncAdoptOptions() {
    const values = Array.from(state.votes.values());
    const uniq = Array.from(new Set(values)).filter(Boolean);
    const current = state.stories[state.currentStoryIndex]?.finalPoint || '';
    els.adoptSelect.innerHTML = uniq.length
      ? uniq.map((v) => `<option value="${escAttr(v)}">${esc(v)}</option>`).join('')
      : '<option value="">未投票</option>';
    if (current && uniq.includes(current)) els.adoptSelect.value = current;
  }

  function revealAll() {
    if (!state || state.reveal) return;
    revealVotes(state);
    focusReasonAfterReveal = true;
    render();
  }

  function nextStory() {
    if (!state) return;
    const next = Math.min(state.currentStoryIndex + 1, state.stories.length - 1);
    setCurrentStory(state, next);
    stopTimer();
    render();
  }

  function adoptPoint() {
    if (!state) return;
    const v = els.adoptSelect.value;
    if (!v) return;
    adoptCurrentStoryPoint(state, v);
    renderStories();
  }

  function exportCsv() {
    if (!state) return;
    const csv = exportResultCsv(state);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `planning-poker-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function onKeydown(e) {
    if (!state) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (/^[1-9]$/.test(e.key)) {
      if (state.reveal || !activeVoterId) return;
      const map = { '1': '1', '2': '2', '3': '3', '4': '5', '5': '8', '6': '13', '7': '21', '8': '34', '9': '55' };
      const point = map[e.key];
      if (point) {
        setVote(state, activeVoterId, point);
        advanceActiveVoter();
        render();
      }
      return;
    }
    if (e.key === 'Enter') {
      revealAll();
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.reveal) {
        resetRound(state);
        render();
      } else {
        revealAll();
      }
    }
  }

  function startTimer() {
    stopTimer();
    timerLeftSec = Number(els.timerSelect.value || 60);
    renderTimer();
    timerId = window.setInterval(() => {
      timerLeftSec -= 1;
      renderTimer();
      if (timerLeftSec <= 0) stopTimer();
    }, 1000);
  }

  function stopTimer() {
    if (timerId) window.clearInterval(timerId);
    timerId = 0;
  }

  function renderTimer() {
    const m = Math.floor(Math.max(0, timerLeftSec) / 60);
    const s = Math.max(0, timerLeftSec) % 60;
    els.timerView.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function toggleDark() {
    root.classList.toggle('pp-dark');
  }

  els.start?.addEventListener('click', startSession);
  els.revealBtn?.addEventListener('click', revealAll);
  els.resetBtn?.addEventListener('click', () => {
    if (!state) return;
    resetRound(state);
    render();
  });
  els.nextStoryBtn?.addEventListener('click', nextStory);
  els.adoptBtn?.addEventListener('click', adoptPoint);
  els.exportCsv?.addEventListener('click', exportCsv);
  els.timerStart?.addEventListener('click', startTimer);
  els.timerStop?.addEventListener('click', stopTimer);
  els.darkToggle?.addEventListener('click', toggleDark);
  els.setupToggle?.addEventListener('click', () => {
    const collapsed = !els.setup?.classList.contains('is-collapsed');
    setSetupCollapsed(collapsed);
  });
  els.storyToggle?.addEventListener('click', () => {
    const collapsed = !els.storyBlock?.classList.contains('is-collapsed');
    setStoryListCollapsed(collapsed);
  });
  window.addEventListener('keydown', onKeydown);

  root.querySelector('#pp-copy-template')?.addEventListener('click', async (e) => {
    const sample = `Login画面改善\n請求書PDF余白調整\nCSV取込のエラー表示`;
    await copyWithFeedback(sample, e.currentTarget, { copiedLabel: 'Story雛形をコピーしました' });
  });

  renderTimer();
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escAttr(s) {
  return esc(s).replace(/"/g, '&quot;');
}
