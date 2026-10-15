export type AuthFieldErrors = Record<string, string>;

export function authSubmissionErrorField(message: string, mode: string, resending = false): string {
	if (mode === 'forgot-password' || resending) return 'email';
	if (mode === 'verify-email' || (mode === 'reset-password' && /token/i.test(message))) return 'token';
	if (/phone/i.test(message)) return 'phoneNumber';
	if (/displayName|display name/i.test(message)) return 'displayName';
	if (/email|login method already belongs/i.test(message)) return 'email';
	if (mode === 'register' && /passwords do not match/i.test(message)) return 'confirmPassword';
	return 'password';
}

// Same wording as the shared inline validation (libs/utils/formValidation.ts).
const requiredMessages: Record<string, string> = {
	displayName: 'Please enter your name.',
	email: 'Please enter your email address.',
	phoneNumber: 'Please enter your contact phone number.',
	password: 'Please enter a password.',
	confirmPassword: 'Please confirm your password.',
	token: 'Please enter the verification code.',
};

export function validateAuthForm(form: HTMLFormElement, confirmPassword = false): AuthFieldErrors {
	const errors: AuthFieldErrors = {};
	for (const input of Array.from(form.elements)) {
		if (!(input instanceof HTMLInputElement) || !input.name || input.disabled) continue;
		if (input.validity.valueMissing) errors[input.name] = requiredMessages[input.name] || 'Please fill in this field.';
		else if (input.validity.typeMismatch && input.type === 'email')
			errors[input.name] = 'Please enter a valid email address.';
		else if (input.validity.patternMismatch)
			errors[input.name] = 'Use 6–30 characters with a letter, a number, and a symbol. Example: River7!Cloud.';
		else if (
			input.validity.tooShort ||
			input.validity.tooLong ||
			(input.minLength > 0 && input.value.length < input.minLength) ||
			(input.maxLength >= 0 && input.value.length > input.maxLength)
		)
			errors[input.name] = 'Please check the length of this entry.';
	}
	if (confirmPassword) {
		const fields = new FormData(form);
		if (fields.get('password') !== fields.get('confirmPassword'))
			errors.confirmPassword = 'Passwords do not match. Please try again.';
	}
	return errors;
}
