# n8n ElevenLabs Telemarketing Orchestrator

An n8n workflow template for orchestrating outbound AI voice calls between a
SOAP-based CRM telemarketing queue and ElevenLabs Conversational AI.

The workflow reads queued contacts, locks records before dialing, starts
outbound SIP calls, processes ElevenLabs callbacks, maps call outcomes to CRM
statuses, and optionally continues through the queue.

> [!IMPORTANT]
> This repository is a prototype and integration example. It is not presented
> as production-ready, and it has not been validated against every CRM or
> ElevenLabs account configuration.

## Architecture

```text
Start/continue webhook
        |
        v
CRM queue fetch -> record filtering -> CRM lock
                                      |
                                      v
                            ElevenLabs outbound call
                                      |
                                      v
ElevenLabs callback -> outcome mapping -> CRM final status
                                      |
                                      v
                         optional automatic continue
```

See [docs/architecture.md](docs/architecture.md) for the detailed flow.

## Features

- Start, continue, stop, resume, and status-map control commands
- CRM queue reads through a SOAP API
- Optional `userID` filtering
- Scheduled callback priority
- Up to three parallel call starts per workflow run
- CRM record locking before outbound dialing
- ElevenLabs outbound SIP call creation
- Callback correlation through conversation metadata and n8n static data
- Configurable CRM status mapping
- Failed-start unlock and recovery path
- Auto-continue after callbacks
- Run-aware stop flags so an old stop does not block a new run

## Repository Contents

```text
.
|-- README.md
|-- workflows/
|   `-- telemarketing-elevenlabs-template.json
|-- docs/
|   |-- architecture.md
|   |-- setup.md
|   |-- api-contract.md
|   |-- testing-plan.md
|   `-- troubleshooting.md
|-- examples/
|   |-- start.payload.example.json
|   |-- stop.payload.example.json
|   |-- callback.example.json
|   `-- status-map.example.json
|-- scripts/
|   `-- sanitize-workflow.js
|-- .env.example
|-- .gitignore
`-- LICENSE
```

## Requirements

- n8n with Code, Webhook, HTTP Request, Set, and Manual Trigger nodes
- A CRM SOAP API compatible with the demonstrated operations:
  - `Telemarketing_Outgoing_Get`
  - `Telemarketing_Status_Set`
- An ElevenLabs Conversational AI agent
- An ElevenLabs outbound SIP phone number
- Public HTTPS access to the n8n callback webhook

## Quick Start

1. Import
   [workflows/telemarketing-elevenlabs-template.json](workflows/telemarketing-elevenlabs-template.json)
   into n8n.
2. Replace all sample CRM and ElevenLabs values.
3. Configure the ElevenLabs agent to send post-call data to:
   `https://YOUR_N8N_HOST/webhook/telemarketing-elevenlabs-callback`.
4. Activate the workflow.
5. POST a start payload to:
   `https://YOUR_N8N_HOST/webhook/telemarketing-elevenlabs-start`.
6. Validate one test record before enabling auto-continue or parallel calls.

Detailed instructions are in [docs/setup.md](docs/setup.md).

## Webhook API

The main webhook accepts JSON, query parameters, or top-level fields.

```bash
curl -X POST "https://YOUR_N8N_HOST/webhook/telemarketing-elevenlabs-start" \
  -H "Content-Type: application/json" \
  --data @examples/start.payload.example.json
```

Supported control commands include:

- `start`
- `continue`
- `resume`
- `stop`
- `save_status_map`
- `show_status_map`
- `reset_status_map`
- `reset_completed`

See [docs/api-contract.md](docs/api-contract.md) for fields and behavior.

## CRM Status Mapping

The workflow includes these default demonstration mappings:

| Outcome | CRM status ID |
| --- | ---: |
| `no_answer` | `1` |
| `busy` | `2` |
| `invalid_phone` | `3` |
| `fax` | `4` |
| `answering_machine` | `5` |

Business outcomes such as `answered`, `not_interested`, `confirm`,
`call_back`, and `failed` should be mapped to IDs from your CRM.

## Parallel Calls And Stop Logic

`parallel_calls` is capped at `3`. Each selected CRM record becomes an
independent n8n item and follows its own lock, call, callback, and final-status
path.

The stop command prevents new continuation cycles. It does not cancel calls
already sent to ElevenLabs. Stop records include timestamps, allowing a later
explicit start to begin a new run without being blocked by an old flag.

## Testing

Start with one record, `parallel_calls: 1`, and
`auto_continue_after_callback: false`. Verify the lock, ElevenLabs request,
callback, and final CRM update before increasing scope.

The full staged plan is in [docs/testing-plan.md](docs/testing-plan.md).

## Security

- All identifiers and credentials in the included workflow are demonstration
  values and must be replaced.
- Prefer n8n credentials or environment variables over values embedded in Code
  or HTTP Request nodes.
- Do not commit n8n execution exports, transcripts, phone numbers, or CRM data.
- Protect both webhooks with an authentication or signature-verification layer.
- Run `node scripts/sanitize-workflow.js <workflow.json> [output.json]` before
  publishing a modified export.

## Known Limitations

- The SOAP request shape is specific to the demonstrated CRM contract.
- n8n static data is used for run state and callback correlation.
- Automatic retry/backoff is not implemented for all external calls.
- The repository does not include a mock CRM server or a complete local demo.
- A full 100-record end-to-end test was not completed for this public template.

## Roadmap

- Move every credential to n8n credentials or environment variables
- Add retry/backoff and idempotency tests
- Add a mock SOAP CRM service
- Add status-mapping fixtures and automated checks
- Persist call state outside n8n static data
- Add a Docker Compose demonstration environment
- Add active-call monitoring and operational dashboards

## License

[MIT](LICENSE)
