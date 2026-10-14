// Route stored images through the Next.js resizer, which serves WebP at the size actually shown.
// Demo files are 1.5–3 MB PNGs; a card needs well under 200 KB.
// Only paths allowed in next.config.js images are rewritten; anything else (SVG, unknown hosts) is used as is.

const apiOrigin = (() => {
	try {
		return new URL(process.env.NEXT_PUBLIC_API_GRAPHQL_URL || 'http://localhost:7001/graphql').origin;
	} catch {
		return '';
	}
})();

// Must be values from Next's default imageSizes / deviceSizes.
const pictureWidths = [384, 640, 828, 1080, 1200, 1920];
const avatarWidths = [96, 128, 256];

function resizable(src: string) {
	if (/\.svg(?:$|\?)/i.test(src)) return false;
	if (src.startsWith('/demo-media/') || src.startsWith('/concepts/')) return true;
	return Boolean(apiOrigin) && (src.startsWith(`${apiOrigin}/demo-media/`) || src.startsWith(`${apiOrigin}/uploads/`));
}

const resized = (src: string, width: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;

export function responsiveImage(src: string, avatar = false) {
	if (!resizable(src)) return { src };
	const widths = avatar ? avatarWidths : pictureWidths;
	return {
		src: resized(src, avatar ? 128 : 828),
		srcSet: widths.map((width) => `${resized(src, width)} ${width}w`).join(', '),
	};
}
