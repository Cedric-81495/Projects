# API reference

Base path: `/api/v1`

All responses use the envelope in the README. Timestamps are ISO 8601.
Documents expose `id`, never `_id`.

## Permissions

| Action | Permission | Super Admin | Admin (VA) |
| --- | --- | :-: | :-: |
| Read content, including drafts | `content:read` | ✓ | ✓ |
| Create and edit content | `content:write` | ✓ | ✓ |
| Publish and unpublish | `content:publish` | ✓ | ✓ |
| Archive content | `content:delete` | ✓ | — |
| Moderate community submissions | `community:moderate` | ✓ | ✓ |
| Read subscribers | `subscribers:read` | ✓ | ✓ |
| Export subscribers | `subscribers:export` | ✓ | — |
| Manage users and roles | `users:manage` | ✓ | — |
| Read the audit log | `audit:read` | ✓ | — |
| Site settings, navigation, SEO, homepage order | `settings:manage` | ✓ | — |

VAs deliberately cannot archive records, export the audience list, manage users,
or read the audit log — the four actions that are irreversible or expose
everything at once.

## Auth

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/sign-in` | Sets the refresh cookie; returns `{ user, accessToken, mfaRequired: false }` |
| POST | `/auth/refresh` | Rotates the refresh token |
| POST | `/auth/sign-out` | Revokes the current session |
| GET | `/auth/me` | Current user |
| POST | `/auth/password/change` | Signs out all other sessions |

When the account has two-step verification on, `/auth/sign-in` returns
`{ mfaRequired: true, mfaToken }` instead — **no cookie and no access token**.
The ticket is valid for five minutes, carries its own JWT audience, and is
accepted only by `/auth/mfa/challenge`.

### Password reset and email confirmation

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/password/forgot` | public | Always 200. Never reveals whether the address exists |
| POST | `/auth/password/reset` | public | Revokes every session; link lives 60 minutes |
| POST | `/auth/email/verify/request` | signed in | Link lives 24 hours |
| POST | `/auth/email/verify` | public | The recipient is not signed in when they click |

Tokens are emailed in the clear and stored only as SHA-256 hashes, so a database
leak yields nothing usable. Accounts with no password (Google-only) are skipped
by `forgot` — sending them a reset link would create a credential the owner
never asked for.

Without `RESEND_API_KEY` set, the mailer writes each message to the log at warn
level, link included, rather than sending it.

### Two-step verification (TOTP)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/mfa/challenge` | ticket | `{ mfaToken, code }` → full session |
| GET | `/auth/mfa` | signed in | Enabled, enrolled date, recovery codes left |
| POST | `/auth/mfa/setup` | signed in | Returns `secret`, `otpauthUri` for the QR |
| POST | `/auth/mfa/enable` | signed in | Confirms a code; returns recovery codes **once** |
| POST | `/auth/mfa/disable` | signed in | Requires password **and** a current code |
| POST | `/auth/mfa/recovery-codes` | signed in | Regenerates; invalidates the previous set |

`code` accepts either a six-digit TOTP code or a recovery code — the server
tells them apart by shape. Recovery codes are single-use and stored hashed, so
there is no endpoint that can show them again. RFC 6238, SHA-1, 6 digits, 30s
step, ±1 step of accepted drift (verified against the RFC test vectors).

The ticket is **single-use** and only the newest one is live: its id is hashed
onto the user record and cleared when spent, so a captured ticket cannot be
replayed inside its window. The challenge step also has its own account lockout
— 5 wrong codes locks for 15 minutes. The IP-keyed limiter alone would not stop
someone who already has the password, which is the case MFA exists for.

Set `REQUIRE_SUPER_ADMIN_MFA=true` to refuse sign-in for super administrators
who have not enrolled. Leave it false until they all have.

