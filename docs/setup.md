# Setup

## 1. Import

Import `workflows/telemarketing-elevenlabs-template.json` into n8n. Keep the
workflow inactive while replacing sample values.

## 2. Configure CRM Access

Provide:

- SOAP endpoint ending in `/soap/IBusinessAPI`
- entity ID
- username
- password
- Business ID
- Campaign ID
- optional user ID filter

Confirm that the account can call `Telemarketing_Outgoing_Get` and
`Telemarketing_Status_Set`.

## 3. Configure ElevenLabs

Provide:

- API key
- Conversational AI agent ID
- outbound SIP phone number ID

Replace the `xi-api-key` value in `ElevenLabs Outbound Call`. For a production
deployment, use an n8n credential or another secret-management mechanism
instead of a literal header value.

## 4. Configure Webhooks

The imported workflow exposes:

- `/webhook/telemarketing-elevenlabs-start`
- `/webhook/telemarketing-elevenlabs-callback`

Set `self_start_webhook_url` to the public production URL of the start webhook
when auto-continue is enabled.

Configure the ElevenLabs agent post-call webhook to target the callback URL.
The workflow expects the ElevenLabs post-call payload and supports context
recovery from dynamic variables.

## 5. Configure Status IDs

Review `examples/status-map.example.json`. Replace every status ID with a valid
ID from the target CRM. Do not assume the demonstration defaults match another
installation.

## 6. First Run

Use:

- one known test contact
- `parallel_calls: 1`
- `auto_continue_after_callback: false`
- a non-production campaign

Run the start request and inspect each external request and response. Only
enable automatic continuation after the full callback-to-final-status path has
been verified.

## 7. Production Hardening

Before production use:

- move secrets out of workflow JSON
- authenticate webhook requests
- define timeout, retry, and alerting behavior
- persist correlation state outside n8n static data
- add idempotency for duplicate callbacks
- establish data-retention rules for transcripts and summaries
- review calling-consent and telemarketing regulations for the target region
