#!/usr/bin/env node
/**
 * CLI entry — re-export for Node tests
 */
export {
  evaluatePrizeLaw,
  calcGeneralLotteryMaxPrize,
  calcLumpSumMaxPremium,
  fisherYatesDraw,
  sha256Hex,
  TOOL_VERSION,
} from '../assets/prize-law-eval.js';
