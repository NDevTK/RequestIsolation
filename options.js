const userinput = document.getElementById('userinput');
const links = document.getElementById('links');

let ruleIDs = [];
let ruleDomains = [];

async function updateRules() {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();

    links.innerHTML = '';
    ruleIDs = [];
    ruleDomains = [];

    for (let rule of rules) {
        ruleIDs.push(rule.id);
        const requestDomain = rule.condition.requestDomains[0];
        ruleDomains.push(requestDomain);

        if (requestDomain === location.host) continue
        
        let link = document.createElement('a');
        link.href = 'https://'+requestDomain;
        link.innerText = 'https://'+requestDomain;
        link.target = '_blank';
        links.appendChild(link);
        links.appendChild(document.createElement('br'));
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
    await chrome.declarativeNetRequest.updateDynamicRules({addRules: [{ id: id, action: {type: 'block'}, condition: {resourceTypes: ['sub_frame', 'main_frame'], requestDomains: [domain], excludedInitiatorDomains: [domain, location.host]} }] });
    id += 1;
  }
  // Protect extension domain
  await chrome.declarativeNetRequest.updateDynamicRules({addRules: [{ id: id, action: {type: 'block'}, condition: {resourceTypes: ['sub_frame', 'main_frame'], requestDomains: [location.host]} }] });
  await updateRules();
}
