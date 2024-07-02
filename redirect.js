"use strict";

const params = new URL(location.href).searchParams;
redirecter(params.get('id'));

function redirecter(id) {
    const url = localStorage.getItem('url_' + id);  
    if (invalidURL(url)) return
    location.href = url;
}

function invalidURL(url) {
    if (!url) return true
    try {
        const target = new URL(url);
        // Prevent XSS
        if (target.protocol === 'https:' || target.protocol === 'http:') return false
        alert('Not allowed URL');
    } catch {
        alert('Invalid URL');
    }
    return true
}
