import { expect, test, describe, beforeEach, vi } from 'vitest';
import { getJson, setJson, getString, setString, removeItem } from '../app/lib/storage';

describe('Storage Helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  test('getString returns fallback when key does not exist', () => {
    expect(getString('nonexistent', 'default')).toBe('default');
    expect(getString('nonexistent')).toBe('');
  });

  test('setString and getString round-trip', () => {
    expect(setString('mykey', 'myvalue')).toBe(true);
    expect(getString('mykey')).toBe('myvalue');
  });

  test('setString and getString with sessionStorage', () => {
    expect(setString('sessionkey', 'sessionval', 'session')).toBe(true);
    expect(getString('sessionkey', '', 'session')).toBe('sessionval');
    expect(getString('sessionkey')).toBe(''); // Not in localStorage
  });

  test('getJson returns fallback when key does not exist', () => {
    expect(getJson('nonexistent', { a: 1 })).toEqual({ a: 1 });
    expect(getJson('nonexistent')).toBeNull();
  });

  test('setJson and getJson round-trip', () => {
    const val = { x: [1, 2], y: 'hello' };
    expect(setJson('jsonkey', val)).toBe(true);
    expect(getJson('jsonkey')).toEqual(val);
  });

  test('getJson returns fallback for invalid JSON', () => {
    localStorage.setItem('badjson', '{invalid: json}');
    expect(getJson('badjson', 'fallback')).toBe('fallback');
  });

  test('removeItem removes a stored key', () => {
    setString('todelete', 'val');
    expect(getString('todelete')).toBe('val');
    expect(removeItem('todelete')).toBe(true);
    expect(getString('todelete')).toBe('');
  });

  test('storage functions return fallback/false when storage operation throws error', () => {
    const mockGet = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    const mockSet = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    const mockRemove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });

    expect(getString('any', 'fallback')).toBe('fallback');
    expect(getJson('any', 'fallback')).toBe('fallback');
    expect(setString('any', 'val')).toBe(false);
    expect(setJson('any', {})).toBe(false);
    expect(removeItem('any')).toBe(false);
  });
});
