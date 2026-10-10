# Password requirements and footer

New passwords require 6–30 characters, at least one Unicode letter, one digit from 0–9 and one non-whitespace symbol. Punctuation and emoji count as symbols; spaces do not. The frontend uses native input validation and the backend enforces the same composition through DTO validation, including inherited linked-method inputs.

Applies to sign-up by email or phone, adding a password sign-in method, resetting a password and changing a password. Existing sign-in passwords and current-password entries are not subjected to the new rule. Existing credentials were not changed. The localized example appears beneath the input and is linked with aria-describedby; confirmation fields do not repeat it.

The footer's Find us section now places Instagram, LinkedIn, YouTube and Telegram beneath the location. Icons have accessible platform names. The owner will provide real social links later.

Validation: backend format, typecheck, lint and build passed; all 92 backend tests and 29 frontend tests passed; frontend production build includes lint/type checks. Browser checks at 1440px and 390px covered missing character classes, accepted Unicode letters, example visibility, current-password/sign-in compatibility and four icons below the location. Account settings used browser-only fixtures. No account or password was written for browser QA.
