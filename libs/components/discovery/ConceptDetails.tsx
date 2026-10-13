import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { Camera, CheckCircle, ChatCircle, Clock, FileText, Palette } from 'phosphor-react';
const demoCreators = new Set([
	'mina-park',
	'joon-lee',
	'sora-kim',
	'jiho-moon',
	'noah-han',
	'hana-choi',
	'eun-lim',
	'yerin-kwon',
	'yuna-seo',
	'seo-jun-kang',
	'hae-won-lee',
	'min-jae-song',
	'da-eun-yoo',
	'tae-ho-kim',
	'soo-bin-jung',
	'daniel-rivera',
	'leila-hassan',
]);
export function conceptImage(title: string) {
	const value = title.toLowerCase();
	return /photo|portrait|space|reading/.test(value)
		? '/concepts/atelier-light.png'
		: /web|ux|ui|prototype|digital/.test(value)
		? '/concepts/dayplan-v2.png'
		: /illustr|art/.test(value)
		? '/concepts/seasons-illustration.png'
		: '/concepts/morrow-cafe.png';
}
export function isConceptService(slug: string | undefined, description: string | null | undefined) {
	return !!slug && demoCreators.has(slug) && /fictional|demo|concept/i.test(description || '');
}
export function conceptCopy(text: string | null | undefined) {
	return (text || '')
		.replace(/The artwork was generated with AI for this demo; /g, '')
		.replace(/AI-generated (?:images|artwork)/gi, 'Concept artwork');
}
export function ServiceProcess({ demo = false }: { demo?: boolean }) {
	const { t } = useTranslation('common');
	return (
		<section className="detail-process">
			<h2>{t('From your brief to delivery')}</h2>
			<ol>
				{[
					[ChatCircle, 'Share your brief', 'Tell the creator about your audience, goals, references and deadline.'],
					[
						FileText,
						'Agree the scope',
						'Confirm the deliverables, price, timeline and revision terms before work begins.',
					],
					[Palette, 'Review the direction', 'Discuss the proposed direction and give clear, grouped feedback.'],
					[CheckCircle, 'Receive your files', 'Agree file formats and handover requirements with the creator.'],
				].map(([Icon, title, copy]) => {
					const Symbol = Icon as typeof Camera;
					return (
						<li key={String(title)}>
							<Symbol size={25} aria-hidden />
							<div>
								<h3>{t(title as string)}</h3>
								<p>{t(copy as string)}</p>
							</div>
						</li>
					);
				})}
			</ol>
			<h2>{t('Before you send an inquiry')}</h2>
			<p>
				{t(
					'Include your intended use, a realistic budget and any existing materials. The creator can then confirm availability and suggest a suitable scope.',
				)}
			</p>
			{demo && <p className="muted">{t('Concept service. The examples illustrate a possible creative brief.')}</p>}
		</section>
	);
}
export function ProjectConceptDetails({ title }: { title: string }) {
	const { t } = useTranslation('common');
	return (
		<section className="detail-process">
			<h2>{t('Creative direction')}</h2>
			<p>
				{t(
					'A concept study built around a clear visual language, considered proportions and a consistent set of materials.',
				)}
			</p>
			<h2>{t('The brief')}</h2>
			<p>
				{t(
					'Explore how the central idea can work across an identity, a digital experience and its supporting applications. Keep the presentation clear enough to understand at a glance.',
				)}
			</p>
			<figure className="concept-gallery">
				<Image
					width={1600}
					height={1000}
					sizes="(max-width: 700px) 100vw, 65vw"
					src={conceptImage(title)}
					alt={t('Supporting concept study')}
					loading="lazy"
				/>
				<figcaption>{t('Supporting visual direction for this concept.')}</figcaption>
			</figure>
			<h2>{t('Design decisions')}</h2>
			<ul>
				<li>{t('Use a restrained palette so the work remains the focus.')}</li>
				<li>{t('Balance clear typography with space for images and detail.')}</li>
				<li>{t('Keep the same visual rhythm across different formats.')}</li>
			</ul>
		</section>
	);
}
