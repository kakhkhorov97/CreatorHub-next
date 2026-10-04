import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowUpRight } from 'phosphor-react';
import { Heading, QueryState, safeUrl } from '../../libs/components/common/UI';
import { eventTime } from '../../libs/components/events/Events';
import Layout from '../../libs/components/layout/LayoutBasic';
import { useApi } from '../../libs/hooks/useApi';
import { koreaCopy } from '../../libs/utils/korea';

export default function EventDetail() {
	const router = useRouter();
	const id = typeof router.query.id === 'string' ? router.query.id : '';
	const result = useApi('getEvent', { id }, !id);
	const event = result.value;
	const url = safeUrl(event?.eventUrl);
	return (
		<Layout title={event?.title || 'Event'}>
			<div className="info-page">
				<Link passHref href="/events">
					Back to events
				</Link>
				<QueryState loading={!id || result.loading} error={result.error} retry={() => result.refetch()} />
				{event && (
					<>
						<Heading title={event.title} />
						{event.isDemo && (
							<p className="demo-label">
								Fictional demo event. This is a sample listing, not a scheduled real-world event.
							</p>
						)}
						<dl className="event-facts">
							<dt>Starts</dt>
							<dd>
								<time dateTime={event.startsAt}>{eventTime(event.startsAt)}</time>
							</dd>
							<dt>Ends</dt>
							<dd>
								<time dateTime={event.endsAt}>{eventTime(event.endsAt)}</time>
							</dd>
							<dt>Location</dt>
							<dd>{koreaCopy(event.location)}</dd>
						</dl>
						<p className="preserve-lines">{koreaCopy(event.description)}</p>
						{url && !event.isDemo && (
							<a className="button" href={url} target="_blank" rel="noopener noreferrer">
								Visit event website <ArrowUpRight />
							</a>
						)}
					</>
				)}
			</div>
		</Layout>
	);
}
