/**
 * SUGUDASU プランニングポーカー エンジン
 * 認識差の可視化を最短化するため、状態は最小限で管理する。
 */

export const DEFAULT_DECK = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'];

/**
 * @typedef {{ id: string, title: string, finalPoint: string }} Story
 * @typedef {{ id: string, name: string }} Participant
 */

/**
 * @param {string} text
 * @returns {Story[]}
 */
export function parseStories(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title, i) => ({ id: `story-${i + 1}`, title, finalPoint: '' }));
}

/**
 * @param {string} text
 * @returns {Participant[]}
 */
export function parseParticipants(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, i) => ({ id: `p-${i + 1}`, name }));
}

/**
 * @param {Story[]} stories
 * @param {Participant[]} participants
 */
export function createPokerState(stories, participants) {
  return {
    stories: stories.map((s) => ({ ...s })),
    participants: participants.map((p) => ({ ...p })),
    currentStoryIndex: 0,
    reveal: false,
    votes: new Map(), // participantId -> point(string)
    selectedPointByParticipant: new Map(),
    reasons: new Map(), // participantId -> reason text (min/max only)
  };
}

/**
 * @param {ReturnType<typeof createPokerState>} state
 * @param {string} participantId
 * @param {string} point
 */
export function setVote(state, participantId, point) {
  state.votes.set(participantId, point);
  state.selectedPointByParticipant.set(participantId, point);
}

/**
 * @param {ReturnType<typeof createPokerState>} state
 * @param {string} participantId
 * @param {string} reason
 */
export function setReason(state, participantId, reason) {
  const trimmed = String(reason || '').trim();
  if (!trimmed) {
    state.reasons.delete(participantId);
    return;
  }
  state.reasons.set(participantId, trimmed);
}

/**
 * @param {ReturnType<typeof createPokerState>} state
 */
export function revealVotes(state) {
  state.reveal = true;
}

/**
 * @param {ReturnType<typeof createPokerState>} state
 */
export function resetRound(state) {
  state.reveal = false;
  state.votes.clear();
  state.reasons.clear();
}

/**
 * @param {ReturnType<typeof createPokerState>} state
 * @param {number} idx
 */
export function setCurrentStory(state, idx) {
  if (idx < 0 || idx >= state.stories.length) return;
  state.currentStoryIndex = idx;
  resetRound(state);
}

/**
 * @param {ReturnType<typeof createPokerState>} state
 * @param {string} point
 */
export function adoptCurrentStoryPoint(state, point) {
  const story = state.stories[state.currentStoryIndex];
  if (!story) return;
  story.finalPoint = point;
}

/**
 * @param {ReturnType<typeof createPokerState>} state
 */
export function voteStats(state) {
  const values = Array.from(state.votes.values());
  const numeric = values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  if (!numeric.length) {
    return { avg: null, median: null, min: null, max: null };
  }
  const sorted = [...numeric].sort((a, b) => a - b);
  const avg = numeric.reduce((acc, n) => acc + n, 0) / numeric.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return {
    avg: round1(avg),
    median: round1(median),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

/**
 * Reveal後、最小値/最大値を出した参加者IDを返す。
 * @param {ReturnType<typeof createPokerState>} state
 */
export function getDiscussionTargets(state) {
  const entries = Array.from(state.votes.entries())
    .map(([participantId, point]) => ({ participantId, n: Number(point) }))
    .filter((x) => Number.isFinite(x.n));
  if (!entries.length) return [];
  const min = Math.min(...entries.map((x) => x.n));
  const max = Math.max(...entries.map((x) => x.n));
  const ids = new Set();
  entries.forEach((x) => {
    if (x.n === min || x.n === max) ids.add(x.participantId);
  });
  return Array.from(ids);
}

/**
 * @param {ReturnType<typeof createPokerState>} state
 */
export function exportResultCsv(state) {
  const lines = ['Story,Point'];
  state.stories.forEach((s) => {
    lines.push(`${csvEscape(s.title)},${csvEscape(s.finalPoint || '')}`);
  });
  return lines.join('\n');
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