### Google sign-in

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/auth/google` | Redirects to Google (CMS flow) |
| GET | `/auth/google/callback` | Redirects back to the CMS |
| GET | `/members/auth/google` | Redirects to Google (member flow) |

Authorization-code flow with PKCE. State and verifier travel in a short-lived
httpOnly cookie, so the flow survives an instance restart mid-sign-in. The
access token comes back in the URL **fragment**, which is never sent to a server
and so stays out of access logs and referrer headers.

**One callback serves both flows.** Google matches redirect URIs against an
exact allowlist, so the deployment registers only `GOOGLE_CALLBACK_URL`. Which
side handles the return is decided by the `flow` field in the signed state
cookie — set before the browser leaves, so it cannot be steered from the query
string. Members land on `OAUTH_MEMBER_REDIRECT`, staff on
`OAUTH_SUCCESS_REDIRECT`.

Two different policies, deliberately:

* **CMS** — never creates an account. Matches an existing user by verified email
  and refuses otherwise. Self-registration into a system that grants publishing
  and moderation rights is not something a Google account should buy.
* **Members** — creates an account for a new address. Membership is open, and
  members hold no permissions.

An unverified Google email is refused in both flows: accounts are matched by
address, so accepting one would be an account-takeover path.

MFA is not bypassable through Google. A staff account with MFA on is redirected
back with `error=mfa_required` (this endpoint cannot collect a code), and
`REQUIRE_SUPER_ADMIN_MFA` is enforced here too — `error=mfa_enrolment_required`
— through the same check the password path uses.

## Content

Every content type below has the same routes. Replace `{base}`:

`/collections` · `/apparel` · `/looks` · `/docuseries/episodes` ·
`/podcast/episodes` · `/podcast/clips` · `/kmm/artists` · `/kmm/releases` ·
`/gwop/programmes` · `/gwop/events`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `{base}` | public | Published only. `?page&pageSize&search&featured` |
| GET | `{base}/:idOrSlug` | public | Published only |
| GET | `{base}/admin/all` | `content:read` | Includes drafts. `?status` |
| GET | `{base}/admin/:idOrSlug` | `content:read` | Any status |
| POST | `{base}` | write | Always created as a draft |
| PATCH | `{base}/:id` | write | |
| POST | `{base}/:id/publish` | `content:publish` | Triggers the site rebuild |
| POST | `{base}/:id/unpublish` | `content:publish` | |
| DELETE | `{base}/:id` | `content:delete` | Archives, does not destroy |

Kitchen Muzik routes use `kmm:manage` and GWOP routes use `gwop:manage` for
writes, so those modules can be delegated independently.

## Engagement

Replaces the cart in showcase mode. Anonymous, deduplicated per visitor.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/apparel/:id/:action` | `like` `favorite` `vote` `notify` `share` `view` |
| POST | `/apparel/:id/:action/undo` | Not valid for `share` or `view` |
| GET | `/apparel/mine` | This visitor's registered actions |
| GET | `/apparel/vote-totals` | Public. Per-collection totals and percentages |
| GET | `/apparel/report` | `analytics:read`. Per-item breakdown |

Repeating an action returns `{ counted: false, alreadyRegistered: true }` rather
than an error — the visitor's intent is already recorded, so it is a success.

## Site chrome and structure

