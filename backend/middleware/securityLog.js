import { clientIp } from './rateLimit.js';

/**
 * One line per security event, in the Render log (2026-11-22 audit; OWASP
 * A09 Logging & Alerting Failures). JSON so it can be searched: filter the
 * Render log for `"security"`.
 *
 * Fields: time, event, the visitor's address, and an outcome/reason. Never
 * a password, code, token or the email someone typed (a password typed
 * into the email box would land in the log).
 *
 * Events: login.succeeded, login.failed, login.paused, login.code_required,
 * login.code_failed, token.rejected, credentials.changed,
 * credentials.failed, 2fa.setup_started, 2fa.enabled, 2fa.disabled,
 * 2fa.failed, 2fa.recovery_code_used.
 */
export function securityEvent(req, event, details = {}) {
  console.warn(
    JSON.stringify({
      security: true,
      time: new Date().toISOString(),
      event,
      ip: clientIp(req),
      ...details,
    })
  );
}
