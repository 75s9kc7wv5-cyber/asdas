
const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/parties/7');
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
