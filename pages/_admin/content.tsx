import Link from 'next/link';
import { ArrowRight } from 'phosphor-react';
import { useState } from 'react';
import AdminLayout from '../../libs/components/admin/AdminLayout';
import { Button, Feedback, Field, Notice, QueryState, TextArea, values } from '../../libs/components/common/UI';
import { useAction, useApi } from '../../libs/hooks/useApi';

function WebsiteContent() {
	return (
		<AdminLayout title="Website content">
			<ContentForm />
		</AdminLayout>
	);
}

function ContentForm() {
	const result = useApi('getSiteContent'),
		action = useAction(),
		[saved, setSaved] = useState(false);
	return (
		<>
			<div className="admin-page-heading">
				<div>
					<h1>Website content</h1>
					<p>Update the copy visitors see on the homepage, About and Contact pages.</p>
				</div>
				<Link passHref href="/" className="admin-text-link">
					View website <ArrowRight size={18} />
				</Link>
			</div>
			<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
			{result.value && (
				<form
					className="admin-panel admin-copy-form"
					onChange={() => setSaved(false)}
					onSubmit={(e) => {
						e.preventDefault();
						const f = values(e.currentTarget);
						action.run(async () => {
							await action.mutate('adminUpdateSiteContent', {
								input: {
									homeHeading: f.homeHeading,
									homeSubheading: f.homeSubheading,
									aboutText: f.aboutText,
									contactEmail: f.contactEmail.trim(),
									contactText: f.contactText,
									footerCopy: f.footerCopy,
								},
							});
							await action.client.refetchQueries({ include: ['getSiteContent'] });
							setSaved(true);
						});
					}}
				>
					<h2>Homepage</h2>
					<Field
						label="Main heading"
						name="homeHeading"
						required
						maxLength={160}
						defaultValue={result.value.homeHeading}
					/>
					<Field
						label="Subheading"
						name="homeSubheading"
						required
						maxLength={300}
						defaultValue={result.value.homeSubheading}
					/>
					<h2>About CreatorHub</h2>
					<TextArea
						label="About text"
						name="aboutText"
						rows={8}
						required
						maxLength={5000}
						defaultValue={result.value.aboutText}
					/>
					<h2>Contact details</h2>
					<Field
						label="Public contact email"
						name="contactEmail"
						type="email"
						maxLength={254}
						defaultValue={result.value.contactEmail}
						hint="Leave empty until a real public contact address is available."
					/>
					<TextArea
						label="Contact text"
						name="contactText"
						rows={4}
						maxLength={2000}
						defaultValue={result.value.contactText}
					/>
					<h2>Footer</h2>
					<TextArea
						label="Footer copy"
						name="footerCopy"
						required
						rows={3}
						maxLength={500}
						defaultValue={result.value.footerCopy}
					/>
					<Feedback {...action} />
					{saved && <Notice>Website content saved. The public pages now use this copy.</Notice>}
					<Button type="submit" disabled={action.busy}>
						Save website content
					</Button>
				</form>
			)}
		</>
	);
}

export default WebsiteContent;
