import { describe, expect, it } from 'vitest';
import { shortcutAction } from './shortcuts';

const press = (key: string, extra: Partial<{ modified: boolean; typing: boolean }> = {}) =>
  shortcutAction({ key, modified: false, typing: false, ...extra });

describe('shortcutAction', () => {
  it('maps the navigation keys, ignoring case', () => {
    expect(press('t')).toBe('today');
    expect(press('W')).toBe('week');
    expect(press('a')).toBe('anchors');
    expect(press('n')).toBe('new-task');
    expect(press('f')).toBe('focus');
    expect(press('h')).toBe('history');
    expect(press('ArrowLeft')).toBe('prev');
    expect(press('ArrowRight')).toBe('next');
    expect(press('?')).toBe('help');
  });

  it('ignores letters while typing in a field', () => {
    expect(press('n', { typing: true })).toBeNull();
    expect(press('ArrowLeft', { typing: true })).toBeNull();
  });

  it('leaves Ctrl, Cmd and Alt combinations to the browser', () => {
    expect(press('t', { modified: true })).toBeNull();
    expect(press('w', { modified: true })).toBeNull();
  });

  it('lets Escape through even while typing', () => {
    expect(press('Escape', { typing: true })).toBe('close');
  });

  it('ignores keys it does not know', () => {
    expect(press('x')).toBeNull();
    expect(press('Enter')).toBeNull();
  });
});
