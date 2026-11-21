# Checklist · Forms and input

For every field, test the classes and the boundaries ([03](../03-test-design.md)).

## Values to try
| Field type | Try |
|---|---|
| Text | empty · one space · 1 char · max length · max + 1 · emoji `🙂` · RTL `مرحبا` · `<b>x</b>` · leading/trailing spaces · very long word without spaces |
| Number / quantity | `0` · `1` · max · max + 1 · `-1` · `1.5` · `1e3` · empty · a letter · paste `10 000` |
| Money | `0` · negative · 3 decimals · currency symbol typed in · thousands separator |
| Date | yesterday · today · far future · Feb 29 · end of month · DST change day · a different timezone |
| Email | `a@b` · `a@b.` · `name+tag@domain.com` (must be accepted) · uppercase · trailing space |
| Phone | with/without country code · spaces · dashes · too short · letters |
| File upload | wrong type · 0 bytes · over the size limit · a name with spaces and unicode · two at once |

## Behaviour
- [ ] Required fields marked, and enforced on submit
- [ ] Errors appear next to the field, say what is wrong and how to fix it, and keep the user's input
- [ ] The same rules hold when you bypass the UI (white-box: call the API with the bad value)
- [ ] **Double-click submit**: creates one record, not two
- [ ] Submit, then Back, then submit again: no duplicate, or a clear message
- [ ] Slow network (DevTools throttling): the button shows progress and blocks a second submit
- [ ] Success message appears only when the server actually succeeded (check the network response)
- [ ] After success: list, counters, emails and exports reflect the new record
- [ ] Autocomplete attributes set (`email`, `current-password`, `new-password`, `one-time-code`)
- [ ] Mobile: correct keyboard (`type=email`, `inputmode=numeric`); the keyboard does not cover the field being typed
