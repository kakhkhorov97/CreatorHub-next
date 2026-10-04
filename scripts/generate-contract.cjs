const fs = require('fs');
const {
	buildSchema,
	isNonNullType,
	isListType,
	isScalarType,
	isEnumType,
	isObjectType,
	isInputObjectType,
	getNamedType,
	parse,
	validate,
} = require('graphql');
const schema = buildSchema(fs.readFileSync('docs/schema.graphql', 'utf8'));
const scalar = {
	ID: 'string',
	String: 'string',
	Int: 'number',
	Float: 'number',
	Boolean: 'boolean',
	DateTime: 'string',
	Upload: 'File',
};
function type(t) {
	if (isNonNullType(t)) return core(t.ofType);
	return core(t) + ' | null';
}
function core(t) {
	if (isListType(t)) return `Array<${type(t.ofType)}>`;
	return scalar[t.name] || t.name;
}
let types = '// Generated from docs/schema.graphql. Run npm run contract:generate after a schema update.\n';
let enums = '// Generated backend enum unions.\n';
for (const t of Object.values(schema.getTypeMap())) {
	if (t.name.startsWith('__') || ['Query', 'Mutation'].includes(t.name)) continue;
	if (isEnumType(t)) {
		const row = `export type ${t.name} = ${t
			.getValues()
			.map((v) => JSON.stringify(v.name))
			.join(' | ')};\n`;
		enums += row;
		types += row;
	}
	if (isObjectType(t) || isInputObjectType(t))
		types += `export interface ${t.name} {\n${Object.values(t.getFields())
			.map((f) => `  ${f.name}${isNonNullType(f.type) ? '' : '?'}: ${type(f.type)};`)
			.join('\n')}\n}\n`;
}
function selection(t) {
	t = getNamedType(t);
	if (!isObjectType(t)) return '';
	return `{ ${Object.values(t.getFields())
		.map((f) => f.name + ' ' + selection(f.type))
		.join(' ')} }`;
}
let query = '',
	mutation = '',
	adminQuery = '',
	adminMutation = '',
	map = '';
const records = [];
for (const [kind, root] of [
	['query', schema.getQueryType()],
	['mutation', schema.getMutationType()],
])
	for (const f of Object.values(root.getFields())) {
		const vars = f.args.length
			? `(${f.args
					.map(
						(a) => `$${a.name}: ${a.type}${a.defaultValue !== undefined ? ' = ' + JSON.stringify(a.defaultValue) : ''}`,
					)
					.join(', ')})`
			: '';
		const args = f.args.length ? `(${f.args.map((a) => `${a.name}: $${a.name}`).join(', ')})` : '';
		const doc = `${kind} ${f.name}${vars} { ${f.name}${args} ${selection(f.type)} }`;
		// Empty-object defaults are GraphQL object literals and validate directly.
		const errors = validate(schema, parse(doc));
		if (errors.length) throw errors[0];
		const line = `export const ${f.name} = gql\`${doc}\`;\n`;
		const admin =
			[
				'adminCategories',
				'adminEvents',
				'createEvent',
				'updateEvent',
				'createCategory',
				'updateCategory',
				'setAccountSuspended',
				'moderateProjectComment',
			].includes(f.name) || f.name.startsWith('admin');
		if (admin) {
			if (kind === 'query') adminQuery += line;
			else adminMutation += line;
		} else if (kind === 'query') query += line;
		else mutation += line;
		map += `  ${f.name}: { variables: { ${f.args
			.map((a) => `${a.name}${!isNonNullType(a.type) || a.defaultValue !== undefined ? '?' : ''}: ${type(a.type)}`)
			.join('; ')} }; result: ${type(f.type)} };\n`;
		records.push({ name: f.name, kind, admin, document: doc });
	}
types += `export interface Operations {\n${map}}\n`;
for (const p of ['libs/types', 'libs/enums', 'apollo/user', 'apollo/admin']) fs.mkdirSync(p, { recursive: true });
fs.writeFileSync('libs/types/creatorhub.ts', types);
fs.writeFileSync('libs/enums/creatorhub.ts', enums);
for (const [file, body] of [
	['user/query', query],
	['user/mutation', mutation],
	['admin/query', adminQuery],
	['admin/mutation', adminMutation],
])
	fs.writeFileSync(
		`apollo/${file}.ts`,
		"// Generated and schema-validated GraphQL documents.\nimport { gql } from '@apollo/client';\n" + body,
	);
fs.writeFileSync('docs/operations.json', JSON.stringify(records, null, 2) + '\n');
console.log(`Generated and validated ${records.length} operations.`);
