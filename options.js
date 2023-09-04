const userinput = document.getElementById('userinput');

let ruleIDs = [];
let ruleDomains = [];

async function updateRules() {
    const rules = await chrome.declarativeNetRequest.getEnabledRulesets();
    
    for (let rule of rules) {
        ruleIDs.push(rule.id);
        ruleDomains.push(rule.condition.requestDomains);
    }
    
    userinput.value = ruleDomains.join(" ");
}

updateRules();

// User presses enter
window.addEventListener('keyup', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        policyUpdate();
    }
});

async function policyUpdate() {
  await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds: ruleIDs});
  const domains = userinput.value.split(" ");
  let id = 1;
  for (let domain of domains) {
    if (domain.length < 1) continue
    chrome.declarativeNetRequest.updateDynamicRules({id: id, action: {type: 'block'}, condition: {requestDomains: [domain], excludedRequestDomains: [domain]}});
    id += 1;
  }
  await updateRules();
}
