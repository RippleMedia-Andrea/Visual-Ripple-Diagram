# Purpose Lab course access and book alignment

## Release status

These changes are prepared for review, not published. The Systeme.io course has not been built yet. Automatic grants stay inactive until the owner selects a qualifying course or offer price plan. Existing user access and the advertised $47 price remain unchanged. There is no checkout or payment gateway in the current app, so this release records course entitlements without introducing a paywall.

The development database has the new schema. Before a future approved publish, apply the additive schema changes to the production database through the normal schema review. They add buyer/settings/event tables, vision fields, and the `picture` stage enum value. Retain the existing `personalize` enum value, season data, and transcripts.

## Owner setup

1. Sign in with the confirmed owner account.
2. Open **Account → Course buyers** at `/admin/course-buyers`.
3. After creating the course in Systeme.io, enter its numeric **Course ID**, its numeric **Offer price plan ID**, or both. If both are supplied, both must match the sale.
4. Save settings.
5. Select **Generate webhook URL**, confirm, and copy the complete URL shown. The URL includes a long secret token. It is revealed only when generated, never returned in the buyer list, and only its hash is stored.
6. In Systeme.io, add a **New sale** automation that sends its sale event to that URL by POST.

The endpoint at the verified published domain is:

`https://ripplelabs.app/api/systeme-sale`

The exact usable URL, including the generated secret query parameter, is available only through the owner page. Do not paste a placeholder into Systeme.io. Generating again replaces the previous token and requires updating the automation URL. Keep the copied URL private.

`PUBLIC_APP_URL` is set to the verified published HTTPS origin. `PURPOSE_LAB_OWNER_ID` identifies the confirmed owner's existing account by its server-owned ID, not an editable profile field.

## Expected sale payload

Send JSON with `Content-Type: application/json`. This is the native Systeme.io new-sale shape:

```json
{
  "type": "customer.sale.completed",
  "created_at": "2026-11-13T12:00:00+00:00",
  "data": {
    "customer": {
      "email": "buyer@example.com"
    },
    "order": {
      "id": 12345
    },
    "order_item": {
      "id": 67890,
      "resources": [
        {
          "type": "membership_course",
          "data": {
            "id": 111,
            "name": "Your course name"
          }
        }
      ]
    },
    "offer_price_plan": {
      "id": 222
    }
  }
}
```

Replace 111 with the qualifying course ID, and/or 222 with the qualifying offer price plan ID. The course resource is required when filtering by Course ID. The offer price plan is required when filtering by Offer price plan ID. The event type, customer email, order ID, order item ID, and timestamp are required. Names, prices, account email, and payment details are not required.

Systeme.io reference: https://help.systeme.io/article/144-how-to-create-an-automation-rule

### Responses and troubleshooting

- Missing/wrong token: HTTP 401, no buyer granted.
- No qualifying course or offer configured: HTTP 503, no buyer granted.
- Invalid sale data: HTTP 400.
- Other event type or another course/offer: HTTP 200 with an ignored outcome.
- Matching sale: HTTP 200; email normalized to lowercase and stored once with grant date and source `systeme`.
- Repeated sale: HTTP 200; original buyer grant is preserved rather than duplicated.

The owner page lists the most recent 100 webhook attempts with timestamps and outcomes. Application logs record outcomes and a hashed event key, not the secret URL or raw sale payload. Malformed JSON rejected before routing is reported by the HTTP server.

The owner can also grant access by email. Manual entries use source `manual`. Repeating a grant preserves its original date/source. Buyer recognition is checked from the authenticated account email, including accounts that existed before the course purchase. Both web and phone clients read the same server-owned status. Current users continue to have full access whether or not they appear on the buyer list.

## Book alignment

The approved sequence is:

1. Reveal · Your Story
2. Identify · Your Patterns
3. Pinpoint · Your Purpose
4. Picture · Your Vision
5. Live · Your Season
6. Expand · Your Ripple

Picture has its own vision responses and saved discovery. Earlier season reflections are preserved separately and remain available in Live. Live includes season/roles reflection and the existing Start, Stop, Continue action tools.

**Owner review:** Expand's exercise has been retained. Its stage screen carries a review note.

## Trademark inventory

The eight existing source occurrences of **The Ripple Method™** are preserved:

| Surface | Location | Count |
| --- | --- | --- |
| Home | Navigation link and feature card | 2 |
| Ripple Method page | Main heading, introduction, Purpose Lab invitation, and free-overview note | 4 |
| Purpose Lab page | Method section heading | 1 |
| Launch film | Scene 2 method heading | 1 |

This inventory covers source text, not text flattened into uploaded image assets.

## Unchanged

- The exact tagline: “What's within you creates a ripple.”
- The advertised $47 price and other users' current access.
- All existing journeys and season transcripts.
- Password reset remains disabled; its code and the Resend connection remain in place.

## Checks

Run all TypeScript checks with `pnpm run typecheck`.

Run the isolated webhook parsing/token regression tests without sending anything to Systeme.io:

```sh
pnpm --filter @workspace/api-server exec esbuild src/lib/course-access.test.ts --bundle --platform=node --format=esm --outfile=/tmp/course-access.test.mjs
node --test /tmp/course-access.test.mjs
```
