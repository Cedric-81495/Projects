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

VAs deliberately cannot archive records, export the audience list, manage users,
or read the audit log — the four actions that are irreversible or expose
everything at once.

## Auth

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/sign-in` | Sets the refresh cookie; returns `{ user, accessToken }` |
| POST | `/auth/refresh` | Rotates the refresh token |
| POST | `/auth/sign-out` | Revokes the current session |
| GET | `/auth/me` | Current user |
| POST | `/auth/password/change` | Signs out all other sessions |

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
