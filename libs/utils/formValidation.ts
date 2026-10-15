// Inline form validation (fix list 5). Forms use noValidate, so the browser never shows its own
// "Please fill out this field" popup; the same built-in constraints (required, type, pattern,
// length, range) are checked here and turned into plain messages shown under each field.

export type ValidationMessage = { key: string; values?: Record<string, number | string> };
export type ValidationErrors = Record<string, ValidationMessage>;
type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

// Field-specific wording for the most common required fields.
const requiredByName: Record<string, string> = {
	name: 'Please enter your name.',
	displayName: 'Please enter your name.',
	email: 'Please enter your email address.',
	newEmail: 'Please enter your email address.',
	message: 'Please enter your message.',
	body: 'Please enter your message.',
	content: 'Please write a comment.',
	title: 'Please enter a title.',
	description: 'Please enter a description.',
	subject: 'Please enter a subject.',
	brief: 'Please describe your project.',
	feedback: 'Please write your feedback.',
	location: 'Please enter a location.',
	slug: 'Please enter a web address name.',
	currentPassword: 'Please enter your current password.',
	password: 'Please enter a password.',
	newPassword: 'Please enter a new password.',
	confirmPassword: 'Please confirm your password.',
};

function isControl(element: Element): element is Control {
	return (
		element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement
	);
}

export function controlError(control: Control): ValidationMessage | undefined {
	if (control.disabled || !control.name || control.type === 'hidden' || control.type === 'submit') return;
	const validity = control.validity;
	const value = control.value;
	const custom = control.dataset.errorMessage;
	if (validity.valueMissing || (control.required && control.type !== 'checkbox' && !value.trim())) {
		if (custom) return { key: custom };
		if (control instanceof HTMLSelectElement) return { key: 'Please choose an option.' };
		if (control.type === 'checkbox') return { key: 'Please check this box to continue.' };
		if (control.type === 'file') return { key: 'Please choose a file.' };
		return { key: requiredByName[control.name] || 'Please fill in this field.' };
	}
	if (!value) return;
	if (validity.typeMismatch && control.type === 'email') return { key: 'Please enter a valid email address.' };
	if (validity.typeMismatch && control.type === 'url')
		return { key: 'Please enter a valid web address that starts with https://.' };
	if (validity.badInput) return { key: 'Please enter a valid value.' };
	if (validity.patternMismatch) {
		if (control.dataset.patternError) return { key: control.dataset.patternError };
		if (control.type === 'url' || /^https/.test(control.getAttribute('pattern') || ''))
			return { key: 'Please enter a valid web address that starts with https://.' };
		return { key: 'Please check the format of this entry.' };
	}
	// tooShort/tooLong are only reported for typed values, so check the lengths directly too.
	if ('minLength' in control && control.minLength > 0 && value.length < control.minLength)
		return { key: 'Please enter at least {{count}} characters.', values: { count: control.minLength } };
	if ('maxLength' in control && control.maxLength > 0 && value.length > control.maxLength)
		return { key: 'Please use no more than {{count}} characters.', values: { count: control.maxLength } };
	if (validity.rangeUnderflow && control instanceof HTMLInputElement)
		return { key: 'Please enter {{min}} or more.', values: { min: control.min } };
	if (validity.rangeOverflow && control instanceof HTMLInputElement)
		return { key: 'Please enter {{max}} or less.', values: { max: control.max } };
	if (validity.customError) return { key: control.validationMessage };
	if (!validity.valid) return { key: 'Please check this field.' };
}

export function validateForm(form: HTMLFormElement): { errors: ValidationErrors; first?: Control } {
	const errors: ValidationErrors = {};
	let first: Control | undefined;
	for (const element of Array.from(form.elements)) {
		if (!isControl(element) || errors[element.name]) continue;
		const error = controlError(element);
		if (!error) continue;
		errors[element.name] = error;
		first ??= element;
	}
	return { errors, first };
}

export function controlFromEvent(target: EventTarget | null): Control | undefined {
	return target instanceof Element && isControl(target) ? target : undefined;
}
