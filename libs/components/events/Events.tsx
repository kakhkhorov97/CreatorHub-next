import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'phosphor-react';
import { useCardNavigation } from '../../hooks/useCardNavigation';
import { usePaged } from '../../hooks/usePaged';
import { CreativeEvent } from '../../types/creatorhub';
import { koreaCopy } from '../../utils/korea';
import { Empty, Pager, QueryState } from '../common/UI';

export function eventTime(value: string) {
	return (
		new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(
			new Date(value),
		) + ' KST'
	);
}

function EventCard({ event }: { event: CreativeEvent }) {
	const d = new Date(event.startsAt);
	const openCard = useCardNavigation(`/events/${event._id}`);
	return (
		<article className="event-card" onClick={openCard}>
			<div className="event-date" aria-hidden="true">
				<span>{d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'Asia/Seoul' })}</span>
				<strong>
					{Number(new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'Asia/Seoul' }).format(d))}
				</strong>
				<span>{new Intl.DateTimeFormat('en-GB', { year: 'numeric', timeZone: 'Asia/Seoul' }).format(d)}</span>
			</div>
			<div>
				{event.isDemo && <span className="demo-label">Fictional demo event</span>}
				<h3>
					<Link passHref href={`/events/${event._id}`}>
						{event.title}
					</Link>
				</h3>
				<time dateTime={event.startsAt}>{eventTime(event.startsAt)}</time>
				<p className="event-location">
					<MapPin size={18} />
					{koreaCopy(event.location)}
				</p>
				<p>{koreaCopy(event.description)}</p>
				<Link passHref href={`/events/${event._id}`}>
					View event <ArrowUpRight size={18} />
				</Link>
			</div>
		</article>
	);
}

export function EventsSection({ home = false }: { home?: boolean }) {
	const result = usePaged('getEvents', { input: { upcoming: true } }, false, home ? 3 : 12);
	return (
		<section className="home-section events-section">
			<div className="home-section-heading">
				<div>
					<h2>{home ? 'Creative events' : 'Upcoming events'}</h2>
					<p className="muted">Workshops, conversations, and opportunities to meet.</p>
				</div>
				{home && (
					<Link passHref href="/events">
						View all events →
					</Link>
				)}
			</div>
			<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
			{!result.loading && !result.error && !result.rows.length && (
				<Empty title="No upcoming events">Check back for the next published event.</Empty>
			)}
			<div className="event-list">
				{result.rows.map((event) => (
					<EventCard key={event._id} event={event} />
				))}
			</div>
			{!home && !!result.rows.length && <Pager {...result} />}
		</section>
	);
}
