export function getServerSideProps({ locale }: { locale: string }) {
	return { redirect: { destination: locale === 'en' ? '/faq' : `/${locale}/faq`, permanent: true } };
}

export default function Page() {
	return null;
}
