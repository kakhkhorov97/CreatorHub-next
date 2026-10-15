import Image from 'next/image';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import { responsiveImage } from '../../utils/image';
import Link from 'next/link';
import { ArrowUpRight, MapPin, CalendarBlank } from 'phosphor-react';
import { useCardNavigation } from '../../hooks/useCardNavigation';
import { usePaged } from '../../hooks/usePaged';
import { CreativeEvent } from '../../types/creatorhub';
import { koreaCopy } from '../../utils/korea';
import { Empty, Pager, QueryState } from '../common/UI';

export function eventTime(value: string, locale = 'en') {
	return (
		new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(
			new Date(value),
		) + ' KST'
	);
}

export function eventImage(title: string) {
	return /editorial/i.test(title)
		? '/concepts/frame-tokyo.png'
		: /portfolio/i.test(title)
		? '/concepts/morrow-cafe.png'
		: '/concepts/copenhagen-reading-room.png';
}
function EventCard({ event }: { event: CreativeEvent }) {
	const { t: translate, i18n } = useSiteTranslation('common');

	const d = new Date(event.startsAt);
	const openCard = useCardNavigation(`/events/${event._id}`);
	return (
		<article className="event-card" onClick={openCard}>
			{event.isDemo ? (
				<img
					className="event-cover"
					{...responsiveImage(eventImage(event.title))}
					sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
					alt={translate('Event concept image')}
					loading="lazy"
				/>
			) : (
				<div className="event-cover event-cover-placeholder" aria-hidden>
					<CalendarBlank size={48} />
				</div>
			)}
			<div className="event-date" aria-hidden="true">
				<span>{d.toLocaleDateString(i18n.language, { month: 'short', timeZone: 'Asia/Seoul' })}</span>
				<strong>
					{Number(new Intl.DateTimeFormat(i18n.language, { day: 'numeric', timeZone: 'Asia/Seoul' }).format(d))}
				</strong>
				<span>{new Intl.DateTimeFormat(i18n.language, { year: 'numeric', timeZone: 'Asia/Seoul' }).format(d)}</span>
			</div>
			<div className="event-card-copy">
				{event.isDemo && <span className="demo-label">{translate('Fictional event concept')}</span>}
				<h3>
					<Link passHref href={`/events/${event._id}`}>
						{event.title}
					</Link>
				</h3>
				<time className="event-time" dateTime={event.startsAt}>
					<CalendarBlank size={18} aria-hidden />
					<span className="event-date-full">{eventTime(event.startsAt, i18n.language)}</span>
					<span className="event-date-short">
						{new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeZone: 'Asia/Seoul' }).format(d)}
					</span>
				</time>
				<p className="event-location">
					<MapPin size={18} />
					{koreaCopy(event.location)}
				</p>
				<p>{koreaCopy(event.description)}</p>
				<Link passHref href={`/events/${event._id}`}>
					{translate('View event')} <ArrowUpRight size={18} />
				</Link>
			</div>
		</article>
	);
}

export function EventsSection({ home = false }: { home?: boolean }) {
	const { t: translate } = useSiteTranslation('common');

	// The homepage asks for four: phones show all four, wider screens keep three (see events.scss).
	const result = usePaged('getEvents', { input: { upcoming: true } }, false, home ? 4 : 12);
	return (
		<section className={`home-section events-section ${home ? 'home-events' : ''}`}>
			<div className="home-section-heading">
				<div>
					<h2>{home ? translate('Creative events') : translate('Upcoming events')}</h2>
					<p className="muted">{translate('Workshops, conversations, and opportunities to meet.')}</p>
				</div>
				{home && (
					<Link passHref href="/events">
						{translate('View all events →')}
					</Link>
				)}
			</div>
			<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
			{!result.loading && !result.error && !result.rows.length && (
				<Empty title={translate('No upcoming events')}>{translate('Check back for the next published event.')}</Empty>
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
