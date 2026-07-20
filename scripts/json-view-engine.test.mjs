import assert from 'node:assert/strict';
import {
  ARRAY_CHILD_CAP,
  arrayCapNotice,
  collectSearchMatches,
  expandPathsForSegments,
  flattenVisible,
  parseJson,
  pathToBreadcrumb,
  pathToString,
  toJsonPath,
  valueForCopy,
} from '../assets/json-view-engine.js';

{
  const r = parseJson('{"a":1}');
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, { a: 1 });
}

{
  const r = parseJson('{bad}');
  assert.equal(r.ok, false);
  assert.match(r.error, /確認してください/);
}

assert.equal(pathToString(['user', 'items', 0, 'id']), 'user.items[0].id');
assert.equal(pathToBreadcrumb(['data', 'departments', 0, 'email']), 'data > departments[0] > email');
assert.equal(toJsonPath(['data', 'users', 5, 'email']), '$.data.users[5].email');
assert.equal(toJsonPath([]), '$');

{
  const root = {
    meta: { v: 1 },
    data: {
      departments: [
        { manager: { contacts: { email: 'a@ex.com' } } },
        { manager: { contacts: { email: 'b@ex.com' } } },
      ],
    },
  };
  const matches = collectSearchMatches(root, 'email');
  assert.equal(matches.length, 2);
  assert.equal(matches[0].kind, 'key');
  assert.equal(matches[0].path, 'data.departments[0].manager.contacts.email');

  const expanded = expandPathsForSegments(matches[0].segments);
  assert.ok(expanded.has('data'));
  assert.ok(expanded.has('data.departments[0].manager.contacts'));
  assert.equal(expanded.has('meta'), false);

  const rows = flattenVisible(root, expanded, 'email');
  const hit = rows.find((row) => row.path === matches[0].path);
  assert.ok(hit?.match);
  assert.equal(rows.some((row) => row.path === 'meta'), true);
  assert.equal(rows.some((row) => row.path.startsWith('meta.')), false);
}

{
  const big = { users: Array.from({ length: ARRAY_CHILD_CAP + 50 }, (_, i) => ({ id: i })) };
  const expanded = new Set(['', 'users']);
  const rows = flattenVisible(big, expanded, '');
  const childRows = rows.filter((r) => /^users\[\d+\]$/.test(r.path));
  assert.equal(childRows.length, ARRAY_CHILD_CAP);
  const notice = rows.find((r) => r.isNotice);
  assert.ok(notice);
  assert.match(arrayCapNotice(ARRAY_CHILD_CAP + 50), /先頭/);
  assert.match(arrayCapNotice(ARRAY_CHILD_CAP + 50, true), /検索対象のみ一時表示/);

  const deep = expandPathsForSegments(['users', ARRAY_CHILD_CAP + 10, 'id']);
  deep.add('users');
  const rows2 = flattenVisible(big, deep, '');
  assert.ok(rows2.some((r) => r.path === `users[${ARRAY_CHILD_CAP + 10}]`));
  assert.ok(rows2.some((r) => r.path === `users[${ARRAY_CHILD_CAP + 10}].id`));
  assert.ok(rows2.some((r) => r.isNotice && r.hasSearchExtras));
}

assert.equal(valueForCopy('hello', 'string'), 'hello');
assert.equal(valueForCopy(42, 'number'), '42');
assert.equal(valueForCopy(null, 'null'), 'null');
assert.equal(valueForCopy({ a: 1 }, 'object'), '{\n  "a": 1\n}');

console.log('json-view-engine.test: ok');
