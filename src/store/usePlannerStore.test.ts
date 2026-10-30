import { beforeEach, describe, expect, it } from 'vitest';
import { hasConflict } from '../lib/fit';
import { usePlannerStore } from './usePlannerStore';

const DATE = '2026-11-02'; // a Monday
const settings = { dayStartMin: 360, dayEndMin: 1380, minGapMin: 10 };

const reset = () => usePlannerStore.setState({ anchors: [], tasks: [], settings: { ...settings, theme: 'system' } });
const st = () => usePlannerStore.getState();

describe('updateAnchor', () => {
  beforeEach(reset);

  it('changes the given fields and keeps id, source and color', () => {
    st().addAnchor({ title: 'Gym', startMin: 600, endMin: 660, repeatDays: [1], kind: 'other', color: '#111' });
    const { id } = st().anchors[0];
    st().updateAnchor(id, { title: 'Run', startMin: 540 });
    expect(st().anchors[0]).toMatchObject({ id, title: 'Run', startMin: 540, endMin: 660, source: 'manual', color: '#111' });
  });

  it('never edits a prayer anchor', () => {
    usePlannerStore.setState({
      anchors: [{ id: 'p', title: 'Fajr', startMin: 300, endMin: 320, repeatDays: [], date: DATE, kind: 'prayer', source: 'prayer-api', color: '#8a7240' }],
    });
    st().updateAnchor('p', { title: 'X' });
    expect(st().anchors[0].title).toBe('Fajr');
  });

  it('flags a task that the edited anchor now overlaps', () => {
    st().addAnchor({ title: 'Gym', startMin: 600, endMin: 660, repeatDays: [1], kind: 'other', color: '#111' });
    st().addTask('Write', 60);
    const task = st().tasks[0];
    expect(st().planTask(task.id, DATE, 720)).toBe(true); // 12:00-13:00
    expect(hasConflict(st().tasks[0], st().anchors, settings)).toBe(false);

    st().updateAnchor(st().anchors[0].id, { startMin: 690, endMin: 780 }); // 11:30-13:00
    expect(hasConflict(st().tasks[0], st().anchors, settings)).toBe(true);
  });
});

describe('moving a placed task', () => {
  beforeEach(reset);

  it('moves to another gap and frees the old slot', () => {
    st().addAnchor({ title: 'Work', startMin: 540, endMin: 1020, repeatDays: [1], kind: 'work', color: '#111' });
    st().addTask('Read', 60);
    const id = st().tasks[0].id;
    expect(st().planTask(id, DATE, 360)).toBe(true); // morning gap
    expect(st().tasks[0].startMin).toBe(360);
    expect(st().planTask(id, DATE, 1080)).toBe(true); // evening gap
    expect(st().tasks[0]).toMatchObject({ date: DATE, startMin: 1080, status: 'planned' });
  });

  it('can shift inside its own gap because its old slot does not block it', () => {
    st().addTask('Read', 60);
    const id = st().tasks[0].id;
    st().planTask(id, DATE, 360);
    expect(st().planTask(id, DATE, 390)).toBe(true);
    expect(st().tasks[0].startMin).toBe(390);
  });

  it('refuses a drop that does not fit and leaves the task where it was', () => {
    st().addAnchor({ title: 'Work', startMin: 420, endMin: 1380, repeatDays: [1], kind: 'work', color: '#111' });
    st().addTask('Read', 90);
    const id = st().tasks[0].id;
    usePlannerStore.setState({ tasks: [{ ...st().tasks[0], status: 'planned', date: DATE, startMin: 1000 }] });
    expect(st().planTask(id, DATE, 360)).toBe(false); // only 60 min before work
    expect(st().tasks[0].startMin).toBe(1000);
  });

  it('keeps a done task done when it is moved', () => {
    st().addTask('Read', 30);
    const id = st().tasks[0].id;
    st().planTask(id, DATE, 360);
    st().toggleDone(id);
    st().planTask(id, DATE, 600);
    expect(st().tasks[0]).toMatchObject({ status: 'done', startMin: 600 });
  });
});
