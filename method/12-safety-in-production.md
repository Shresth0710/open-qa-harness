# 12 · Safety in production

Most QA happens in production. Often there is no staging, or staging differs from production in
the ways that matter. These rules let you test production without hurting anyone.

## Before
- **Written authorisation** from the system owner, naming the environment and the window.
- **Backups and an undo path** known: can records you create be deleted from the UI? If not, ask
  before creating them.
- **Your identities ready:** test accounts on addresses you control (`you+qa1@yourdomain`), so
  every message the app sends lands with you.

## During
| Risk | Rule |
|---|---|
| Polluting real data | Prefix every record `QA-TEST`. Log it in `created-items.md` the moment you create it. |
| Touching other people's data | Existing records are **read-only**: open them, never edit or delete them. |
| Messaging real people | Sends only to your own addresses; WhatsApp/SMS to the send button only unless the recipient is yours. Log in `sends.md`. |
| Moving money | Follow checkout to the payment screen and stop. Use the provider's test mode where the owner can enable it (e.g. [Stripe test mode](https://docs.stripe.com/testing)). Screenshot the plan before and after. |
| Locking accounts | Do not brute-force login or reset; a few deliberate wrong attempts are enough to test the message. |
| Load | No load or stress testing in production without a separate agreement. |
| Acting as the wrong person | Identity check before every write ([04](04-black-box-execution.md)). |
| Leaking secrets | Never put passwords or tokens in scripts, findings or screenshots. |

## After
- Delete everything you created. Mark each row in `created-items.md`. List anything that could not
  be deleted and who can remove it.
- Revoke test API keys and webhooks. Delete saved sessions (`auth/*.json`).
- Report any rule you broke, honestly, in the report. A mistaken send that is disclosed is a
  small problem. One that is hidden destroys trust in the whole report.
