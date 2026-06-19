#!/usr/bin/env node
/**
 * Gemini API — Zenn 編集テーマ表のたたき台（JSON）
 *
 * 用途: zenn-editorial-gemini.md と同じ役割。本文は生成しない。
 * 実行: GOOGLE_API_KEY=... node scripts/gemini/editorial-plan.mjs
 * 依存: npm install @google/genai（初回のみ）
 *
 * 出力は Claude/Cursor で突合してから ZENN_EDITORIAL_PLAN.md へ反映すること。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_API_KEY が未設定です。');
    process.exit(1);
  }

  let GoogleGenAI;
  try {
    ({ GoogleGenAI } = await import('@google/genai'));
  } catch {
    console.error('@google/genai がありません: npm install @google/genai');
    process.exit(1);
  }

  const promptPath = path.join(ROOT, 'docs/prompts/zenn-editorial-gemini.md');
  const raw = fs.readFileSync(promptPath, 'utf8');
  const match = raw.match(/## Gemini への依頼文[\s\S]*?```text([\s\S]*?)```/);
  const userPrompt = match ? match[1].trim() : raw.slice(0, 6000);

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction:
        'Zenn編集プランナー。礼賛・本文執筆禁止。JSONのみ。themesは8件以内。priorityはP0|P1|P2。',
      temperature: 0.3,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          themes: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                axis: { type: 'STRING', description: 'A|B|C' },
                tool: { type: 'STRING' },
                focus: { type: 'STRING' },
                priority: { type: 'STRING' },
              },
              required: ['title', 'axis', 'tool', 'priority'],
            },
          },
        },
        required: ['themes'],
      },
    },
  });

  const text = response.text ?? '';
  const outPath = path.join(ROOT, 'tmp/gemini-editorial-plan.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, text, 'utf8');
  console.log('Wrote', outPath);
  console.log(text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
