import { useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { CheckCircle, PaperPlaneTilt } from 'phosphor-react';
import { FieldErrors, useFormValidation } from '../../hooks/useFormValidation';
import { Button, Field, TextArea, values } from './UI';
export default function ContactForm() {
	const { t } = useTranslation('common');
	const lock = useRef(false);
	const [busy, setBusy] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState('');
	const [retryUntil, setRetryUntil] = useState(0);
	const validation = useFormValidation();
	return (
		<section className="contact-form-panel">
			<h2>{t('Contact the CreatorHub team')}</h2>
			<p>{t('Questions, feedback or a problem with your account? Send us a message.')}</p>
			{sent ? (
				<div className="contact-success" role="status">
					<CheckCircle size={36} aria-hidden />
					<h3>{t('Message sent')}</h3>
					<p>{t('Thank you. The CreatorHub team will reply to your email.')}</p>
					<Button secondary onClick={() => setSent(false)}>
						{t('Send another message')}
					</Button>
				</div>
			) : (
				<form
					{...validation.form}
					onSubmit={async (event) => {
						event.preventDefault();
						if (lock.current || !validation.validate(event.currentTarget)) return;
						if (Date.now() < retryUntil) {
							setError(t('Please wait before sending another message.'));
							return;
						}
						const form = event.currentTarget;
						const input = values(form);
						lock.current = true;
						setBusy(true);
						setError('');
						try {
							const response = await fetch('/api/contact', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(input),
							});
							const result = await response.json();
							if (response.status === 429)
								setRetryUntil(Date.now() + Number(response.headers.get('Retry-After') || 900) * 1000);
							if (!response.ok) throw new Error(result.error);
							setSent(true);
							form.reset();
						} catch (error) {
							setError(
								t(
									error instanceof Error
										? error.message
										: 'Your message could not be delivered. Please try again later.',
								),
							);
						} finally {
							lock.current = false;
							setBusy(false);
						}
					}}
				>
					<FieldErrors value={validation.errors}>
						<div className="contact-form-fields">
							<Field
								label="Your name"
								name="name"
								required
								minLength={2}
								maxLength={100}
								autoComplete="name"
								disabled={busy}
							/>
							<Field
								label="Email address"
								name="email"
								type="email"
								required
								maxLength={254}
								autoComplete="email"
								disabled={busy}
							/>
						</div>
						<TextArea
							label="Your message"
							name="message"
							required
							minLength={10}
							maxLength={5000}
							rows={5}
							disabled={busy}
						/>
					</FieldErrors>
					<label className="contact-honeypot" aria-hidden>
						Website
						<input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
					</label>
					{error && (
						<p role="alert" className="field-error">
							{error}
						</p>
					)}
					<Button type="submit" loading={busy} loadingLabel={t('Sending…')}>
						<PaperPlaneTilt size={20} aria-hidden />
						{t('Send message')}
					</Button>
				</form>
			)}
		</section>
	);
}
