const fetch = require('node-fetch'); // or use native fetch
(async () => {
    try {
        const res = await fetch('http://localhost:8080/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promptParts: [{ text: "hello" }] })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch(e) { console.error(e); }
})();
