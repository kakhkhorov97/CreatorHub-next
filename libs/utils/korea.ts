export function koreaCopy(text: string) {
	return text.replace(
		/around the world|across the world|worldwide|across borders|wherever you are|wherever they are based|on the other side of the world/gi,
		'across Korea',
	);
}
