const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const USER_ID = 1;
const MINE_ID = 10;

async function runTest() {
    try {
        // 1. Start Production
        console.log('Starting production...');
        const startRes = await axios.post(`${BASE_URL}/mines/start`, {
            userId: USER_ID,
            mineId: MINE_ID
        });
        console.log('Start Response:', startRes.data);

        if (!startRes.data.success) {
            console.error('Start failed:', startRes.data.message);
            return;
        }

        // 2. Wait for production (or cheat if possible, but let's just wait if it's short)
        // The log said ProdTime: 10 (I saw 10 in the logs earlier, maybe it was changed?)
        // Let's check the response endTime.
        const endTime = new Date(startRes.data.endTime);
        const now = new Date();
        const waitTime = endTime - now;
        
        console.log(`Waiting for ${waitTime}ms...`);
        if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
        }

        // 3. Collect
        console.log('Collecting...');
        const collectRes = await axios.post(`${BASE_URL}/mines/collect`, {
            userId: USER_ID,
            mineId: MINE_ID
        });
        console.log('Collect Response:', collectRes.data);

        // 4. Check Logs
        console.log('Checking logs...');
        const detailRes = await axios.get(`${BASE_URL}/mines/detail/${MINE_ID}?userId=${USER_ID}`);
        const logs = detailRes.data.logs;
        if (logs && logs.length > 0) {
            console.log('Latest Log:', logs[0]);
        } else {
            console.log('No logs found.');
        }

    } catch (error) {
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

runTest();
