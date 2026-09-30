import test from 'node:test';
import assert from 'node:assert/strict';
import { preserveSnapshot, renderFingerprint } from './snapshot.mjs';

const metadata = { full_name: 'owner/repo', name: 'repo', description: 'Music', language: 'JavaScript', stars: 1, forks: 0, topics: ['midi'], archived: false };
const previous = { ...metadata, fetchedAt: 'yesterday' };

test('unchanged API metadata keeps snapshot and timestamp', () => {
  assert.equal(preserveSnapshot(previous, { ...metadata }, 'today'), previous);
});

test('changes and new repos get fresh snapshots', () => {
  for (const change of [{stars:2}, {name:'renamed', full_name:'owner/renamed'}, {topics:['audio']}, {description:'New'}]) {
    assert.deepEqual(preserveSnapshot(previous, {...metadata, ...change}, 'today'), {...metadata, ...change, fetchedAt:'today'});
  }
  assert.deepEqual(preserveSnapshot(undefined, metadata, 'today'), {...metadata, fetchedAt:'today'});
});

test('render cache ignores fetch time but invalidates metadata, theme and renderer changes', () => {
  const fingerprint = renderFingerprint(previous, 'dark', 'renderer/fonts');
  assert.equal(renderFingerprint({...previous, fetchedAt:'today'}, 'dark', 'renderer/fonts'), fingerprint);
  assert.notEqual(renderFingerprint({...previous, stars:2}, 'dark', 'renderer/fonts'), fingerprint);
  assert.notEqual(renderFingerprint(previous, 'light', 'renderer/fonts'), fingerprint);
  assert.notEqual(renderFingerprint(previous, 'dark', 'new renderer/fonts'), fingerprint);
});
