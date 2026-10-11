import Head from 'next/head';
import { useRouter } from 'next/router';
import {
	canonicalUrl,
	defaultDescription,
	defaultImage,
	descriptionText,
	imageUrl,
	PageMetadata,
} from '../../seo/metadata';

export default function Seo({
	title = 'CreatorHub',
	description = defaultDescription,
	image,
	imageAlt,
	noindex,
}: PageMetadata) {
	const router = useRouter();
	const pageTitle = title === 'CreatorHub' ? title : `${title} | CreatorHub`;
	const summary = descriptionText(description || defaultDescription);
	const url = canonicalUrl(router.asPath, router.locale, router.defaultLocale);
	const customImage = imageUrl(image);
	const preview = customImage || imageUrl(defaultImage);
	const locale = ({ en: 'en_US', ko: 'ko_KR', uz: 'uz_UZ' } as Record<string, string>)[router.locale || 'en'];
	return (
		<Head>
			<title>{pageTitle}</title>
			<meta name="description" content={summary} key="description" />
			{noindex && <meta name="robots" content="noindex,nofollow" key="robots" />}
			{url && <link rel="canonical" href={url} key="canonical" />}
			<meta property="og:type" content="website" key="og:type" />
			<meta property="og:site_name" content="CreatorHub" key="og:site_name" />
			<meta property="og:title" content={pageTitle} key="og:title" />
			<meta property="og:description" content={summary} key="og:description" />
			<meta property="og:locale" content={locale} key="og:locale" />
			{url && <meta property="og:url" content={url} key="og:url" />}
			{preview && <meta property="og:image" content={preview} key="og:image" />}
			{preview && (
				<meta
					property="og:image:alt"
					content={customImage ? imageAlt || title : 'CreatorHub. Find your next creative collaborator.'}
					key="og:image:alt"
				/>
			)}
			{preview && !customImage && <meta property="og:image:width" content="1200" key="og:image:width" />}
			{preview && !customImage && <meta property="og:image:height" content="630" key="og:image:height" />}
			{preview && !customImage && <meta property="og:image:type" content="image/png" key="og:image:type" />}
			<meta name="twitter:card" content="summary_large_image" key="twitter:card" />
			<meta name="twitter:title" content={pageTitle} key="twitter:title" />
			<meta name="twitter:description" content={summary} key="twitter:description" />
			{preview && <meta name="twitter:image" content={preview} key="twitter:image" />}
			{preview && (
				<meta
					name="twitter:image:alt"
					content={customImage ? imageAlt || title : 'CreatorHub. Find your next creative collaborator.'}
					key="twitter:image:alt"
				/>
			)}
		</Head>
	);
}
