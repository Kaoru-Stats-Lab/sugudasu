import assert from 'node:assert/strict';
import {
  createPokerState,
  getDiscussionTargets,
  parseParticipants,
  parseStories,
  setVote,
  voteStats,
} from '../assets/planning-poker-engine.js';

const stories = parseStories('A\nB');
const participants = parseParticipants('山田\n佐藤\n鈴木');
assert.equal(stories.length, 2);
assert.equal(participants.length, 3);

const st = createPokerState(stories, participants);
setVote(st, participants[0].id, '8');
setVote(st, participants[1].id, '13');
setVote(st, participants[2].id, '8');

const stats = voteStats(st);
assert.equal(stats.avg, 9.7);
assert.equal(stats.median, 8);
assert.equal(stats.min, 8);
assert.equal(stats.max, 13);

const targets = getDiscussionTargets(st);
assert.equal(targets.length, 3);

console.log('planning-poker-engine.test.mjs: OK');
