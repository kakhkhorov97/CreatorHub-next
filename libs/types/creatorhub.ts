// Generated from docs/schema.graphql. Run npm run contract:generate after a schema update.
export interface ContentReview {
	_id: string;
	createdAt: string;
	updatedAt: string;
	kind: string;
	targetId: string;
	ownerId: string;
	title: string;
	status: string;
	reason?: string | null;
	baseUpdatedAt: string;
	preview: string;
}
export interface User {
	_id: string;
	createdAt: string;
	updatedAt: string;
	displayName: string;
	avatarUrl?: string | null;
	role: UserRole;
	status: UserStatus;
	preferredLocale: Locale;
	lastLoginAt?: string | null;
	deletedAt?: string | null;
}
export type UserRole = 'USER' | 'CREATOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type Locale = 'ko' | 'en' | 'uz';
export interface City {
	key: string;
	nameEn: string;
	nameKo: string;
}
export interface Category {
	_id: string;
	createdAt: string;
	updatedAt: string;
	slug: string;
	name: string;
	description?: string | null;
	sortOrder: number;
	isActive: boolean;
}
export interface MetaCounter {
	total: number;
}
export interface SocialLink {
	label: string;
	url: string;
}
export interface CreatorProfile {
	_id: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	slug: string;
	headline?: string | null;
	bio?: string | null;
	city?: string | null;
	remoteAvailable: boolean;
	availability: CreatorAvailability;
	categoryIds: Array<string>;
	skills: Array<string>;
	socialLinks: Array<SocialLink>;
	status: ProfileStatus;
	publishedAt?: string | null;
	deletedAt?: string | null;
	identity: CreatorIdentity;
}
export type CreatorAvailability = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
export type ProfileStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
export interface Creators {
	list: Array<CreatorProfile>;
	metaCounter: Array<MetaCounter>;
}
export interface PortfolioMedia {
	type: MediaType;
	url: string;
	altText: string;
	sortOrder: number;
}
export type MediaType = 'IMAGE' | 'VIDEO';
export interface PortfolioProject {
	_id: string;
	createdAt: string;
	updatedAt: string;
	creatorId: string;
	categoryId?: string | null;
	title: string;
	slug: string;
	summary?: string | null;
	description?: string | null;
	coverImageUrl?: string | null;
	media: Array<PortfolioMedia>;
	tags: Array<string>;
	externalUrl?: string | null;
	status: ProjectStatus;
	publishedAt?: string | null;
	deletedAt?: string | null;
}
export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export interface Projects {
	list: Array<PortfolioProject>;
	metaCounter: Array<MetaCounter>;
}
export interface CreatorService {
	_id: string;
	createdAt: string;
	updatedAt: string;
	creatorId: string;
	categoryId?: string | null;
	title: string;
	description?: string | null;
	pricingType: PricingType;
	startingPrice?: number | null;
	currency: Currency;
	estimatedDays?: number | null;
	deliverables: Array<string>;
	status: ServiceStatus;
	deletedAt?: string | null;
}
export type PricingType = 'STARTING_AT' | 'CUSTOM_QUOTE';
export type Currency = 'KRW';
export type ServiceStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export interface Services {
	list: Array<CreatorService>;
	metaCounter: Array<MetaCounter>;
}
export interface ProjectComment {
	_id: string;
	createdAt: string;
	updatedAt: string;
	clientCommentKey: string;
	userId: string;
	projectId: string;
	content: string;
	status: CommentStatus;
	editedAt?: string | null;
	deletedAt?: string | null;
}
export type CommentStatus = 'ACTIVE' | 'HIDDEN' | 'DELETED';
export interface Comments {
	list: Array<ProjectComment>;
	metaCounter: Array<MetaCounter>;
}
export interface AdminEntry {
	_id: string;
	title: string;
	status: string;
	updatedAt: string;
	deletedAt?: string | null;
	ownerName?: string | null;
	projectTitle?: string | null;
	user?: User | null;
	creator?: CreatorProfile | null;
	project?: PortfolioProject | null;
	service?: CreatorService | null;
	comment?: ProjectComment | null;
}
export interface AdminDirectory {
	list: Array<AdminEntry>;
	metaCounter: Array<MetaCounter>;
}
export interface AdminOverview {
	users: number;
	creators: number;
	projects: number;
	services: number;
	comments: number;
	categories: number;
	events: number;
}
export interface SiteContent {
	homeHeading: string;
	homeSubheading: string;
	aboutText: string;
	contactEmail: string;
	contactText: string;
	footerCopy: string;
}
export interface CreativeEvent {
	_id: string;
	createdAt: string;
	updatedAt: string;
	title: string;
	description: string;
	startsAt: string;
	endsAt: string;
	location: string;
	eventUrl?: string | null;
	status: EventStatus;
	isDemo: boolean;
}
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export interface AuthPayload {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	user: User;
}
export interface AuthIdentity {
	_id: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	provider: AuthProvider;
	providerSubject: string;
	verifiedAt?: string | null;
	revokedAt?: string | null;
	lastLoginAt?: string | null;
}
export type AuthProvider = 'EMAIL' | 'PHONE' | 'GOOGLE' | 'TELEGRAM' | 'KAKAO';
export interface CreatorIdentity {
	displayName: string;
	avatarUrl?: string | null;
}
export interface DiscoveryResult {
	mode: string;
	explanation: string;
	creators: Array<CreatorProfile>;
	projects: Array<PortfolioProject>;
	services: Array<CreatorService>;
}
export interface CreatorFollow {
	_id: string;
	createdAt: string;
	updatedAt: string;
	followerId: string;
	creatorId: string;
	isActive: boolean;
	followedAt: string;
}
export interface Followings {
	list: Array<CreatorFollow>;
	metaCounter: Array<MetaCounter>;
}
export interface FollowerIdentity {
	_id: string;
	displayName: string;
	avatarUrl?: string | null;
}
export interface Followers {
	list: Array<FollowerIdentity>;
	metaCounter: Array<MetaCounter>;
}
export interface SavedProjectResult {
	projectId: string;
	savedAt: string;
	available: boolean;
	project?: PortfolioProject | null;
}
export interface SavedProjects {
	list: Array<SavedProjectResult>;
	metaCounter: Array<MetaCounter>;
}
export interface ServiceFeedback {
	_id: string;
	createdAt: string;
	updatedAt: string;
	creatorId: string;
	serviceId?: string | null;
	rating: number;
	feedback: string;
	authorName: string;
}
export interface ServiceFeedbacks {
	list: Array<ServiceFeedback>;
	metaCounter: Array<MetaCounter>;
}
export interface InquiryEvent {
	_id: string;
	createdAt: string;
	inquiryId: string;
	performedById: string;
	type: InquiryEventType;
	fromStatus: InquiryStatus;
	toStatus: InquiryStatus;
	messageId?: string | null;
	version: number;
}
export type InquiryEventType = 'COMPLETED' | 'SUBMITTED' | 'MESSAGE_SENT' | 'DECLINED' | 'CLOSED' | 'CANCELLED';
export type InquiryStatus = 'DRAFT' | 'SENT' | 'IN_DISCUSSION' | 'DECLINED' | 'CLOSED' | 'CANCELLED';
export interface InquiryEvents {
	list: Array<InquiryEvent>;
	metaCounter: Array<MetaCounter>;
}
export interface InquiryMessage {
	_id: string;
	createdAt: string;
	inquiryId: string;
	senderId: string;
	clientMessageKey: string;
	body: string;
	readAt?: string | null;
}
export interface InquiryMessages {
	list: Array<InquiryMessage>;
	metaCounter: Array<MetaCounter>;
}
export interface InquiryServiceSnapshot {
	title: string;
	pricingType: PricingType;
	startingPrice?: number | null;
	currency: Currency;
	estimatedDays?: number | null;
	deliverables: Array<string>;
}
export interface Inquiry {
	_id: string;
	createdAt: string;
	updatedAt: string;
	counterpartyName?: string | null;
	counterpartyAvatarUrl?: string | null;
	unreadCount?: number | null;
	clientId: string;
	creatorId: string;
	serviceId?: string | null;
	subject?: string | null;
	brief?: string | null;
	budgetMin?: number | null;
	budgetMax?: number | null;
	currency: Currency;
	desiredDeadline?: string | null;
	serviceSnapshot?: InquiryServiceSnapshot | null;
	status: InquiryStatus;
	outcome?: InquiryOutcome | null;
	closedById?: string | null;
	closedAt?: string | null;
	submittedAt?: string | null;
	lastMessageAt?: string | null;
	version: number;
}
export type InquiryOutcome = 'AGREED_TO_PROCEED' | 'COMPLETED' | 'NOT_PROCEEDING' | 'NO_RESPONSE';
export interface Inquiries {
	list: Array<Inquiry>;
	metaCounter: Array<MetaCounter>;
}
export interface ActivityEvent {
	_id: string;
	createdAt: string;
	updatedAt: string;
	performedById: string;
	creatorId: string;
	type: ActivityEventType;
	projectId?: string | null;
	commentId?: string | null;
}
export type ActivityEventType = 'PROJECT_PUBLISHED' | 'PROJECT_LIKED' | 'PROJECT_COMMENTED' | 'CREATOR_FOLLOWED';
export interface NotificationResult {
	_id: string;
	createdAt: string;
	recipientId: string;
	inquiryEventId?: string | null;
	activityEventId?: string | null;
	readAt?: string | null;
	event?: InquiryEvent | null;
	activityEvent?: ActivityEvent | null;
	unavailable: boolean;
}
export interface Notifications {
	list: Array<NotificationResult>;
	metaCounter: Array<MetaCounter>;
}
export type AdminKind = 'USERS' | 'CREATORS' | 'PROJECTS' | 'SERVICES' | 'COMMENTS';
export interface AdminDirectoryInput {
	page?: number | null;
	limit?: number | null;
	search?: string | null;
	status?: string | null;
	role?: UserRole | null;
	removed?: boolean | null;
	id?: string | null;
}
export interface EventsInput {
	upcoming?: boolean | null;
	page?: number | null;
	limit?: number | null;
}
export interface DiscoveryInput {
	sort?: ProjectSort | null;
	excludeProjectIds?: Array<string> | null;
	creatorId?: string | null;
	categoryId?: string | null;
	city?: string | null;
	remoteAvailable?: boolean | null;
	query?: string | null;
	budgetMax?: number | null;
	page?: number | null;
	limit?: number | null;
}
export type ProjectSort = 'RECENT' | 'POPULAR';
export interface AssistantInput {
	request: string;
}
export interface PageInput {
	page?: number | null;
	limit?: number | null;
}
export interface AdminUserUpdateInput {
	displayName?: string | null;
	avatarUrl?: string | null;
	preferredLocale?: Locale | null;
	role?: UserRole | null;
}
export interface UpdateCreatorInput {
	slug?: string | null;
	headline?: string | null;
	bio?: string | null;
	city?: string | null;
	remoteAvailable?: boolean | null;
	availability?: CreatorAvailability | null;
	categoryIds?: Array<string> | null;
	skills?: Array<string> | null;
	socialLinks?: Array<SocialLinkInput> | null;
}
export interface SocialLinkInput {
	label: string;
	url: string;
}
export interface CreateProjectInput {
	title: string;
	slug: string;
	categoryId?: string | null;
	summary?: string | null;
	description?: string | null;
	coverImageUrl?: string | null;
	media?: Array<PortfolioMediaInput> | null;
	tags?: Array<string> | null;
	externalUrl?: string | null;
}
export interface PortfolioMediaInput {
	type: MediaType;
	url: string;
	altText: string;
	sortOrder: number;
}
export interface AdminProjectUpdateInput {
	title?: string | null;
	slug?: string | null;
	categoryId?: string | null;
	summary?: string | null;
	description?: string | null;
	tags?: Array<string> | null;
	externalUrl?: string | null;
	coverImageUrl?: string | null;
	media?: Array<AdminPortfolioMediaInput> | null;
}
export interface AdminPortfolioMediaInput {
	type: MediaType;
	altText: string;
	sortOrder: number;
	url: string;
}
export interface CreateServiceInput {
	title: string;
	categoryId?: string | null;
	description?: string | null;
	pricingType?: PricingType | null;
	startingPrice?: number | null;
	estimatedDays?: number | null;
	deliverables?: Array<string> | null;
}
export interface UpdateServiceInput {
	title?: string | null;
	categoryId?: string | null;
	description?: string | null;
	pricingType?: PricingType | null;
	startingPrice?: number | null;
	estimatedDays?: number | null;
	deliverables?: Array<string> | null;
}
export interface SiteContentInput {
	homeHeading: string;
	homeSubheading: string;
	aboutText: string;
	contactEmail: string;
	contactText: string;
	footerCopy: string;
}
export interface EventInput {
	title: string;
	description: string;
	startsAt: string;
	endsAt: string;
	location: string;
	eventUrl?: string | null;
	status: EventStatus;
	isDemo: boolean;
}
export interface UpdateEventInput {
	title: string;
	description: string;
	startsAt: string;
	endsAt: string;
	location: string;
	eventUrl?: string | null;
	status: EventStatus;
	isDemo: boolean;
}
export interface RegisterInput {
	phoneNumber: string;
	email: string;
	password: string;
	displayName: string;
	preferredLocale?: Locale | null;
}
export interface PhoneRegisterInput {
	phoneNumber: string;
	password: string;
	displayName: string;
	preferredLocale?: Locale | null;
}
export interface PhoneLoginInput {
	phoneNumber: string;
	password: string;
}
export interface SocialLoginInput {
	phoneNumber?: string | null;
	provider: AuthProvider;
	idToken: string;
	nonce: string;
	displayName?: string | null;
	preferredLocale?: Locale | null;
}
export interface LoginInput {
	email: string;
	password: string;
}
export interface EmailInput {
	email: string;
}
export interface ResetPasswordInput {
	token: string;
	password: string;
}
export interface LinkEmailInput {
	email: string;
	password: string;
}
export interface LinkPhoneInput {
	phoneNumber: string;
	password: string;
}
export interface ChangePasswordInput {
	authIdentityId: string;
	currentPassword: string;
	password: string;
}
export interface ChangePhonePasswordInput {
	password: string;
}
export interface CategoryInput {
	slug: string;
	name: string;
	description?: string | null;
	sortOrder?: number | null;
	isActive?: boolean | null;
}
export interface UpdateCategoryInput {
	slug?: string | null;
	name?: string | null;
	description?: string | null;
	sortOrder?: number | null;
	isActive?: boolean | null;
}
export interface CreateCreatorInput {
	slug: string;
	headline?: string | null;
	bio?: string | null;
	city?: string | null;
	remoteAvailable?: boolean | null;
	availability?: CreatorAvailability | null;
	categoryIds?: Array<string> | null;
	skills?: Array<string> | null;
	socialLinks?: Array<SocialLinkInput> | null;
}
export interface CommentInput {
	clientCommentKey: string;
	projectId: string;
	content: string;
}
export interface EditCommentInput {
	content: string;
}
export interface InquiryVersionInput {
	inquiryId: string;
	expectedVersion: number;
}
export interface SendInquiryInput {
	serviceId?: string | null;
	subject: string;
	brief: string;
	budgetMin?: number | null;
	budgetMax?: number | null;
	desiredDeadline?: string | null;
	creatorId: string;
	clientRequestKey: string;
}
export interface CreateServiceFeedbackInput {
	inquiryId: string;
	rating: number;
	feedback: string;
}
export interface CreateInquiryInput {
	serviceId?: string | null;
	subject?: string | null;
	brief?: string | null;
	budgetMin?: number | null;
	budgetMax?: number | null;
	desiredDeadline?: string | null;
	creatorId: string;
}
export interface UpdateInquiryInput {
	serviceId?: string | null;
	subject?: string | null;
	brief?: string | null;
	budgetMin?: number | null;
	budgetMax?: number | null;
	desiredDeadline?: string | null;
	inquiryId: string;
	expectedVersion: number;
	clearService?: boolean | null;
}
export interface SendMessageInput {
	inquiryId: string;
	expectedVersion: number;
	clientMessageKey: string;
	body: string;
}
export interface CloseInquiryInput {
	inquiryId: string;
	expectedVersion: number;
	outcome: InquiryOutcome;
}
export interface UpdateProjectInput {
	title?: string | null;
	slug?: string | null;
	categoryId?: string | null;
	summary?: string | null;
	description?: string | null;
	coverImageUrl?: string | null;
	media?: Array<PortfolioMediaInput> | null;
	tags?: Array<string> | null;
	externalUrl?: string | null;
}
export interface UpdateUserInput {
	displayName?: string | null;
	avatarUrl?: string | null;
	preferredLocale?: Locale | null;
}
export interface Operations {
	myContentReviews: { variables: {}; result: Array<ContentReview> };
	adminContentReviews: { variables: { status?: string }; result: Array<ContentReview> };
	adminPendingContentReviewCount: { variables: {}; result: number };
	adminOverview: { variables: {}; result: AdminOverview };
	adminDirectory: { variables: { kind: AdminKind; input?: AdminDirectoryInput }; result: AdminDirectory };
	getSiteContent: { variables: {}; result: SiteContent };
	getEvents: { variables: { input?: EventsInput }; result: Array<CreativeEvent> };
	getEvent: { variables: { id: string }; result: CreativeEvent };
	adminEvents: { variables: { input?: EventsInput }; result: Array<CreativeEvent> };
	apiName: { variables: {}; result: string };
	getMyAuthIdentities: { variables: {}; result: Array<AuthIdentity> };
	categories: { variables: {}; result: Array<Category> };
	adminCategories: { variables: {}; result: Array<Category> };
	creator: { variables: { slug: string }; result: CreatorProfile };
	myCreatorProfile: { variables: {}; result: CreatorProfile };
	getCities: { variables: {}; result: Array<City> };
	getCreators: { variables: { input?: DiscoveryInput }; result: Creators };
	getProjects: { variables: { input?: DiscoveryInput }; result: Projects };
	getServices: { variables: { input?: DiscoveryInput }; result: Services };
	discoverCreators: { variables: { input: AssistantInput }; result: DiscoveryResult };
	getMyProjectLike: { variables: { projectId: string }; result: boolean };
	getProjectLikeCount: { variables: { projectId: string }; result: number };
	getMyFollows: { variables: { input?: PageInput }; result: Followings };
	getMyFollowers: { variables: { input?: PageInput }; result: Followers };
	getSavedProjects: { variables: { input?: PageInput }; result: SavedProjects };
	getProjectComments: { variables: { projectId: string; input?: PageInput }; result: Comments };
	getUnreadInquiryCount: { variables: {}; result: number };
	getInquiry: { variables: { inquiryId: string }; result: Inquiry };
	getInquiries: {
		variables: { creatorInbox?: boolean; allConversations?: boolean; input?: PageInput };
		result: Inquiries;
	};
	getInquiryMessages: { variables: { inquiryId: string; input?: PageInput }; result: InquiryMessages };
	getInquiryEvents: { variables: { inquiryId: string; input?: PageInput }; result: InquiryEvents };
	getInquiryFeedback: { variables: { inquiryId: string }; result: ServiceFeedback | null };
	getCreatorFeedback: { variables: { creatorId: string; input?: PageInput }; result: ServiceFeedbacks };
	getNotifications: { variables: { input?: PageInput; unreadOnly?: boolean }; result: Notifications };
	getUnreadNotificationCount: { variables: {}; result: number };
	getProject: { variables: { projectId: string }; result: PortfolioProject };
	getMyProjects: { variables: { input?: PageInput }; result: Projects };
	getService: { variables: { serviceId: string }; result: CreatorService };
	getMyServices: { variables: { input?: PageInput }; result: Services };
	me: { variables: {}; result: User };
	adminDecideContentReview: {
		variables: { id: string; approve: boolean; revision: string; reason?: string | null };
		result: ContentReview;
	};
	adminUpdateUser: { variables: { id: string; input: AdminUserUpdateInput }; result: User };
	adminSetUserStatus: { variables: { id: string; status: UserStatus }; result: User };
	adminUpdateCreator: {
		variables: { id: string; input: UpdateCreatorInput; status?: ProfileStatus | null };
		result: CreatorProfile;
	};
	adminCreateProject: { variables: { creatorId: string; input: CreateProjectInput }; result: PortfolioProject };
	adminUpdateProject: {
		variables: { id: string; input: AdminProjectUpdateInput; status?: ProjectStatus | null };
		result: PortfolioProject;
	};
	adminCreateService: { variables: { creatorId: string; input: CreateServiceInput }; result: CreatorService };
	adminUpdateService: {
		variables: { id: string; input: UpdateServiceInput; status?: ServiceStatus | null };
		result: CreatorService;
	};
	adminSetRemoved: { variables: { kind: AdminKind; id: string; removed: boolean }; result: boolean };
	adminUpdateSiteContent: { variables: { input: SiteContentInput }; result: SiteContent };
	imageUploader: { variables: { file: File; target?: string }; result: string };
	imagesUploader: { variables: { files: Array<File>; target?: string }; result: Array<string> };
	createEvent: { variables: { input: EventInput }; result: CreativeEvent };
	updateEvent: { variables: { id: string; input: UpdateEventInput }; result: CreativeEvent };
	register: { variables: { input: RegisterInput }; result: AuthPayload };
	registerPhone: { variables: { input: PhoneRegisterInput }; result: AuthPayload };
	loginPhone: { variables: { input: PhoneLoginInput }; result: AuthPayload };
	beginSocialLogin: { variables: { provider: AuthProvider }; result: string };
	loginSocial: { variables: { input: SocialLoginInput }; result: AuthPayload };
	login: { variables: { input: LoginInput }; result: AuthPayload };
	refreshSession: { variables: { refreshToken: string }; result: AuthPayload };
	verifyEmail: { variables: { token: string }; result: boolean };
	requestEmailVerification: { variables: { input: EmailInput }; result: boolean };
	requestPasswordReset: { variables: { input: EmailInput }; result: boolean };
	resetPassword: { variables: { input: ResetPasswordInput }; result: boolean };
	linkEmail: { variables: { input: LinkEmailInput }; result: AuthIdentity };
	linkPhone: { variables: { input: LinkPhoneInput }; result: AuthIdentity };
	beginSocialLink: { variables: { provider: AuthProvider }; result: string };
	linkSocial: { variables: { input: SocialLoginInput }; result: AuthIdentity };
	unlinkAuthIdentity: { variables: { authIdentityId: string }; result: boolean };
	changePassword: { variables: { input: ChangePasswordInput }; result: boolean };
	changePhonePassword: { variables: { input: ChangePhonePasswordInput }; result: boolean };
	logout: { variables: {}; result: boolean };
	createCategory: { variables: { input: CategoryInput }; result: Category };
	updateCategory: { variables: { id: string; input: UpdateCategoryInput }; result: Category };
	createCreatorProfile: { variables: { input: CreateCreatorInput }; result: CreatorProfile };
	updateCreatorProfile: { variables: { input: UpdateCreatorInput }; result: CreatorProfile };
	setCreatorProfileStatus: { variables: { status: ProfileStatus }; result: CreatorProfile };
	deleteCreatorProfile: { variables: {}; result: boolean };
	setProjectLike: { variables: { projectId: string; liked: boolean }; result: boolean };
	setCreatorFollow: { variables: { creatorId: string; following: boolean }; result: boolean };
	setProjectSaved: { variables: { projectId: string; saved: boolean }; result: boolean };
	createProjectComment: { variables: { input: CommentInput }; result: ProjectComment };
	editProjectComment: { variables: { commentId: string; input: EditCommentInput }; result: ProjectComment };
	deleteProjectComment: { variables: { commentId: string }; result: boolean };
	moderateProjectComment: { variables: { commentId: string; hidden: boolean }; result: ProjectComment };
	markInquiryRead: { variables: { input: InquiryVersionInput }; result: boolean };
	sendInquiry: { variables: { input: SendInquiryInput }; result: Inquiry };
	completeInquiry: { variables: { input: InquiryVersionInput }; result: Inquiry };
	createServiceFeedback: { variables: { input: CreateServiceFeedbackInput }; result: ServiceFeedback };
	createInquiry: { variables: { input: CreateInquiryInput }; result: Inquiry };
	updateInquiry: { variables: { input: UpdateInquiryInput }; result: Inquiry };
	deleteInquiryDraft: { variables: { input: InquiryVersionInput }; result: boolean };
	submitInquiry: { variables: { input: InquiryVersionInput }; result: Inquiry };
	sendInquiryMessage: { variables: { input: SendMessageInput }; result: InquiryMessage };
	markInquiryMessageRead: { variables: { messageId: string }; result: boolean };
	declineInquiry: { variables: { input: InquiryVersionInput }; result: Inquiry };
	cancelInquiry: { variables: { input: InquiryVersionInput }; result: Inquiry };
	closeInquiry: { variables: { input: CloseInquiryInput }; result: Inquiry };
	markNotificationRead: { variables: { notificationId: string }; result: boolean };
	createProject: { variables: { input: CreateProjectInput }; result: PortfolioProject };
	updateProject: { variables: { projectId: string; input: UpdateProjectInput }; result: PortfolioProject };
	setProjectStatus: { variables: { projectId: string; status: ProjectStatus }; result: PortfolioProject };
	deleteProject: { variables: { projectId: string }; result: boolean };
	createService: { variables: { input: CreateServiceInput }; result: CreatorService };
	updateService: { variables: { serviceId: string; input: UpdateServiceInput }; result: CreatorService };
	setServiceStatus: { variables: { serviceId: string; status: ServiceStatus }; result: CreatorService };
	deleteService: { variables: { serviceId: string }; result: boolean };
	updateMe: { variables: { input: UpdateUserInput }; result: User };
	deleteMyAccount: { variables: {}; result: boolean };
	setAccountSuspended: { variables: { userId: string; suspended: boolean }; result: User };
}
