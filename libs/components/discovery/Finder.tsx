import Link from 'next/link';
import { ArrowUpRight, MagnifyingGlass } from 'phosphor-react';
import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Button, Empty, Notice, QueryState, TextArea } from '../common/UI';
import { CreatorCard, ProjectCard, ServiceCard } from './Cards';

export default function Finder({ compact = false }: { compact?: boolean }) {
	const [request, setRequest] = useState('');
	const [submitted, setSubmitted] = useState('');
	const result = useApi('discoverCreators', { input: { request: submitted } }, submitted.length < 3);
	return (
		<section className={compact ? 'finder panel' : 'finder'}>
			<h2>{compact ? 'AI creator finder' : 'Find the right creator'}</h2>
			<p className="muted">Describe what you’re looking for and we’ll help you find creators.</p>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					setSubmitted(request.trim());
				}}
			>
				<TextArea
					label="Your project"
					placeholder="Brand designer in Seoul under ₩1,000,000"
					minLength={3}
					maxLength={1000}
					required
					value={request}
					onChange={(e) => setRequest(e.target.value)}
				/>
				<Button type="submit" disabled={result.loading}>
					Find creators
				</Button>
			</form>
			<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
			{result.value && (
				<>
					<Notice>{result.value.explanation}</Notice>
					{result.value.creators.length === 0 &&
						result.value.projects.length === 0 &&
						result.value.services.length === 0 && (
							<Empty title="No matches found">Try a different description or budget.</Empty>
						)}
					<div className={compact ? 'finder-results' : 'grid'}>
						{result.value.creators.map((c) => (
							<CreatorCard key={c._id} creator={c} />
						))}
						{!compact && result.value.projects.map((p) => <ProjectCard key={p._id} project={p} />)}
						{!compact && result.value.services.map((s) => <ServiceCard key={s._id} service={s} />)}
					</div>
					{compact && (
						<Link passHref href="/ai-finder">
							Open AI finder <ArrowUpRight />
						</Link>
					)}
				</>
			)}
			<Link passHref className="finder-footer" href="/creators">
				<MagnifyingGlass />
				Search published creator profiles
			</Link>
		</section>
	);
}
