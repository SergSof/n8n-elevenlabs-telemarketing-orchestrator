# Testing Plan

## Stage 1: Static Validation

1. Parse the workflow JSON.
2. Confirm all 27 nodes import successfully.
3. Review all literal URLs, IDs, credentials, phone numbers, and webhook URLs.
4. Run the sanitizer in report mode on any export intended for publication.

## Stage 2: CRM Read

1. Use a non-production campaign.
2. Submit `parallel_calls: 1`.
3. Confirm `Telemarketing_Outgoing_Get` returns the expected queue.
4. Verify user ID filtering and future `ScheduleTo` exclusion.

## Stage 3: Lock And Failed Start

1. Select one test record.
2. Confirm the lock status is written.
3. Force an invalid ElevenLabs request.
4. Confirm the failed-start status and unlock path execute.

## Stage 4: Successful Call

1. Use a valid test extension or consented test number.
2. Confirm a conversation ID is stored.
3. Complete the call.
4. Confirm callback correlation and final CRM status.

## Stage 5: Outcome Mapping

Exercise:

- answered
- no answer
- busy
- invalid number
- answering machine
- business outcomes collected by the agent
- unknown outcome fallback

## Stage 6: Continuation And Stop

1. Enable `auto_continue_after_callback`.
2. Confirm one callback starts the next queue cycle.
3. Send `stop`.
4. Confirm active calls finish but no new cycle begins.
5. Send a new `start` and confirm the older stop record is treated as stale.

## Stage 7: Parallelism

1. Repeat with `parallel_calls: 2`, then `3`.
2. Confirm each CRM record is locked once.
3. Confirm callbacks can complete out of order.
4. Check that continuation does not overrun the intended concurrency.

## Exit Criteria

- No duplicate CRM final updates
- No record remains locked after failed call creation
- Every callback can recover enough context to update the CRM
- Stop behavior is reproducible
- Logs contain no secrets or unrelated customer data

The public template has not completed a 100-record end-to-end run. Treat
large-scale behavior as unverified until tested in the target environment.
