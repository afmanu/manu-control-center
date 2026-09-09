# Run an existing workflow on the host's schedule

Scheduling is opt-in. First run the exact workflow manually in the selected workspace and inspect its useful output. Reuse a saved SOP or skill, explicit input/output routes and same-period reuse rules. Confirm the user's cadence/timezone, destination and intended notifications from the request; ask only for a missing required choice. Creating a recipe or installing this kit never creates a schedule.

Save a small record using the [schedule template](templates/schedule.md). Include the native host/task ID, actual trigger, workspace, prompt, verified manual artifact, latest due/run/output evidence, access limits and pause/stop/recovery route. Do not infer a successful run from registration or a next-run timestamp. A quiet unchanged result is valid; keep notifications quiet unless something meaningful changes or action is needed. Do not add sending, publishing, account changes or unrelated improvements to the scheduled prompt.

## Codex desktop

Use the app's native scheduling tools or Scheduled interface. Prefer a follow-up in the current task for continued context; use a standalone project schedule when the user asks for independent runs. Inspect existing matching schedules before creating another. Local-file work needs the computer and app available. Codex CLI can test the prompt but has no equivalent schedule-management interface. These details follow the [official scheduled-task guidance](https://learn.chatgpt.com/docs/automations).

Use the host's tools to view due/run status, pause or delete the exact task, and verify its final inactive state. Keep host-owned configuration in the host; do not write scheduler files directly or add cron/launchd services as a workaround. If a task cannot execute while its conversation is busy, record pending execution rather than simulating a due run manually.

## Claude Code session loop

For a short session-bound routine, request `/loop 5m <the verified workflow prompt>` or ask for a one-time future check. Use an explicit prompt and interval. Inspect the returned job ID and cadence. The session must remain open and idle for due prompts to run; this is not a durable background-service promise. Ask Claude to list or cancel the exact task using its native CronList/CronDelete tools. Check removal before closing the test session. See [Claude scheduling](https://code.claude.com/docs/en/scheduled-tasks); installed versions may differ from current documentation.

## Verify and recover

For each host claimed as exercised, observe one real due trigger and the resulting sourced artifact, then pause/delete and verify no test schedule remains active. A manual Run now or a saved schedule alone is insufficient. If execution or host tools are unavailable, deliver the recipe with execution unverified and the exact gap; do not substitute a custom runner. On a failed run, preserve the last good output, inspect the specific access/input/tool failure, repair within authorization, test manually and resume the existing task. Avoid duplicate schedules or replaying external effects.
