import { useTranslation as useSiteTranslation } from 'next-i18next';
import { createContext, FormEvent, useCallback, useContext, useMemo, useState } from 'react';
import { controlError, controlFromEvent, validateForm, ValidationErrors } from '../utils/formValidation';

// Field, TextArea and Password read their error from this context by field name, so a form only
// wraps its fields once instead of passing an error to every control.
const FieldErrorsContext = createContext<Record<string, string>>({});
// Usage: <FieldErrors value={validation.errors}>…fields…</FieldErrors>
export const FieldErrors = FieldErrorsContext.Provider;

export function useFieldErrorFor(name?: string) {
	const errors = useContext(FieldErrorsContext);
	return name ? errors[name] : undefined;
}

export function useFormValidation() {
	const { t: translate } = useSiteTranslation('common');
	const [raw, setRaw] = useState<ValidationErrors>({});
	const errors = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(raw).map(([name, message]) => [name, translate(message.key, message.values) as string]),
			),
		[raw, translate],
	);

	// Show every problem at once and move focus to the first one. Returns true when the form is valid.
	const validate = useCallback((form: HTMLFormElement) => {
		const result = validateForm(form);
		setRaw(result.errors);
		result.first?.focus();
		return !result.first;
	}, []);

	// Errors disappear as soon as the field is corrected; other fields keep theirs.
	const recheck = useCallback((event: FormEvent<HTMLFormElement>) => {
		const control = controlFromEvent(event.target);
		if (!control?.name) return;
		setRaw((current) => {
			if (!current[control.name]) return current;
			const next = { ...current };
			const error = controlError(control);
			if (error) next[control.name] = error;
			else delete next[control.name];
			return next;
		});
	}, []);

	return {
		errors,
		validate,
		clear: () => setRaw({}),
		form: { noValidate: true, onInput: recheck, onChange: recheck },
	};
}
