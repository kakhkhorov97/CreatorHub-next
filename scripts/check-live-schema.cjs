const fs = require('fs');
const assert = require('node:assert/strict');
const {
	getIntrospectionQuery,
	buildClientSchema,
	buildSchema,
	printSchema,
	lexicographicSortSchema,
} = require('graphql');
(async () => {
	const endpoint = process.env.NEXT_PUBLIC_API_GRAPHQL_URL || 'http://localhost:7001/graphql';
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: getIntrospectionQuery() }),
	});
	const body = await response.json();
	if (body.errors) throw Error(JSON.stringify(body.errors));
	const live = printSchema(lexicographicSortSchema(buildClientSchema(body.data)));
	const local = printSchema(lexicographicSortSchema(buildSchema(fs.readFileSync('docs/schema.graphql', 'utf8'))));
	assert.equal(live.replace(/"""[\s\S]*?"""\ndirective @oneOf on INPUT_OBJECT\n\n/, ''), local);
	console.log('Frontend schema matches the running CreatorHub backend schema.');
})().catch((e) => {
	console.error(e.message);
	process.exitCode = 1;
});
