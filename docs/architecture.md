# Architecture

## Purpose

The workflow coordinates a CRM telemarketing queue and ElevenLabs
Conversational AI. It is event-driven: the start webhook handles queue work,
while the callback webhook completes each call.

## Main Flow

1. `Start Or Stop Webhook` receives a command and configuration.
2. `Normalize Start Input + Stop Flag` normalizes aliases, status mappings,
   parallelism, run timestamps, and static-data state.
3. `Gate: Stop Flag Is False` prevents new queue work after a stop command.
4. `Build Outgoing_Get SOAP` and `Telemarketing_Outgoing_Get` read the CRM
   queue.
5. `Pick Free Record` filters occupied, invalid, future-scheduled, and
   non-matching records, then chooses up to three records.
6. Each record is locked through `Telemarketing_Status_Set Lock`.
7. `Prepare ElevenLabs Payload` creates the outbound call request and embeds
   recovery metadata in dynamic variables.
8. `ElevenLabs Outbound Call` creates the SIP call.
9. `Store Active Call Mapping` correlates CRM records with ElevenLabs
   conversation and call identifiers.
10. `ElevenLabs Callback Webhook` receives post-call events.
11. `Resolve Callback + Final Status` reconstructs context, normalizes the
    outcome, and selects a CRM status.
12. `Telemarketing_Status_Set Final` writes the result to the CRM.
13. Continuation gates optionally POST `command=continue` to the start webhook.

## State

The workflow uses n8n global static data for:

- stop flags
- active call mappings
- current run timestamps
- campaign status maps
- completed outgoing guards
- recent call summaries

The state key includes CRM API URL, Business ID, and Campaign ID. A legacy
Business ID/Campaign ID key is maintained for backward compatibility.

## Failure Paths

- A failed CRM lock blocks the ElevenLabs request.
- A failed ElevenLabs start follows the failed-start unlock path.
- Unknown callback outcomes can use a configured fallback status.
- A missing in-memory call mapping can be rebuilt from ElevenLabs dynamic
  variables included in the outbound request.

## Concurrency

The start path caps `parallel_calls` at three. n8n processes each selected
record as an item. Callback completion is asynchronous and may occur in any
order.

## Trust Boundaries

- The start webhook controls CRM and ElevenLabs configuration.
- The callback webhook can cause CRM writes.
- CRM SOAP responses are treated as external input.
- ElevenLabs callbacks are treated as external input.

Production deployments should authenticate both webhook paths and validate
callback signatures or a shared secret before processing data.
