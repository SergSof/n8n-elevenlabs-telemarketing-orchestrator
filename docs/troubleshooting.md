# Troubleshooting

## CRM Returns An Empty Queue

- Confirm Business ID, Campaign ID, and optional user ID.
- Check whether records are already locked.
- Check whether `ScheduleTo` is in the future.
- Confirm records contain a usable phone field.
- Inspect the raw SOAP response before changing workflow logic.

## CRM Returns `User not found`

The CRM endpoint and credentials may belong to different environments. Verify
that the username/entity pair exists in the database behind the exact SOAP
endpoint being called.

## Calls End Immediately With Error

- Validate the destination number format.
- Confirm the outbound SIP trunk and phone number ID.
- Confirm the agent is allowed to use that number.
- Inspect the ElevenLabs conversation termination reason.
- Test with a known valid extension before using CRM queue data.

## Callback Cannot Find The Active Call

Confirm that the outbound payload includes dynamic variables for:

- CRM entity and outgoing IDs
- Business ID and Campaign ID
- CRM endpoint and API account fields
- run timestamp
- status map
- self-start webhook URL

The callback can rebuild context from these variables when n8n static data no
longer contains the original mapping.

## Auto-Continue Does Not Run

- Set `auto_continue_after_callback` to `true`.
- Provide a public `self_start_webhook_url`.
- Confirm the workflow is active.
- Check for a current stop flag.
- Inspect `Trigger Next Start Webhook`.

## A New Start Is Still Stopped

Use an explicit `start` or `resume`, not only `continue`. New starts receive a
new `run_started_at`; a correctly timestamped older stop should then be ignored.

## Duplicate Final Updates

ElevenLabs or an intermediary may retry callbacks. Add persistent idempotency
using `conversation_id`, `sip_call_id`, or `TelOutgoingID` before production
use. n8n static data alone may be insufficient in multi-worker deployments.
