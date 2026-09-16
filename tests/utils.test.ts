import assert from 'node:assert/strict';
import test from 'node:test';
import { allocateTargetBudgets, formatBytes, parsePageRanges, safeBaseName } from '../src/utils.ts';

test('parsePageRanges handles ranges, duplicates and Chinese commas', () => {
  assert.deepEqual(parsePageRanges('1-3，3, 5', 5), [0, 1, 2, 4]);
  assert.throws(() => parsePageRanges('2-6', 5), /超出/);
  assert.throws(() => parsePageRanges('abc', 5), /无法识别/);
});

test('allocateTargetBudgets stays inside the reserved target', () => {
  const target = 5 * 1024 * 1024;
  const budgets = allocateTargetBudgets([1, 2, 1], target);
  assert.equal(budgets.length, 3);
  assert.ok(budgets[1]! > budgets[0]!);
  assert.ok(budgets.reduce((sum, value) => sum + value, 0) <= target * 0.92);
});

test('file helpers create safe, readable output', () => {
  assert.equal(safeBaseName('合同:最终版?.pdf'), '合同_最终版_');
  assert.equal(formatBytes(5 * 1024 * 1024), '5.00 MB');
});
