// Generated and schema-validated GraphQL documents.
import { gql } from '@apollo/client';
export const adminDecideContentReview = gql`
	mutation adminDecideContentReview($id: ID!, $approve: Boolean!, $revision: DateTime!, $reason: String) {
		adminDecideContentReview(id: $id, approve: $approve, revision: $revision, reason: $reason) {
			_id
			createdAt
			updatedAt
			kind
			targetId
			ownerId
			title
			status
			reason
			baseUpdatedAt
			preview
		}
	}
`;
export const adminUpdateUser = gql`
	mutation adminUpdateUser($id: ID!, $input: AdminUserUpdateInput!) {
		adminUpdateUser(id: $id, input: $input) {
			_id
			createdAt
			updatedAt
			displayName
			avatarUrl
			role
			status
			preferredLocale
			lastLoginAt
			deletedAt
		}
	}
`;
export const adminSetUserStatus = gql`
	mutation adminSetUserStatus($id: ID!, $status: UserStatus!) {
		adminSetUserStatus(id: $id, status: $status) {
			_id
			createdAt
			updatedAt
			displayName
			avatarUrl
			role
			status
			preferredLocale
			lastLoginAt
			deletedAt
		}
	}
`;
export const adminUpdateCreator = gql`
	mutation adminUpdateCreator($id: ID!, $input: UpdateCreatorInput!, $status: ProfileStatus) {
		adminUpdateCreator(id: $id, input: $input, status: $status) {
			_id
			createdAt
			updatedAt
			userId
			slug
			headline
			bio
			city
			remoteAvailable
			availability
			categoryIds
			skills
			socialLinks {
				label
				url
			}
			status
			publishedAt
			deletedAt
			identity {
				displayName
				avatarUrl
			}
		}
	}
`;
export const adminCreateProject = gql`
	mutation adminCreateProject($creatorId: ID!, $input: CreateProjectInput!) {
		adminCreateProject(creatorId: $creatorId, input: $input) {
			_id
			createdAt
			updatedAt
			creatorId
			categoryId
			title
			slug
			summary
			description
			coverImageUrl
			media {
				type
				url
				altText
				sortOrder
			}
			tags
			externalUrl
			status
			publishedAt
			deletedAt
		}
	}
`;
export const adminUpdateProject = gql`
	mutation adminUpdateProject($id: ID!, $input: AdminProjectUpdateInput!, $status: ProjectStatus) {
		adminUpdateProject(id: $id, input: $input, status: $status) {
			_id
			createdAt
			updatedAt
			creatorId
			categoryId
			title
			slug
			summary
			description
			coverImageUrl
			media {
				type
				url
				altText
				sortOrder
			}
			tags
			externalUrl
			status
			publishedAt
			deletedAt
		}
	}
`;
export const adminCreateService = gql`
	mutation adminCreateService($creatorId: ID!, $input: CreateServiceInput!) {
		adminCreateService(creatorId: $creatorId, input: $input) {
			_id
			createdAt
			updatedAt
			creatorId
			categoryId
			title
			description
			pricingType
			startingPrice
			currency
			estimatedDays
			deliverables
			status
			deletedAt
		}
	}
`;
export const adminUpdateService = gql`
	mutation adminUpdateService($id: ID!, $input: UpdateServiceInput!, $status: ServiceStatus) {
		adminUpdateService(id: $id, input: $input, status: $status) {
			_id
			createdAt
			updatedAt
			creatorId
			categoryId
			title
			description
			pricingType
			startingPrice
			currency
			estimatedDays
			deliverables
			status
			deletedAt
		}
	}
`;
export const adminSetRemoved = gql`
	mutation adminSetRemoved($kind: AdminKind!, $id: ID!, $removed: Boolean!) {
		adminSetRemoved(kind: $kind, id: $id, removed: $removed)
	}
`;
export const adminUpdateSiteContent = gql`
	mutation adminUpdateSiteContent($input: SiteContentInput!) {
		adminUpdateSiteContent(input: $input) {
			homeHeading
			homeSubheading
			aboutText
			contactEmail
			contactText
			footerCopy
		}
	}
`;
export const createEvent = gql`
	mutation createEvent($input: EventInput!) {
		createEvent(input: $input) {
			_id
			createdAt
			updatedAt
			title
			description
			startsAt
			endsAt
			location
			eventUrl
			status
			isDemo
		}
	}
`;
export const updateEvent = gql`
	mutation updateEvent($id: ID!, $input: UpdateEventInput!) {
		updateEvent(id: $id, input: $input) {
			_id
			createdAt
			updatedAt
			title
			description
			startsAt
			endsAt
			location
			eventUrl
			status
			isDemo
		}
	}
`;
export const createCategory = gql`
	mutation createCategory($input: CategoryInput!) {
		createCategory(input: $input) {
			_id
			createdAt
			updatedAt
			slug
			name
			description
			sortOrder
			isActive
		}
	}
`;
export const updateCategory = gql`
	mutation updateCategory($id: ID!, $input: UpdateCategoryInput!) {
		updateCategory(id: $id, input: $input) {
			_id
			createdAt
			updatedAt
			slug
			name
			description
			sortOrder
			isActive
		}
	}
`;
export const moderateProjectComment = gql`
	mutation moderateProjectComment($commentId: ID!, $hidden: Boolean!) {
		moderateProjectComment(commentId: $commentId, hidden: $hidden) {
			_id
			createdAt
			updatedAt
			clientCommentKey
			userId
			projectId
			content
			status
			editedAt
			deletedAt
		}
	}
`;
export const setAccountSuspended = gql`
	mutation setAccountSuspended($userId: ID!, $suspended: Boolean!) {
		setAccountSuspended(userId: $userId, suspended: $suspended) {
			_id
			createdAt
			updatedAt
			displayName
			avatarUrl
			role
			status
			preferredLocale
			lastLoginAt
			deletedAt
		}
	}
`;
