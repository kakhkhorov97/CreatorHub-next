// Generated and schema-validated GraphQL documents.
import { gql } from '@apollo/client';
export const myContentReviews = gql`
	query myContentReviews {
		myContentReviews {
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
export const getSiteContent = gql`
	query getSiteContent {
		getSiteContent {
			homeHeading
			homeSubheading
			aboutText
			contactEmail
			contactText
			footerCopy
		}
	}
`;
export const getEvents = gql`
	query getEvents($input: EventsInput! = {}) {
		getEvents(input: $input) {
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
export const getEvent = gql`
	query getEvent($id: ID!) {
		getEvent(id: $id) {
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
export const apiName = gql`
	query apiName {
		apiName
	}
`;
export const getMyAuthIdentities = gql`
	query getMyAuthIdentities {
		getMyAuthIdentities {
			_id
			createdAt
			updatedAt
			userId
			provider
			providerSubject
			verifiedAt
			revokedAt
			lastLoginAt
		}
	}
`;
export const categories = gql`
	query categories {
		categories {
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
export const creator = gql`
	query creator($slug: String!) {
		creator(slug: $slug) {
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
export const myCreatorProfile = gql`
	query myCreatorProfile {
		myCreatorProfile {
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
export const getCities = gql`
	query getCities {
		getCities {
			key
			nameEn
			nameKo
		}
	}
`;
export const getCreators = gql`
	query getCreators($input: DiscoveryInput! = {}) {
		getCreators(input: $input) {
			list {
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
			metaCounter {
				total
			}
		}
	}
`;
export const getProjects = gql`
	query getProjects($input: DiscoveryInput! = {}) {
		getProjects(input: $input) {
			list {
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
			metaCounter {
				total
			}
		}
	}
`;
export const getServices = gql`
	query getServices($input: DiscoveryInput! = {}) {
		getServices(input: $input) {
			list {
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
			metaCounter {
				total
			}
		}
	}
`;
export const discoverCreators = gql`
	query discoverCreators($input: AssistantInput!) {
		discoverCreators(input: $input) {
			mode
			explanation
			creators {
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
			projects {
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
			services {
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
	}
`;
export const getMyProjectLike = gql`
	query getMyProjectLike($projectId: ID!) {
		getMyProjectLike(projectId: $projectId)
	}
`;
export const getProjectLikeCount = gql`
	query getProjectLikeCount($projectId: ID!) {
		getProjectLikeCount(projectId: $projectId)
	}
`;
export const getMyFollows = gql`
	query getMyFollows($input: PageInput! = {}) {
		getMyFollows(input: $input) {
			list {
				_id
				createdAt
				updatedAt
				followerId
				creatorId
				isActive
				followedAt
			}
			metaCounter {
				total
			}
		}
	}
`;
export const getSavedProjects = gql`
	query getSavedProjects($input: PageInput! = {}) {
		getSavedProjects(input: $input) {
			list {
				projectId
				savedAt
				available
				project {
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
			metaCounter {
				total
			}
		}
	}
`;
export const getProjectComments = gql`
	query getProjectComments($projectId: ID!, $input: PageInput! = {}) {
		getProjectComments(projectId: $projectId, input: $input) {
			list {
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
			metaCounter {
				total
			}
		}
	}
`;
export const getInquiry = gql`
	query getInquiry($inquiryId: ID!) {
		getInquiry(inquiryId: $inquiryId) {
			_id
			createdAt
			updatedAt
			clientId
			creatorId
			serviceId
			subject
			brief
			budgetMin
			budgetMax
			currency
			desiredDeadline
			serviceSnapshot {
				title
				pricingType
				startingPrice
				currency
				estimatedDays
				deliverables
			}
			status
			outcome
			closedById
			closedAt
			submittedAt
			lastMessageAt
			version
		}
	}
`;
export const getInquiries = gql`
	query getInquiries($creatorInbox: Boolean! = false, $input: PageInput! = {}) {
		getInquiries(creatorInbox: $creatorInbox, input: $input) {
			list {
				_id
				createdAt
				updatedAt
				clientId
				creatorId
				serviceId
				subject
				brief
				budgetMin
				budgetMax
				currency
				desiredDeadline
				serviceSnapshot {
					title
					pricingType
					startingPrice
					currency
					estimatedDays
					deliverables
				}
				status
				outcome
				closedById
				closedAt
				submittedAt
				lastMessageAt
				version
			}
			metaCounter {
				total
			}
		}
	}
`;
export const getInquiryMessages = gql`
	query getInquiryMessages($inquiryId: ID!, $input: PageInput! = {}) {
		getInquiryMessages(inquiryId: $inquiryId, input: $input) {
			list {
				_id
				createdAt
				inquiryId
				senderId
				clientMessageKey
				body
				readAt
			}
			metaCounter {
				total
			}
		}
	}
`;
export const getInquiryEvents = gql`
	query getInquiryEvents($inquiryId: ID!, $input: PageInput! = {}) {
		getInquiryEvents(inquiryId: $inquiryId, input: $input) {
			list {
				_id
				createdAt
				inquiryId
				performedById
				type
				fromStatus
				toStatus
				messageId
				version
			}
			metaCounter {
				total
			}
		}
	}
`;
export const getInquiryFeedback = gql`
	query getInquiryFeedback($inquiryId: ID!) {
		getInquiryFeedback(inquiryId: $inquiryId) {
			_id
			createdAt
			updatedAt
			creatorId
			serviceId
			rating
			feedback
			authorName
		}
	}
`;
export const getCreatorFeedback = gql`
	query getCreatorFeedback($creatorId: ID!, $input: PageInput! = {}) {
		getCreatorFeedback(creatorId: $creatorId, input: $input) {
			list {
				_id
				createdAt
				updatedAt
				creatorId
				serviceId
				rating
				feedback
				authorName
			}
			metaCounter {
				total
			}
		}
	}
`;
export const getNotifications = gql`
	query getNotifications($input: PageInput! = {}, $unreadOnly: Boolean! = false) {
		getNotifications(input: $input, unreadOnly: $unreadOnly) {
			list {
				_id
				createdAt
				recipientId
				inquiryEventId
				activityEventId
				readAt
				event {
					_id
					createdAt
					inquiryId
					performedById
					type
					fromStatus
					toStatus
					messageId
					version
				}
				activityEvent {
					_id
					createdAt
					updatedAt
					performedById
					creatorId
					type
					projectId
					commentId
				}
				unavailable
			}
			metaCounter {
				total
			}
		}
	}
`;
export const getUnreadNotificationCount = gql`
	query getUnreadNotificationCount {
		getUnreadNotificationCount
	}
`;
export const getProject = gql`
	query getProject($projectId: ID!) {
		getProject(projectId: $projectId) {
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
export const getMyProjects = gql`
	query getMyProjects($input: PageInput! = {}) {
		getMyProjects(input: $input) {
			list {
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
			metaCounter {
				total
			}
		}
	}
`;
export const getService = gql`
	query getService($serviceId: ID!) {
		getService(serviceId: $serviceId) {
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
export const getMyServices = gql`
	query getMyServices($input: PageInput! = {}) {
		getMyServices(input: $input) {
			list {
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
			metaCounter {
				total
			}
		}
	}
`;
export const me = gql`
	query me {
		me {
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
