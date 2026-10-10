import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'phosphor-react';
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

function EventCard({ event }: { event: CreativeEvent }) {
	const { t: translate, i18n } = useSiteTranslation('common');

	const d = new Date(event.startsAt);
	const openCard = useCardNavigation(`/events/${event._id}`);
	return (
		<article className="event-card" onClick={openCard}>
			<div className="event-date" aria-hidden="true">
				<span>{d.toLocaleDateString(i18n.language, { month: 'short', timeZone: 'Asia/Seoul' })}</span>
				<strong>
					{Number(new Intl.DateTimeFormat(i18n.language, { day: 'numeric', timeZone: 'Asia/Seoul' }).format(d))}
				</strong>
				<span>{new Intl.DateTimeFormat(i18n.language, { year: 'numeric', timeZone: 'Asia/Seoul' }).format(d)}</span>
			</div>
			<div>
				{event.isDemo && <span className="demo-label">{translate('Fictional event concept')}</span>}
				<h3>
					<Link passHref href={`/events/${event._id}`}>
						{event.title}
					</Link>
				</h3>
				<time dateTime={event.startsAt}>{eventTime(event.startsAt, i18n.language)}</time>
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

	const result = usePaged('getEvents', { input: { upcoming: true } }, false, home ? 3 : 12);
	return (
		<section className="home-section events-section">
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
