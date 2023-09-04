var userinput = document.getElementById('userinput');

// User presses enter
window.addEventListener('keyup', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        policyUpdate();
    }
});

async function policyUpdate() {
  const ruleIDs = await chrome.declarativeNetRequest.getEnabledRulesets();
  await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds: ruleIDs});
  userinput.value.
  const domains = userinput.value.split(" ");
  let id = 1;
  for (let domain of domains) {
    if (domain.length < 1) continue
    chrome.declarativeNetRequest.updateDynamicRules({id: id, action: {type: 'block'}, condition: {requestDomains: [domain], excludedRequestDomains: [domain]}});
    id += 1;
  }
}
