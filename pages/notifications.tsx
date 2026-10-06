import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useState } from 'react';
import { Button, date, Empty, Feedback, Heading, label, Pager, QueryState } from '../libs/components/common/UI';
import Layout, { Guard } from '../libs/components/layout/LayoutBasic';
import { useAction, useApi } from '../libs/hooks/useApi';
import { usePaged } from '../libs/hooks/usePaged';

function Notifications() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('Notifications')} area="account">
			<Guard>
				<NotificationContent />
			</Guard>
		</Layout>
	);
}

function NotificationContent() {
	const { t: translate } = useSiteTranslation('common');

	const [unreadOnly, setUnreadOnly] = useState(false);
	const result = usePaged('getNotifications', { unreadOnly });
	const count = useApi('getUnreadNotificationCount', {}, false, 30000);
	const action = useAction();
	return (
		<>
			<Heading title={translate('Notifications')} />
			<nav className="tabs">
				<button className={!unreadOnly ? 'active' : ''} onClick={() => setUnreadOnly(false)}>
					{translate('All')}
				</button>
				<button className={unreadOnly ? 'active' : ''} onClick={() => setUnreadOnly(true)}>
					{translate('Unread (')}
					{count.value || 0})
				</button>
			</nav>
			<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
			<div className="notification-list">
				{result.rows.map((n) => {
					const event = n.event;
					const activity = n.activityEvent;
					const href = event
						? `/inquiries/${event.inquiryId}`
						: activity?.projectId
						? `/projects/${activity.projectId}`
						: null;
					return (
						<article className={`list-row ${n.readAt ? '' : 'unread'}`} key={n._id}>
							<div>
								<h3>
									{n.unavailable
										? translate('This activity is no longer available')
										: label(event?.type || activity?.type)}
								</h3>
								<time>{date(n.createdAt)}</time>
								{!n.unavailable && href && (
									<Link passHref href={href}>
										{translate('View')} {event ? translate('inquiry') : translate('project')}
									</Link>
								)}
							</div>
							{!n.readAt && (
								<Button
									secondary
									disabled={action.busy}
									onClick={() =>
										action.run(async () => {
											await action.mutate('markNotificationRead', { notificationId: n._id });
											await result.refetch();
											await count.refetch();
										})
									}
								>
									{translate('Mark as read')}
								</Button>
							)}
						</article>
					);
				})}
			</div>
			{!result.loading && !result.error && !result.rows.length && <Empty title={translate('You’re all caught up')} />}
			<Pager {...result} />
			<Feedback {...action} />
		</>
	);
}

export default Notifications;
