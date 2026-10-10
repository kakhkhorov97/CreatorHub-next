// Public, approved website guidance. Keep this in sync with the linked pages.
// The retriever selects only relevant entries for each Gemini request.
module.exports = [
	{
		id: 'overview',
		title: 'What CreatorHub does',
		path: '/about',
		terms:
			'creatorhub about platform creative collaborator portfolio projects services Korea 한국 크리에이터 소개 ijodkor',
		text: 'CreatorHub helps people in South Korea discover independent creators, view their published portfolio projects and services, and start private project inquiries. Illustrative profiles, concept projects and event concepts are fictional.',
	},
	{
		id: 'discovery',
		title: 'Finding a creator',
		path: '/creators',
		terms:
			'find search discover creator designer photographer category city remote budget 가격 도시 검색 디자이너 qidirish',
		text: 'Browse Projects, Creators, and Services. Public search supports keywords, creative category, Korean city, remote availability, and service budget in KRW. A custom-quote service has no known fixed price.',
	},
	{
		id: 'inquiries',
		title: 'Contacting a creator',
		path: '/faq',
		terms: 'contact creator send inquiry brief message inbox conversation chat 연락 문의 메시지 xabar',
		text: 'Open a creator profile or service, choose Send inquiry, write a project brief, and send it to the creator. A signed-in client and creator can discuss that inquiry privately in the inbox. The original inquiry brief appears directly in the conversation. Inquiry alerts appear only in Inbox, not Notifications. The assistant cannot send an inquiry or access a private conversation.',
	},
	{
		id: 'publishing',
		title: 'Publishing a creator profile, project, or service',
		path: '/faq',
		terms:
			'publish create profile portfolio project service workspace review approve moderation upload 게시 등록 승인 프로필 loyiha',
		text: 'A signed-in creator builds a profile in the workspace with a headline, city, and category. Projects need a category, description, cover image, and media. Services need a category, description, and deliverables. Publication and edits to approved content require administrator review; the prior approved version stays public while an edit is pending.',
	},
	{
		id: 'uploads',
		title: 'Adding project media',
		path: '/faq',
		terms: 'upload image video media cover files photo asset file size 이미지 업로드 파일 rasm',
		text: 'In the project editor, use Upload cover image or Upload project files. Image and video files must be 10 MB or smaller. An administrator cannot upload media on a creator’s behalf through the public creator editor.',
	},
	{
		id: 'accounts',
		title: 'Accounts and password recovery',
		path: '/faq',
		terms: 'sign in register account email verify password reset phone login 계정 가입 비밀번호 로그인 hisob',
		text: 'Signup requires a name, email, password confirmation and contact phone number. Email verification is required before protected actions. Sign in with email and password only. Phone numbers are unverified private contact information and cannot be used for login or password recovery. Social sign-in is not enabled yet. New passwords require 6–30 characters containing a letter, a number and a symbol. Existing email passwords remain usable. Email accounts can request a reset link from the sign-in page. Signed-in members can change their verified email password in Account settings using the current password, a different new password and confirmation. A successful change revokes all account sessions and existing reset links. Social account passwords are managed by the provider. Existing phone-only accounts need a verified linked email before they can sign in again.',
	},
	{
		id: 'engagement',
		title: 'Saving and following work',
		path: '/saved',
		terms: 'save like follow comment project creator heart bookmark 좋아요 저장 팔로우 saqlash',
		text: 'Signed-in members can like or save published projects, follow published creators, and comment on public projects. Saved projects and followed creators are available from the account navigation.',
	},
	{
		id: 'events',
		title: 'Creative events',
		path: '/events',
		terms: 'event gathering meetup creative calendar date 행사 이벤트 tadbir',
		text: 'The Events page lists published creative events. Fictional event concepts are clearly labeled. CreatorHub does not provide event registration, ticketing, or payment.',
	},
	{
		id: 'contact',
		title: 'Contacting the CreatorHub team',
		path: '/contact',
		terms: 'contact support team about help email address 문의 연락 지원 yordam',
		text: 'The Contact page explains how to reach a creator or find website help. A public team email appears there only when the site administrator has set one. The team address is Gwangju, South Korea.',
	},
	{
		id: 'reviews',
		title: 'Service feedback',
		path: '/faq',
		terms: 'review rating feedback complete service inquiry opinion 후기 평점 리뷰 fikr',
		text: 'After an agreed inquiry is closed and completed, its original client can submit one rating and written review for that engagement. The assistant cannot create or change feedback.',
	},
	{
		id: 'limits',
		title: 'What CreatorHub does not do',
		path: '/faq',
		terms: 'payment booking ticket fee transaction purchase contract guarantee limitation 가격 결제 예약 수수료 tolov',
		text: 'CreatorHub does not process payments, bookings, or event tickets. An inquiry starts a conversation; it does not automatically create a paid contract. ',
	},
];
