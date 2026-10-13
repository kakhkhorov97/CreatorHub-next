import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { X } from 'phosphor-react';
import { CreatorProfile } from '../../types/creatorhub';
import { useAction, useApi } from '../../hooks/useApi';
import { Button, Feedback, Field, Notice, Picture, QueryState, TextArea, values } from '../common/UI';

export function ContactCreator({
	creator,
	serviceId = '',
	onDismiss,
}: {
	creator: CreatorProfile;
	serviceId?: string;
	onDismiss: () => void;
}) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const action = useAction();
	const services = useApi('getServices', { input: { creatorId: creator._id, limit: 50 } });
	const dialog = useRef<HTMLDialogElement & { showModal: () => void; close: () => void }>(null);
	const requestKey = useRef('');
	const [selectedService, setSelectedService] = useState(serviceId);
	const titleId = useId();
	const messageHelpId = useId();
	const [brief, setBrief] = useState('');
	const [messageTouched, setMessageTouched] = useState(false);
	const messageInvalid = messageTouched && brief.trim().length < 20;
	useEffect(() => {
		const element = dialog.current;
		const previous = document.activeElement as HTMLElement | null;
		const overflow = document.body.style.overflow;
		element?.showModal();
		document.body.style.overflow = 'hidden';
		return () => {
			element?.close();
			document.body.style.overflow = overflow;
			previous?.focus();
		};
	}, []);
	return (
		<dialog
			ref={dialog}
			className="contact-creator-dialog"
			aria-labelledby={titleId}
			onCancel={(event) => {
				event.preventDefault();
				if (!action.busy) onDismiss();
			}}
			onClick={(event) => {
				if (event.target === event.currentTarget && !action.busy) onDismiss();
			}}
		>
			<section className="contact-creator-panel">
				<header className="contact-creator-heading">
					<h2 id={titleId}>{t('Contact Creator')}</h2>
					<button
						type="button"
						className="contact-creator-close"
						onClick={onDismiss}
						disabled={action.busy}
						aria-label={t('Close inquiry dialog')}
					>
						<X size={25} />
					</button>
				</header>
				<div className="contact-creator-recipient">
					<Picture avatar src={creator.identity.avatarUrl} alt={creator.identity.displayName} />
					<div>
						<p>{t('Message creator', { name: creator.identity.displayName })}</p>
						<Link href={`/creators/${creator.slug}`} target="_blank" rel="noreferrer">
							{t('View creator profile')}
						</Link>
					</div>
				</div>
				<form
					className="contact-creator-form"
					onSubmit={(event) => {
						event.preventDefault();
						const fields = values(event.currentTarget);
						if (fields.brief.trim().length < 20) {
							setMessageTouched(true);
							(event.currentTarget.elements.namedItem('brief') as HTMLTextAreaElement)?.focus();
							return;
						}
						void action.run(async () => {
							if (fields.budgetMin && fields.budgetMax && Number(fields.budgetMin) > Number(fields.budgetMax))
								throw new Error(t('Maximum budget must not be below minimum budget.'));
							requestKey.current ||= crypto.randomUUID();
							const selected = services.value?.find((service) => service._id === fields.serviceId);
							const sent = await action.mutate('sendInquiry', {
								input: {
									creatorId: creator._id,
									clientRequestKey: requestKey.current,
									subject: String(selected?.title || t('Project inquiry')).slice(0, 150),
									brief: fields.brief.trim(),
									serviceId: fields.serviceId || undefined,
									budgetMin: fields.budgetMin ? Number(fields.budgetMin) : undefined,
									budgetMax: fields.budgetMax ? Number(fields.budgetMax) : undefined,
									desiredDeadline: fields.desiredDeadline
										? new Date(fields.desiredDeadline + 'T00:00:00+09:00').toISOString()
										: undefined,
								},
							});
							await router.replace(`/inquiries/${sent._id}`);
						});
					}}
				>
					<QueryState loading={services.loading} error={services.error} retry={() => services.refetch()} />
					<Field label={t('Service Selection')}>
						<select
							name="serviceId"
							value={selectedService}
							onChange={(event) => setSelectedService(event.target.value)}
							disabled={action.busy || services.loading}
						>
							<option value="">{t('General inquiry')}</option>
							{services.value?.map((service) => (
								<option key={service._id} value={service._id}>
									{service.title}
								</option>
							))}
						</select>
					</Field>
					<TextArea
						label={t('Your Inquiry Message')}
						name="brief"
						value={brief}
						onChange={(event) => setBrief(event.target.value)}
						onBlur={() => setMessageTouched(true)}
						onInvalid={(event) => {
							event.preventDefault();
							setMessageTouched(true);
							event.currentTarget.focus();
						}}
						aria-invalid={messageInvalid}
						aria-describedby={messageHelpId}
						required
						minLength={20}
						maxLength={10000}
						rows={6}
						readOnly={action.busy}
						placeholder={t('Describe your project, what you need, and when you would like to get started.')}
					/>
					<div id={messageHelpId} className="inquiry-message-help">
						<span className={messageInvalid ? 'inquiry-message-error' : ''} aria-live="polite">
							{messageInvalid ? t('Please enter at least 20 characters.') : t('At least 20 characters')}
						</span>
						<span className="inquiry-message-count">{brief.length.toLocaleString(router.locale)} / 10,000</span>
					</div>
					<details className="inquiry-deadline">
						<summary>{t('Add a preferred deadline')}</summary>
						<Field label={t('Desired deadline')} name="desiredDeadline" type="date" disabled={action.busy} />
					</details>
					<div className="contact-creator-bottom">
						<fieldset className="inquiry-budget">
							<legend>{t('Estimated Budget')}</legend>
							<div className="inquiry-budget-inputs">
								<span aria-hidden="true">₩</span>
								<input
									name="budgetMin"
									type="text"
									inputMode="numeric"
									pattern="[0-9]{1,10}"
									maxLength={10}
									onInput={(event) => {
										event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, '');
										event.currentTarget.setCustomValidity(
											Number(event.currentTarget.value) > 1000000000 ? t('Maximum budget is 1,000,000,000 KRW.') : '',
										);
									}}
									min={0}
									max={1000000000}
									step={1}
									placeholder={t('Minimum')}
									aria-label={t('Minimum budget (KRW)')}
									disabled={action.busy}
								/>
								<span aria-hidden="true">–</span>
								<input
									name="budgetMax"
									type="text"
									inputMode="numeric"
									pattern="[0-9]{1,10}"
									maxLength={10}
									onInput={(event) => {
										event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, '');
										event.currentTarget.setCustomValidity(
											Number(event.currentTarget.value) > 1000000000 ? t('Maximum budget is 1,000,000,000 KRW.') : '',
										);
									}}
									min={0}
									max={1000000000}
									step={1}
									placeholder={t('Maximum')}
									aria-label={t('Maximum budget (KRW)')}
									disabled={action.busy}
								/>
							</div>
						</fieldset>
						<Button type="submit" disabled={action.busy || !!services.error || creator.availability === 'UNAVAILABLE'}>
							{action.busy ? t('Sending…') : t('Send Inquiry')}
						</Button>
					</div>
					{creator.availability === 'UNAVAILABLE' && <Notice>{t('This creator is not accepting inquiries.')}</Notice>}
					<Feedback error={action.error} busy={action.busy} busyLabel="Sending…" />
					<div className="contact-creator-footer">
						<p>{t('Your inquiry goes directly to their private inbox.')}</p>
						<button type="button" onClick={onDismiss} disabled={action.busy}>
							{t('Cancel')}
						</button>
					</div>
				</form>
			</section>
		</dialog>
	);
}
