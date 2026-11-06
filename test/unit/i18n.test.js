import { test, expect } from 'vitest';
import { LOCALES, messages, translate } from '../../src/shared/i18n/messages.js';

test('every message exists in both languages', () => {
  const [first, ...rest] = LOCALES.map((locale) => Object.keys(messages[locale]).sort());
  for (const keys of rest) expect(keys).toEqual(first);
});

test('translate fills placeholders and falls back to the key', () => {
  expect(translate('sl', 'home.welcome', { name: 'Ana' })).toBe('Pozdravljeni, Ana');
  expect(translate('en', 'home.welcome', { name: 'Ana' })).toBe('Welcome, Ana');
  expect(translate('en', 'home.welcome')).toBe('Welcome, {name}');
  expect(translate('en', 'missing.key')).toBe('missing.key');
});
