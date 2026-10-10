import { useTranslation } from 'next-i18next';

export default function PendingApprovalBadge({ count }: { count?: number }) {
	const { t: translate } = useTranslation('common');
	if (count === undefined || count <= 0) return null;

	return (
		<span
			className="pending-approval-badge"
			role="status"
			aria-label={translate('{{count}} pending approvals', { count })}
		>
			{count}
		</span>
	);
}
