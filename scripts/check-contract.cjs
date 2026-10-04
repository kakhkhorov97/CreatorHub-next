const fs = require('fs');
const assert = require('node:assert/strict');
const { buildSchema, parse, validate } = require('graphql');
const schema = buildSchema(fs.readFileSync('docs/schema.graphql', 'utf8'));
const records = JSON.parse(fs.readFileSync('docs/operations.json', 'utf8'));
const expected = [
	...Object.keys(schema.getQueryType().getFields()),
	...Object.keys(schema.getMutationType().getFields()),
];
assert.deepEqual(records.map((x) => x.name).sort(), expected.sort());
for (const row of records) assert.equal(validate(schema, parse(row.document)).length, 0, row.name);
console.log(`All ${records.length} backend operations have valid frontend documents.`);
