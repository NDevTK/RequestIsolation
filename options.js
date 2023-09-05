const userinput = document.getElementById('userinput');
const links = document.getElementById('links');
const blockTypes = ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket", "webtransport", "webbundle", "other"];
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
  const domains = [...new Set(userinput.value.split(" "))];
  let id = 1;
  for (let domain of domains) {
    if (domain.length < 1) continue
    if (domain === location.host) continue
    await chrome.declarativeNetRequest.updateDynamicRules({addRules: [{ id: id, action: {type: 'block'}, condition: {resourceTypes: blockTypes, requestDomains: [domain], excludedInitiatorDomains: [domain, location.host]} }] });
    id += 1;
  }
  // Protect extension domain
  await chrome.declarativeNetRequest.updateDynamicRules({addRules: [{ id: id, action: {type: 'block'}, condition: {resourceTypes: blockTypes, requestDomains: [location.host]} }] });
  await updateRules();
}

async function nag() {
    const allowed = await chrome.permissions.contains({origins: ['<all_urls>']});
    if (allowed) return;
    const button = document.createElement('button');
    button.innerText = 'Include all request types';
    button.addEventListener('click', async () => {
        const allowed = chrome.permissions.request({origins: ['<all_urls>']});
        if (!allowed) return;
        document.body.removeChild(button);
    });
    document.body.appendChild(button);
}

nag();
