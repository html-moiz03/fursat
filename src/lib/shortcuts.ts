export type ShortcutAction = 'today' | 'week' | 'anchors' | 'new-task' | 'prev' | 'next' | 'help' | 'close';

export type KeyInfo = {
  key: string;
  /** Ctrl, Cmd or Alt held: leave those to the browser. */
  modified: boolean;
  /** The key was pressed inside a text field, select or editable area. */
  typing: boolean;
};

/** What a key press means in Fursat, or null to ignore it. Escape works even while typing. */
export function shortcutAction({ key, modified, typing }: KeyInfo): ShortcutAction | null {
  if (key === 'Escape') return 'close';
  if (modified || typing) return null;
  switch (key.toLowerCase()) {
    case 't': return 'today';
    case 'w': return 'week';
    case 'a': return 'anchors';
    case 'n': return 'new-task';
    case 'arrowleft': return 'prev';
    case 'arrowright': return 'next';
    case '?': return 'help';
    default: return null;
  }
}

/** True when the event target is somewhere the user types. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export const SHORTCUT_LIST: { keys: string; label: string }[] = [
  { keys: 'T', label: 'Go to Today' },
  { keys: 'W', label: 'Go to the week' },
  { keys: 'A', label: 'Go to anchors' },
  { keys: 'N', label: 'Add a new task' },
  { keys: '← →', label: 'Previous or next day (week in Week view)' },
  { keys: '?', label: 'Show this list' },
];
