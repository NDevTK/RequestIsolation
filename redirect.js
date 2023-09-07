// Check if current URL is a redirect request.
if (params.has('secret') && params.has('url')) {
    redirecter(params.get('url'), params.get('secret'));
}

function redirecter(url, maybe_secret) {
    const secret = localStorage.getItem('secret');
    
    // This page is not in WAR however its better to not increase the attack surface.
    if (!secret || maybe_secret !== secret || invalidURL(url)) return

    location.href = url;
}
