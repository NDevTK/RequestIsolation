# RequestIsolation
An experimental security extension to Isolate domains so they can only be accessed directly via the extension popup.
This prevents URL based reflected XSS, Timing attacks, CSRF, postMessage and clickjacking attacks.

# Threat model

## Allowed
- Extensions with the tabs permission stealing the redirecter secret (only if a shortcut was created)
- Attacker controled link on isolated domain navigating to the same isolated domain
## Not allowed
- A page actively attacking an isolated domain without attacker controlled content
- Getting opener acesss when the isolated domain has a attacker controled link with `target=_blank` and no `rel=opener` <https://chromestatus.com/feature/6140064063029248>
- Extensions without any permissions using chrome.tabs.create
- This extension having a host permission
- Pasting attacker controled URL that exploits a reflected XSS


# TLDR
- self-DoS-as-a-service
- well make Chrome unusable but very secure, that's gotta be worth it
- thanks I am a good slogan generator
