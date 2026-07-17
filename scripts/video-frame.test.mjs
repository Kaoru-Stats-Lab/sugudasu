#!/usr/bin/env node
/**
 * video-frame — 単体テスト（ファイル名・シーク補助）
 * Run: node scripts/video-frame.test.mjs
 */
import assert from 'node:assert/strict';
import {
  sanitizeBaseName,
  formatTimeSuffix,
  buildPngFileName,
  clampSeek,
  frameStepSeconds,
  isAcceptedVideoFile,
  DEFAULT_FRAME_STEP_SEC,
} from '../assets/video-frame.js';

{
  assert.equal(sanitizeBaseName('操作録画.mp4'), '操作録画');
  assert.equal(sanitizeBaseName('a/b:c*.mp4'), 'a_b_c');
  assert.equal(sanitizeBaseName(''), 'video');
  assert.equal(sanitizeBaseName('...'), 'video');
}

{
  assert.equal(formatTimeSuffix(0), '00m00s');
  assert.equal(formatTimeSuffix(65), '01m05s');
  assert.equal(formatTimeSuffix(125.9), '02m05s');
}

{
  assert.equal(buildPngFileName('demo.mp4', 83), 'demo_01m23s.png');
  assert.equal(buildPngFileName('path/weird:name.webm', 5), 'path_weird_name_00m05s.png');
}

{
  assert.equal(clampSeek(1, 10, -0.5), 0.5);
  assert.equal(clampSeek(0, 10, -1), 0);
  assert.equal(clampSeek(9.8, 10, 1), 10);
}

{
  assert.equal(frameStepSeconds(), DEFAULT_FRAME_STEP_SEC);
  assert.equal(frameStepSeconds(60), 1 / 60);
  assert.equal(frameStepSeconds(0), DEFAULT_FRAME_STEP_SEC);
}

{
  assert.equal(isAcceptedVideoFile({ type: 'video/mp4', name: 'a.mp4' }), true);
  assert.equal(isAcceptedVideoFile({ type: 'video/webm', name: 'a.webm' }), true);
  assert.equal(isAcceptedVideoFile({ type: '', name: 'clip.MP4' }), true);
  assert.equal(isAcceptedVideoFile({ type: 'video/quicktime', name: 'a.mov' }), false);
  assert.equal(isAcceptedVideoFile({ type: 'image/png', name: 'a.png' }), false);
}

console.log('video-frame.test.mjs: ok');
