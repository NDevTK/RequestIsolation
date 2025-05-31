# Security Policy for RequestIsolation Extension

This document outlines the security considerations, practices, and potential vulnerabilities related to the RequestIsolation browser extension. Its purpose is to provide transparency and guidance for users and developers.

The extension is designed to enhance browsing security by isolating requests to specific initiator domains using the `declarativeNetRequest` API.

## Core Functionality and Security Model

The RequestIsolation extension allows users to specify a list of domains. The extension then uses the `chrome.declarativeNetRequest` API to block network requests originating from any website to these specified domains, *unless* the request initiator is the domain itself or the extension's own internal pages.

### Key Security Mechanisms:

*   **`declarativeNetRequest` API:** This is the primary mechanism for blocking requests. Rules are defined declaratively, meaning the extension tells the browser what to block without running arbitrary JavaScript in the context of web pages. This is inherently more secure than intercepting and modifying requests programmatically.
*   **Content Security Policy (CSP):** The extension defines a strict CSP for its own pages (`extension_pages`):
    `default-src 'none'; script-src 'self'; frame-ancestors 'none'; form-action 'none'; upgrade-insecure-requests; block-all-mixed-content`
    This policy significantly reduces the risk of XSS vulnerabilities within the extension's own HTML pages (like `options.html`) by only allowing scripts to be loaded from the extension's own origin and disallowing other potentially risky sources.
*   **Cross-Origin Embedder Policy (COEP):** Set to `require-corp`, this policy helps protect against speculative execution attacks like Spectre by ensuring that cross-origin resources can only be loaded if they explicitly opt-in via CORP headers.
*   **Cross-Origin Opener Policy (COOP):** Set to `same-origin`, this policy helps mitigate attacks like tab-nabbing by ensuring that documents from different origins cannot share the same browsing context group.
*   **Permissions:** The extension only requests the `declarativeNetRequest` permission, which is necessary for its core functionality. It does not request broader permissions like access to page content or browsing history, adhering to the principle of least privilege.

## Potential Vulnerabilities and Considerations

While RequestIsolation is designed with security in mind, here are some areas and considerations:

### 1. Open Redirect via Shortcut Feature (`redirect.html`)

*   **Description:** The "Create Shortcut" feature generates a URL like `chrome-extension://[EXTENSION_ID]/redirect.html?id=[UUID]`. This page reads a target URL from `localStorage` (associated with the `UUID`) and redirects to it.
*   **Risk:** If an attacker could gain the ability to write arbitrary data to the extension's `localStorage`, they could potentially create or modify a shortcut's target URL to point to a malicious site. When a user then uses that shortcut, they would be redirected to the attacker's site.
*   **Mitigation & Context:**
    *   **Origin Isolation:** `localStorage` is isolated by origin. This means external websites cannot directly access or modify this extension's `localStorage`. The primary risk would stem from another vulnerability within *this specific extension* or a compromised browser environment.
    *   **Protocol Check:** The `redirect.js` and `options.js` files include an `invalidURL` function that checks if the target URL's protocol is `http:` or `https:`. This prevents redirection to `javascript:` URLs or other potentially harmful schemes (e.g., `file:`, `data:`), significantly limiting the impact of a successful `localStorage` manipulation.
    *   **No Sensitive Data in Shortcut:** Users should be aware that the target URLs for shortcuts are stored unencrypted in `localStorage`.

### 2. Input for `declarativeNetRequest` Rules

*   **Description:** In `options.js`, user-provided domain names are split by spaces and used to create blocking rules.
*   **Risk:** Currently, the input handling is straightforward. If future modifications were to involve more complex parsing or if the `declarativeNetRequest` API had less strict input requirements, improperly sanitized input could theoretically lead to unintended rule behavior. However, the `declarativeNetRequest` API itself is designed to be robust against malformed rule conditions.
*   **Mitigation & Context:** The current implementation directly uses domain strings for `requestDomains` and `excludedInitiatorDomains`. The risk is low as the API expects domain patterns. The extension also correctly avoids creating rules for its own host.

