import Finder from '../libs/components/discovery/Finder';
import Layout from '../libs/components/layout/LayoutBasic';

export default function Page() {
	return (
		<Layout title="AI finder">
			<div className="finder-page">
				<Finder />
			</div>
		</Layout>
	);
}
