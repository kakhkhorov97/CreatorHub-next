import { AdminKind } from '../../types/creatorhub';

export const labels: Record<AdminKind, string> = {
	USERS: 'Users',
	CREATORS: 'Creators',
	PROJECTS: 'Projects',
	SERVICES: 'Services',
	COMMENTS: 'Comments',
};

export const states: Record<AdminKind, string[]> = {
	USERS: ['ACTIVE', 'SUSPENDED', 'DELETED'],
	CREATORS: ['DRAFT', 'PUBLISHED', 'HIDDEN'],
	PROJECTS: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
	SERVICES: ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'],
	COMMENTS: ['ACTIVE', 'HIDDEN', 'DELETED'],
};