### 3. `localStorage` for Storing Shortcut URLs

*   **Description:** Shortcut URLs created via the `createShortcut` function in `options.js` are stored in `localStorage`.
*   **Considerations:**
    *   **Unencrypted Storage:** `localStorage` is not encrypted. While the extension's purpose is request isolation rather than managing highly sensitive secrets, users should be aware of this if they create shortcuts to sensitive URLs.
    *   **`revokeShortcuts` Behavior:** The `revokeShortcuts` function calls `localStorage.clear()`. This wipes all data from the extension's `localStorage`. If the extension were to use `localStorage` for other preferences or settings in the future, this function would also delete those. A more targeted removal of shortcut-related items (e.g., iterating through keys with a specific prefix) would be more robust for future expansion.

### 4. Error Handling in Asynchronous Operations

*   **Description:** Some `async` functions that interact with Chrome APIs (e.g., `updateRules`, `policyUpdate` in `options.js`) do not have explicit `try...catch` blocks.
*   **Risk:** If an API call within these functions were to fail unexpectedly (e.g., due to a browser issue or an unexpected state), the error might result in an unhandled promise rejection, potentially leading to a broken state for the extension's UI or rule management without clear feedback to the user.
*   **Mitigation & Context:** While not a direct exploitable vulnerability, robust error handling improves stability and user experience.

## Security Best Practices and Recommendations

The following are recommendations for maintaining and potentially enhancing the security and robustness of the extension:

*   **Refine Shortcut Revocation:**
    *   Instead of `localStorage.clear()`, modify the `revokeShortcuts` function in `options.js` to specifically remove items related to shortcuts. This could be done by iterating through `localStorage` keys and removing those that match a specific prefix (e.g., `url_`). This prevents accidental deletion of other data if `localStorage` is used for more features in the future.
    *   Example (conceptual):
        ```javascript
        // function revokeShortcuts() {
        //     Object.keys(localStorage).forEach(key => {
        //         if (key.startsWith('url_')) {
        //             localStorage.removeItem(key);
        //         }
        //     });
        //     alert('Shortcuts have been revoked.');
        // }
        ```

*   **Enhance Error Handling:**
    *   Wrap calls to Chrome APIs (especially `chrome.declarativeNetRequest.*`) in `try...catch` blocks within `async` functions (`updateRules`, `policyUpdate` in `options.js`). This will allow for graceful error handling and potentially provide feedback to the user or log errors for debugging, rather than risking unhandled promise rejections.
    *   Example (conceptual):
        ```javascript
        // async function policyUpdate() {
        //   try {
        //     await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds: ruleIDs});
        //     // ... rest of the logic ...
        //   } catch (error) {
        //     console.error("Error updating policies:", error);
        //     // Optionally, inform the user via a less intrusive UI element
        //   }
        //   // ...
        // }
        ```

*   **Improve User Feedback for Invalid URLs:**
    *   Replace `alert()` calls in `invalidURL` functions (in `options.js` and `redirect.js`) with a more user-friendly way of indicating an error. For example, displaying an error message within the extension's popup UI (for `options.js`) or on the `redirect.html` page itself. This avoids disruptive browser alerts.

*   **Regularly Review Permissions:**
    *   Continue to adhere to the principle of least privilege. If new features are added, carefully evaluate if new permissions are absolutely necessary.

*   **Keep Dependencies Updated (if any were to be added):**
    *   If third-party libraries are introduced in the future, ensure they are kept up-to-date to patch any known vulnerabilities. (Currently, the extension appears to use no external JS libraries).

*   **Content Security Policy (CSP) Maintenance:**
    *   Periodically review the CSP to ensure it remains as strict as possible while allowing required functionality.

This document will be updated periodically as the extension evolves or new security considerations arise.
