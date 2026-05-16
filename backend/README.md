# Globe Go Travels Backend Integration Notes

The public website must not contain Expedia TAAP login details, API keys, passwords, or supplier credentials. Keep all Expedia TAAP, Expedia Group Rapid API, GDS, NDC, payment, and CRM credentials on a secure backend only.

## Search Flow

1. Passenger searches on `travel-search.html`.
2. Browser submits search criteria to `/api/taap/search`.
3. Backend authenticates with the approved supplier connection.
4. Backend normalizes results and returns safe public fields to the browser.
5. Passenger requests booking help or continues to an approved booking flow.

## Local Dev Server

Create `backend/.env` from `backend/.env.example` and enter your Expedia-approved credentials there. Do not put real credentials in front-end files.

Run this to serve the website and the placeholder API from one origin:

```bash
node backend/taap-proxy.example.js
```

Then open `http://localhost:8787/travel-search.html?service=flights`.

The placeholder API returns no live supplier inventory. It exists so the browser-side search page can be connected to the same route that a real backend will use later.

Check whether credentials are loaded without exposing secret values:

```bash
curl http://localhost:8787/api/taap/status
```

## AI Chatbot Setup

The website chat widget calls `POST /api/chat`. If `GEMINI_API_KEY` is set in `backend/.env`, the backend uses Gemini. If it is not set, the widget uses safe fallback travel replies.

Add these values to `backend/.env` when available:

```bash
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-2.5-flash
WHATSAPP_BUSINESS_NUMBER=12505550198
```

`WHATSAPP_BUSINESS_NUMBER` powers the public click-to-chat button. Use international format without `+`, spaces, or punctuation.

Optional WhatsApp Cloud API server-side sending can be configured later:

```bash
WHATSAPP_GRAPH_VERSION=v21.0
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_NOTIFY_TO=
```

For manual operations, the click-to-chat button is usually enough. Cloud API credentials are only needed when the server must send WhatsApp messages programmatically.

## Lead Email Setup

Website forms and chatbot WhatsApp handoffs submit lead summaries to `POST /api/lead`.

Leads are always stored locally in `backend/leads/submissions.jsonl`. Email delivery activates after SMTP settings are added to `backend/.env`:

```bash
LEAD_RECIPIENT_EMAIL=info@globegotravels.com
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Use the SMTP settings from your email host for `info@globegotravels.com`, or from whichever mailbox should send the summaries.

## Search Response Shape

The front end expects `/api/taap/search` to return JSON like this:

```json
{
  "live": true,
  "results": [
    {
      "title": "Supplier option name",
      "subtitle": "Short passenger-facing summary",
      "price": "CA$1,248",
      "image": "https://example.com/image.jpg",
      "meta": ["Refundable", "Taxes included", "Agent verified"]
    }
  ]
}
```

## Important Expedia Note

Expedia TAAP is an agent booking platform/portal for travel agencies. A TAAP login should not be automated from browser JavaScript or exposed to passengers. If you need live inventory in your website, confirm with Expedia whether your account supports an API, Rapid API, white-label, affiliate, or approved partner integration.

## Suggested Backend Routes

- `POST /api/taap/search` for flights, hotels, packages, cars, cruises, and activities search requests.
- `POST /api/quote` for saving a customer quote request.
- `POST /api/payment-link` for generating secure payment links.
- `GET /api/pnr/:reference` for booking lookup when a real booking engine is connected.

## Security Requirements

- Use HTTPS in production.
- Store credentials in environment variables or a secret manager.
- Do not store card numbers.
- Do not store passport details unless required and protected.
- Log supplier errors without exposing credentials or passenger sensitive data.
- Use rate limiting and abuse protection on search endpoints.
