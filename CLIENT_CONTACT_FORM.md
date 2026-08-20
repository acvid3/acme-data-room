# CLIENT_AGENT: Contact form submission endpoint

New API endpoint for the contact form on the `/contact` page. The backend now supports
sending messages from a contact form to the project inbox (`acvid3@gmail.com`).

## Endpoint

`POST /api/contact` — public, no auth required. Rate-limited (100 req / 60 s per IP),
returns `429` if exceeded.

### Request body (JSON)

| Field     | Type   | Required | Constraints          |
| --------- | ------ | -------- | -------------------- |
| `name`    | string | yes      | non-empty, ≤ 100     |
| `email`   | string | yes      | valid email, ≤ 254   |
| `message` | string | yes      | non-empty, ≤ 2000    |

### Response

`201` — message accepted:

```json
{ "sent": true }
```

- `sent: true` — the email was delivered via Gmail.
- `sent: false` — email is not configured (e.g. local dev) or delivery failed; treat as
  "message accepted", do not show an error.

### Errors

| Status | Meaning                                        |
| ------ | ---------------------------------------------- |
| `400`  | validation failed (message lists field errors) |
| `429`  | rate limit exceeded                            |

## What the client needs to do

- Add a contact form to the `/contact` page: fields `name`, `email`, `message`
  (textarea), submit button, validation mirroring the constraints above.
- POST to `/api/contact` via the existing API client (`credentials: 'include'` not
  required, but harmless).
- On success: show a confirmation ("we'll get back to you within one business day").
  Don't distinguish `sent: true` / `sent: false` in the success UI.
- On `400`: show the field errors. On `429`: show a rate-limit message.
- On network error: generic error message.

## Files touched on the server (for reference)

- `server/routes/contact.routes.ts` — the new route
- `server/dto/contact.dto.ts` — validation DTO
- `server/app.module.ts` — route registered + rate limit applied
