import test from 'node:test';
import assert from 'node:assert/strict';
import { updateRepoReferences } from './references.mjs';

test('rename updates both images, link and alt without changing similarly named repos', () => {
  const old = 'owner/repo';
  const card = `<a href="https://github.com/${old}"><source srcset="assets/cards/owner--repo-dark.svg"><img src="assets/cards/owner--repo-light.svg" alt="${old}"></a>`;
  const other = '<a href="https://github.com/owner/repo-vscode"><img src="assets/cards/owner--repo-vscode-light.svg" alt="owner/repo-vscode"></a>';
  const result = updateRepoReferences(card + other, old, 'new-owner/new-repo');
  assert.equal(result, '<a href="https://github.com/new-owner/new-repo"><source srcset="assets/cards/new-owner--new-repo-dark.svg"><img src="assets/cards/new-owner--new-repo-light.svg" alt="new-owner/new-repo"></a>' + other);
  assert.equal(updateRepoReferences(result, old, 'new-owner/new-repo'), result);
});
