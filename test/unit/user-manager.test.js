import { test, expect } from 'vitest';
import { safeReturnPath, CALLBACK_PATH } from '../../src/shell/auth/userManager.js';

test('only same-origin paths are used after sign-in', () => {
  expect(safeReturnPath('/inventory?x=1')).toBe('/inventory?x=1');
  expect(safeReturnPath('//evil.test/x')).toBe('/');
  expect(safeReturnPath('https://evil.test')).toBe('/');
  expect(safeReturnPath(CALLBACK_PATH)).toBe('/');
  expect(safeReturnPath(undefined)).toBe('/');
});
