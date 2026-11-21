# 13 · QA with AI agents

An AI coding agent with a browser (Claude Code with Playwright, or any agent that can run scripts)
can do most of this method. These rules keep its output trustworthy.

## Split the work the way you would for people

| Role | Does | Must not |
|---|---|---|
| **Lead** | scope, recon, area split, dispatch, severity calls, report | test everything itself in one long session |
| **Explorer** (one per area) | runs the charter for 4–6 routes, writes findings + coverage | judge its own findings as verified |
| **Code reader** (white-box) | extracts requirements and routes from the repo | edit the code |
| **Verifier** | re-runs a sample of findings from the write-up alone | be the same agent that found them |
| **Reporter** | builds the report, checks it renders | invent or reword findings |

This repo ships these as Claude Code agents in [`.claude/agents/`](../.claude/agents/).

## Rules that matter more with agents

1. **Small areas.** An agent that runs out of context half-way through an area tests the second
   half from a summary. Give it 4–6 routes, and have it write a handoff note at about 60% of its
   budget, not 100%.
2. **Hand over in files, not in chat.** Each agent reads the `engagement.md` rules and writes
   `findings/<area>.md`, `coverage.md` rows and a short handoff. The next agent starts from the
   files.
3. **Put the rules of engagement into every dispatch.** When the lead tells an explorer "submit the
   contact form", that is a send. Before dispatching any instruction that writes or sends, the lead
   re-reads `engagement.md` §5 and names the line that permits it.
4. **The verifier is a different agent.** The agent that found a bug is the worst judge of whether
   its own write-up is reproducible.
5. **Agents over-report.** Expect false positives from selector mistakes, timing and stale elements
   ([09](09-verification.md)). The two-sightings rule and the verifier catch most of them.
6. **Automated checks first, agent judgement second.** Let `oqa scan` and `oqa lint` do what a
   script can do, and spend the agent on what needs judgement: impact, plain words, severity.
7. **Never let an agent self-certify "done".** Done means `oqa lint` passes, verification is
   recorded and the PDF has been opened and looked at.
