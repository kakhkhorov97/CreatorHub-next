import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { documents } from '../hooks/useApi';
import { AuthIdentity, AuthPayload, AuthProvider } from '../types/creatorhub';
// Provider authorization adapters must bind nonce, browser state and redirect URI.
// No provider is enabled until its adapter and backend audience are configured.

export interface SocialAdapter {
	authorize(nonce: string): Promise<{ idToken: string; displayName?: string }>;
}

export async function socialSignIn(
	client: ApolloClient<NormalizedCacheObject>,
	provider: AuthProvider,
	adapter: SocialAdapter,
): Promise<AuthPayload> {
	const challenge = await client.mutate({ mutation: documents.beginSocialLogin, variables: { provider } });
	const nonce: string = challenge.data.beginSocialLogin;
	const proof = await adapter.authorize(nonce);
	const result = await client.mutate({
		mutation: documents.loginSocial,
		variables: { input: { provider, nonce, ...proof } },
	});
	return result.data.loginSocial;
}

export async function socialLink(
	client: ApolloClient<NormalizedCacheObject>,
	provider: AuthProvider,
	adapter: SocialAdapter,
): Promise<AuthIdentity> {
	const challenge = await client.mutate({ mutation: documents.beginSocialLink, variables: { provider } });
	const nonce: string = challenge.data.beginSocialLink;
	const proof = await adapter.authorize(nonce);
	const result = await client.mutate({
		mutation: documents.linkSocial,
		variables: { input: { provider, nonce, ...proof } },
	});
	return result.data.linkSocial;
}
