const params = new URL(location.href).searchParams;
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
        if (requestDomain === location.host) continue
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

function invalidURL(url) {
    if (!url) return true
    try {
        const target = new URL(url);
        if (target.protocol === 'https:' || target.protocol === 'http:') return false
        alert('Not allowed URL');
    } catch {
        alert('Invalid URL');
    }
    return true
}

function createShortcut() {
    const url = prompt('What url?');
    if (invalidURL(url)) return
    
    if (!localStorage.hasItem('secret')) {
        localStorage.setItem('secret', crypto.randomUUID());
    }
    
    const secret = localStorage.getItem('secret');
    
    prompt('Please use this URL', location.href + '?secret=' + localStorage.getItem('secret') + '&url=' + encodeURIComponent(url));
}

// Check if current URL is a redirect request.
if (params.has('secret') && params.has('url') && localStorage.hasItem('secret')) {
    redirecter(params.get('url') && params.get('secret'));
}

function redirecter(url, maybe_secret) {
    const secret = localStorage.getItem('secret');
    // This page is not in WAR however its better to not increase the attack surface.
    if (maybe_secret !== secret) return
    if (invalidURL(url)) return

    location.href = url;
}
