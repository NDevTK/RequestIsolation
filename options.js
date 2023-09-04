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
        ruleDomains.push(rule.condition.requestDomains[0]);
        
        let link = document.createElement('a');
        link.href = 'https://'+rule.condition.requestDomains[0];
        link.innerText = 'https://'+rule.condition.requestDomains[0];
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
    await chrome.declarativeNetRequest.updateDynamicRules({addRules: [{ id: id, action: {type: 'block'}, condition: {resourceTypes: ['sub_frame', 'main_frame'], requestDomains: [domain], excludedInitiatorDomains: [domain]} }] });
    id += 1;
  }
  await updateRules();
}
