import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Run against the actual GitHub recursive tree responses before updating a ref.
export function validateReleaseTree(base, candidate, intended) {
  const files = tree => {
    assert.match(tree?.sha || '', /^[a-f0-9]{40}$/, 'A verified base/candidate tree SHA is required');
    assert.equal(tree.truncated, false, 'An incomplete tree cannot authorize a release');
    assert.ok(Array.isArray(tree.tree) && tree.tree.length, 'The complete tree must be present');
    return new Map(tree.tree.filter(entry => entry.type !== 'tree').map(entry => [entry.path, entry]));
  };
  const before = files(base), after = files(candidate);
  assert.ok(Array.isArray(intended) && intended.length, 'The reviewed local manifest is required');
  const allowed = new Map(intended.map(entry => [entry.path, entry]));
  assert.equal(allowed.size, intended.length, 'Duplicate release paths');
  for (const [path, old] of before) {
    assert.ok(after.has(path), `Unexpected deletion: ${path}`);
    if (!allowed.has(path)) assert.deepEqual(after.get(path), old, `Unreviewed change: ${path}`);
  }
  for (const [path, entry] of after) {
    assert.ok(before.has(path) || allowed.has(path), `Unreviewed addition: ${path}`);
    if (allowed.has(path)) {
      assert.equal(entry.sha, allowed.get(path).sha, `Local/remote content mismatch: ${path}`);
      assert.equal(entry.mode, allowed.get(path).mode, `Local/remote mode mismatch: ${path}`);
    }
  }
  for (const path of allowed.keys()) assert.ok(after.has(path), `Missing intended file: ${path}`);
  return { base: base.sha, candidate: candidate.sha, preservedFiles: before.size, reviewedPaths: allowed.size, totalFiles: after.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.equal(process.argv.length, 5, 'Usage: node scripts/validate-release-tree.mjs base.json candidate.json reviewed-manifest.json');
  console.log(JSON.stringify(validateReleaseTree(...process.argv.slice(2).map(path => JSON.parse(readFileSync(path, 'utf8'))))));
}
