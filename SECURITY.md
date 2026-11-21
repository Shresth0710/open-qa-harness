# Security

## Reporting a vulnerability in this harness
Please open a [private security advisory](https://github.com/Shresth0710/open-qa-harness/security/advisories/new)
rather than a public issue.

## Using this harness responsibly
- Only test applications you own or have written permission to test.
- `oqa scan` is passive: it reads pages, headers and cookies the way a browser does, and it requests
  each same-origin link once. It does not attack, fuzz or load-test.
- `auth/*.json` files created by `oqa login` are live sessions. They are git-ignored. Delete them
  when the engagement ends and never share them.
