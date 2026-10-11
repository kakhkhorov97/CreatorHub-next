# Social previews and page metadata

CreatorHub supplies metadata in the initial HTML so social crawlers can read the title, description and preview image without running JavaScript.

## Production configuration

Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS website origin, for example `https://your-domain.com`, in the hosting environment **before building**. Rebuild and deploy after changing it. Do not use the API origin or a URL containing a path, credentials or query parameters.

Development defaults to `http://localhost:7007`. Production deliberately omits canonical URLs and relative preview-image URLs when the website origin is missing. Localhost links cannot produce previews for external social networks.

The server also needs access to the public GraphQL API. Set `API_GRAPHQL_URL` for a server-only endpoint when needed; otherwise it uses `NEXT_PUBLIC_API_GRAPHQL_URL`. Public metadata queries never forward a visitor's cookies or authentication headers.

## Metadata conventions

The shared `libs/components/common/Seo.tsx` component uses `next/head`, the metadata mechanism for this Next.js Pages Router app. `_document.tsx` contains the document shell and favicon.

Each page supplies a title and a concise description. Titles use `Page title | CreatorHub`, with `CreatorHub` alone on the homepage. Descriptions collapse whitespace and are capped at 200 characters as an editorial convention, not a protocol requirement. The canonical URL and `og:url` identify the page and locale, excluding query strings and fragments.

The component emits the Open Graph properties `og:title`, `og:type`, `og:url` and `og:image`, plus `og:description`, `og:site_name`, `og:locale` and image alternative text. Default images also specify their actual width, height and MIME type. Custom images do not claim dimensions that have not been measured.

Twitter card metadata uses `summary_large_image`, with a matching title, description, image and alternative text. No social account handle is invented.

Use a public PNG or JPEG image that can be fetched without a login. The default card is `public/brand/social-preview.png`, 1200 × 630 pixels. This is a practical sharing size, not a mandatory Open Graph dimension. Its editable SVG source is beside it. Keep essential text away from edges because platforms may crop images differently.

## Public detail pages

| Page    | Title         | Description                                                            | Image                            |
| ------- | ------------- | ---------------------------------------------------------------------- | -------------------------------- |
| Project | Project title | Summary, then description                                              | Project cover, then default card |
| Creator | Display name  | Bio, then headline                                                     | Avatar, then default card        |
| Service | Service title | Service description                                                    | Default card                     |
| Event   | Event title   | Event description, with a fictional concept disclosure when applicable | Default card                     |

These pages use `getServerSideProps` with the existing anonymous public queries. Metadata is available before browser data loads. Missing records return 404. API failures return 503 with `Retry-After: 60` and `noindex`, while the browser can still attempt to load the content. Requests time out after five seconds. This adds an API request to each detail-page request.

## Verification after deployment

1. View the page source, or use `curl -s https://your-domain.com/projects/PROJECT_ID`. Confirm the title, description, canonical URL and social tags occur inside `<head>` in the returned HTML.
2. Open the exact `og:image` URL directly. Confirm it returns the image successfully without authentication and is publicly reachable. Check API-hosted uploads as well as the default card.
3. Share the deployed URL in Telegram and other target platforms. Preview presentation depends on each platform; metadata cannot force every platform to display a description or the same crop.
4. Social platforms may cache previews. Allow time for changes or use the platform's preview refresh/debugging tool when available. A versioned image filename can help distinguish a new image.

Automated checks in `tests/social-metadata.test.cjs` cover initial head rendering, locale-aware URLs, removal of query secrets, image URL validation, anonymous metadata fetching and missing/API-failure responses.

## References

- [Next.js Pages Router Head component](https://nextjs.org/docs/pages/api-reference/components/head)
- [Open Graph protocol](https://ogp.me/)
