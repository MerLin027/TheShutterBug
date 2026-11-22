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
 * Events: login.succeeded, login.failed, login.paused, session.rejected,
 * credentials.changed, credentials.failed, logout, logout.everywhere,
 * cross_site.blocked.
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