Base `/site`. Copy is `content:write` / `content:publish`; structure is
`settings:manage`.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/site/bootstrap` | public | Settings, navigation, live announcement, homepage sections in one call |
| GET | `/site/settings` | public | Public subset: drops `updatedBy`, `phone`, `mailingAddress` |
| GET | `/site/settings/admin` | `content:read` | Full document |
| PATCH | `/site/settings` | `settings:manage` | |
| GET | `/site/founder` | public | |
| PATCH | `/site/founder` | `content:write` | |
| GET | `/site/announcements/active` | public | The one live now, or `null` |
| GET | `/site/homepage` | public | Enabled sections, in order |
| GET | `/site/homepage/admin` | `content:read` | Includes disabled |
| POST | `/site/homepage` | `settings:manage` | 409 if that section key exists |
| PATCH | `/site/homepage/reorder` | `settings:manage` | `{ order: [{id, displayOrder}] }` |
| PATCH | `/site/homepage/:id` | `content:write` | `key` cannot be changed |
| GET | `/site/hero-banners/placement/:placement` | public | Published, ordered |
| GET | `/site/navigation` | public | All menus, keyed by location |
| GET | `/site/navigation/:location` | public | Hidden items stripped, sorted |
| PUT | `/site/navigation/:location` | `settings:manage` | Replaces the menu wholesale |
| GET | `/site/seo?path=/collections` | public | Resolved: route override → site defaults → brand |
| GET | `/site/seo/admin/all` | `content:read` | |
| PUT | `/site/seo` | `settings:manage` | Upsert by path |

`/site/announcements`, `/site/hero-banners`, and `/site/pages` also carry the
full standard content surface documented above.

Announcements are time-bounded rather than a boolean, so a VA scheduling one for
Friday does not have to remember to switch it off. Pages store typed blocks, not
HTML — CMS-authored HTML rendered on the site is stored XSS. Navigation links
must be a relative path or an `http(s)` URL; `javascript:` and `data:` are
rejected at the schema. Pages flagged `isSystemPage` (privacy, terms, cookies)
refuse to archive.

## Media engagement

Base `/media-engagement`. Anonymous, same visitor cookie as apparel.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/media-engagement/:targetType/:id/:action` | public | Body `{ percent? }` |
| GET | `/media-engagement/report` | `analytics:read` | `?targetType&days&limit` |
| GET | `/media-engagement/trend` | `analytics:read` | `?targetType&action&days`, gap-filled |
| POST | `/media-engagement/recount` | `settings:manage` | Rebuilds counters from the log |

`targetType`: `music-release` · `docuseries-episode` · `podcast-episode` ·
`podcast-clip`. `action`: `view` `play` `complete` `download` `share`, subject to
what each type actually supports — a clip has no `complete`, an episode has no
`download`.

`/trend` returns `days` buckets ending **today**, gap-filled with zeros so a
chart cannot silently draw a straight line across a quiet week.

`/recount` zeroes every counter on every record of every tracked type before
applying the aggregation, so a counter whose rows were purged is corrected
rather than left stale.

Deduplicated **per visitor per UTC day**, not once ever. Apparel engagement is a
vote and must be once-only; a play is consumption, and someone listening three
weeks running is three real listens. Repeats inside a day return
`{ counted: false, alreadyRegisteredToday: true }` at 200 and raise the row's
`occurrences` without moving the headline counter.

Unpublished targets 404, so the endpoint cannot be used to probe for unannounced
episodes.

## Community

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/community/stories` | public | Submission. Always pending |
| GET | `/community/stories` | public | Approved, published, consented only |
| POST | `/community/volunteer` | public | |
| POST | `/community/mentorship-applications` | public | |
| POST | `/community/guest-nominations` | public | |
| GET | `/community/stories/admin/all` | `community:moderate` | `?state` |
| POST | `/community/stories/:id/moderate` | `community:moderate` | See below |

Moderation refuses to publish a story whose author did not grant
`consent.publishStory`, and public responses replace the name with "Anonymous"
unless `consent.publishName` was granted.

## Subscribers

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/subscribers` | public |
| GET | `/subscribers/unsubscribe/:token` | public |
| GET | `/subscribers` | `subscribers:read` |
| GET | `/subscribers/export` | `subscribers:export` — audited |

Subscribing with an existing address updates consent and returns the same
response as a new signup. Whether an address is already on the list is not
something an anonymous caller should be able to learn.

## Users and analytics

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/users` | `users:manage` |
| POST | `/users` | `users:manage` |
| PATCH | `/users/:id/role` | `users:manage` |
| PATCH | `/users/:id/status` | `users:manage` |
| GET | `/users/audit-log` | `audit:read` |
| GET | `/analytics/dashboard` | `analytics:read` |

Role and status changes bump `tokenVersion`, invalidating that user's existing
access tokens immediately. The last active Super Administrator cannot be demoted
or deactivated, and nobody can change their own role.
