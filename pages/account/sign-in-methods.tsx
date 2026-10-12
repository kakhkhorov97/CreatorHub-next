import type { GetServerSideProps } from 'next';

export default function SignInMethodsRedirect() {
	return null;
}

export const getServerSideProps: GetServerSideProps = async ({ locale, defaultLocale }) => ({
	redirect: {
		destination: `${locale && locale !== defaultLocale ? `/${locale}` : ''}/account/settings`,
		permanent: false,
	},
});
