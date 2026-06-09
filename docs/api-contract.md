# Webhook API Contract

## Start Endpoint

`POST /webhook/telemarketing-elevenlabs-start`

The normalization node accepts values from JSON body, query parameters, route
parameters, or top-level n8n fields.

## Commands

| Command | Behavior |
| --- | --- |
| `start` | Starts a new timestamped queue run |
| `continue` | Continues the current run |
| `resume` | Starts or resumes queue processing |
| `stop` | Blocks future continuation cycles |
| `save_status_map` | Stores the submitted map without dialing |
| `show_status_map` | Returns the effective map without dialing |
| `reset_status_map` | Removes the stored campaign map |
| `reset_completed` | Clears the completed-record guard for the campaign |

## Important Start Fields

| Field | Description |
| --- | --- |
| `business_api_url` | CRM SOAP endpoint |
| `business_entity_id` | CRM API entity/account ID |
| `business_username` | CRM API username |
| `business_password` | CRM API password |
| `BusinessId` | CRM business identifier |
| `CampaignID` | Telemarketing campaign identifier |
| `userID` | Optional queue filter |
| `agent_id` | ElevenLabs agent ID |
| `agent_phone_number_id` | ElevenLabs outbound number ID |
| `parallel_calls` | Requested call count, capped at 3 |
| `crm_fetch_limit` | Queue fetch size, capped at 100 |
| `auto_continue_after_callback` | Enables callback-driven continuation |
| `self_start_webhook_url` | Start endpoint used by continuation requests |
| `status_map` | Outcome-to-CRM-status object |
| `default_final_status_id` | Fallback final status |
| `failed_start_status_id` | Status used when call creation fails |

Aliases such as `parallel-calls`, `parallelCalls`, `business_id`, and
`campaign_id` are also normalized by the workflow.

## Callback Endpoint

`POST /webhook/telemarketing-elevenlabs-callback`

The callback handler reads standard ElevenLabs post-call fields including:

- `data.conversation_id`
- `data.metadata.phone_call`
- `data.analysis.call_successful`
- `data.analysis.data_collection_results`
- `data.transcript`
- `data.conversation_initiation_client_data.dynamic_variables`

## Normalized Outcomes

- `answered`
- `no_answer`
- `busy`
- `invalid_phone`
- `fax`
- `answering_machine`
- `not_interested`
- `confirm`
- `call_back`
- `failed`

Unknown outcomes use explicit callback status fields, configured maps, or the
default final status in that order.

## Stop Semantics

`stop` affects future queue fetches and auto-continue requests. It does not
terminate an outbound call already created in ElevenLabs.
