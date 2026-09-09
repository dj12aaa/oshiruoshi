import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReleaseTree } from '../scripts/validate-release-tree.mjs';

const entry = (path, sha = 'b'.repeat(40)) => ({ path, sha, mode: '100644', type: 'blob' });
const tree = entries => ({ sha: 'a'.repeat(40), truncated: false, tree: entries });
test('release tree preserves unrelated files and matches the reviewed local content', () => {
  const base = tree([entry('index.html'), entry('api/search.js')]);
  const expected = [entry('index.html', 'c'.repeat(40)), entry('guide.html')];
  const candidate = tree([expected[0], entry('api/search.js'), expected[1]]);
  assert.equal(validateReleaseTree(base, candidate, expected).totalFiles, 3);
  assert.throws(() => validateReleaseTree(base, tree(expected), expected), /Unexpected deletion/);
  assert.throws(() => validateReleaseTree(undefined, candidate, expected), /SHA/);
  assert.throws(() => validateReleaseTree({ ...base, truncated: true }, candidate, expected), /incomplete/);
  assert.throws(() => validateReleaseTree(base, tree([...candidate.tree, entry('unreviewed.js')]), expected), /Unreviewed addition/);
  assert.throws(() => validateReleaseTree(base, tree([entry('index.html'), entry('api/search.js'), expected[1]]), expected), /mismatch/);
});
