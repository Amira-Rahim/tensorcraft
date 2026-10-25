# Tensorcraft project instructions

Read and follow [CLAUDE.md](CLAUDE.md) before making changes. Its project rules
are binding for all agents.

Follow the [lesson quality contract](CLAUDE.md#lesson-quality-contract-binding-2026-10-16):
consistent shared layout, verified technical accuracy, logical storytelling,
clear casual wording, and purposeful visual interaction for frontend developers
learning ML. These are ongoing project requirements, not a one-lesson exception.

Story comes first in the learning experience. Every lesson must be as visual,
interactive, and dynamic as possible. Keep the story visible in its intended
section and preserve its connection to the learner's task.
Teach through that ongoing task and its data. Use a clearly identified small
excerpt when the full recording is too large, following the quality contract.

For Deep Orbit narrative work, also follow
[the story style bible](docs/story-style-bible.md).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
