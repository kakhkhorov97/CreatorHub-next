import Link from 'next/link';
import { useState } from 'react';
import { Button, date, Empty, Feedback, Heading, label, Pager, QueryState } from '../libs/components/common/UI';
import Layout, { Guard } from '../libs/components/layout/LayoutBasic';
import { useAction, useApi } from '../libs/hooks/useApi';
import { usePaged } from '../libs/hooks/usePaged';

function Notifications() {
	return (
		<Layout title="Notifications" area="account">
			<Guard>
				<NotificationContent />
			</Guard>
		</Layout>
	);
}

function NotificationContent() {
	const [unreadOnly, setUnreadOnly] = useState(false);
	const result = usePaged('getNotifications', { unreadOnly });
	const count = useApi('getUnreadNotificationCount', {}, false, 30000);
	const action = useAction();
	return (
		<>
			<Heading title="Notifications" />
			<nav className="tabs">
				<button className={!unreadOnly ? 'active' : ''} onClick={() => setUnreadOnly(false)}>
					All
				</button>
				<button className={unreadOnly ? 'active' : ''} onClick={() => setUnreadOnly(true)}>
					Unread ({count.value || 0})
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
								<h3>{n.unavailable ? 'This activity is no longer available' : label(event?.type || activity?.type)}</h3>
								<time>{date(n.createdAt)}</time>
								{!n.unavailable && href && (
									<Link passHref href={href}>
										View {event ? 'inquiry' : 'project'}
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
									Mark as read
								</Button>
							)}
						</article>
					);
				})}
			</div>
			{!result.loading && !result.error && !result.rows.length && <Empty title="You’re all caught up" />}
			<Pager {...result} />
			<Feedback {...action} />
		</>
	);
}

export default Notifications;
