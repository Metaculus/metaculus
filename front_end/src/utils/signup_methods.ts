/**
 * How an account came into existence, sent as the `method` property on the
 * `register` analytics event so registrations can be split by route.
 *
 * Social signups report the provider name itself rather than a constant here,
 * so a newly enabled provider is labelled correctly without another edit.
 */
export const SIGNUP_METHOD_EMAIL_LINK = "email_link";
export const SIGNUP_METHOD_PASSWORD = "password";
