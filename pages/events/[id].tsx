import Image from 'next/image';
import { ArrowLeft } from 'phosphor-react';
import { socialPageProps, SocialPageProps } from '../../libs/server/socialMetadata';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CalendarBlank, Clock, Palette, MapPin, Users, ArrowUpRight } from 'phosphor-react';
import { Heading, QueryState, safeUrl } from '../../libs/components/common/UI';
import { eventTime, eventImage } from '../../libs/components/events/Events';
import Layout from '../../libs/components/layout/LayoutBasic';
import { useApi } from '../../libs/hooks/useApi';
import { koreaCopy } from '../../libs/utils/korea';

export default function EventDetail({ seo }: SocialPageProps) {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const id = typeof router.query.id === 'string' ? router.query.id : '';
	const result = useApi('getEvent', { id }, !id);
	const event = result.value;
	const url = safeUrl(event?.eventUrl);
	return (
		<Layout seo={seo} title={event?.title || translate('Event')}>
			<div className="info-page">
				<Link passHref href="/events" aria-label={translate('Back to events')} title={translate('Back to events')}>
					<ArrowLeft size={22} aria-hidden />
				</Link>
				<QueryState loading={!id || result.loading} error={result.error} retry={() => result.refetch()} />
				{event && (
					<>
						<Heading title={event.title} />
						{event.isDemo && (
							<figure className="event-detail-cover">
								<Image
									width={1600}
									height={1000}
									sizes="(max-width: 700px) 100vw, 80vw"
									src={eventImage(event.title)}
									alt={translate('Event concept image')}
								/>
								<figcaption>{translate('Illustrative event setting')}</figcaption>
							</figure>
						)}
						{event.isDemo && (
							<p className="demo-label">
								{translate('Fictional event concept. This is not a scheduled real-world event.')}
							</p>
						)}
						<dl className="event-facts">
							<dt>
								<CalendarBlank size={20} aria-hidden />
								{translate('Starts')}
							</dt>
							<dd>
								<time dateTime={event.startsAt}>{eventTime(event.startsAt)}</time>
							</dd>
							<dt>
								<Clock size={20} aria-hidden />
								{translate('Ends')}
							</dt>
							<dd>
								<time dateTime={event.endsAt}>{eventTime(event.endsAt)}</time>
							</dd>
							<dt>
								<MapPin size={20} aria-hidden />
								{translate('Location')}
							</dt>
							<dd>{koreaCopy(event.location)}</dd>
						</dl>
						<p className="preserve-lines">{koreaCopy(event.description)}</p>
						{event.isDemo && (
							<section className="detail-process">
								<h2>{translate('About this gathering')}</h2>
								<p>
									{translate(
										'A small-group concept for creators to exchange ideas, discuss work and meet people across creative disciplines.',
									)}
								</p>
								<h2>{translate('Session outline')}</h2>
								<ol className="event-agenda">
									<li>
										<Clock size={20} aria-hidden />
										<div>
											<h3>{translate('Welcome and introductions')}</h3>
											<p>{translate('Introduce your practice and the work you would like to discuss.')}</p>
										</div>
									</li>
									<li>
										<Palette size={20} aria-hidden />
										<div>
											<h3>{translate('Work and conversation')}</h3>
											<p>
												{translate('Explore visual references, share a project and discuss the choices behind it.')}
											</p>
										</div>
									</li>
									<li>
										<Users size={20} aria-hidden />
										<div>
											<h3>{translate('Meet other creators')}</h3>
											<p>{translate('Exchange questions and ideas in an informal closing conversation.')}</p>
										</div>
									</li>
								</ol>
								<h2>{translate('What to bring')}</h2>
								<p>
									{translate(
										'A portfolio link, one project to discuss and a few questions for other creators. No booking or attendance is available for this fictional concept.',
									)}
								</p>
							</section>
						)}
						{url && !event.isDemo && (
							<a className="button" href={url} target="_blank" rel="noopener noreferrer">
								{translate('Visit event website')} <ArrowUpRight />
							</a>
						)}
					</>
				)}
			</div>
		</Layout>
	);
}

export const getServerSideProps = socialPageProps('event');
