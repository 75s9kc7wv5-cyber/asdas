const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const USER_ID = 1;
const HOSPITAL_ID = 1;

async function runTest() {
    try {
        // 1. Start Treatment
        console.log('Starting treatment...');
        try {
            const treatRes = await axios.post(`${API_URL}/hospital/treat`, {
                userId: USER_ID,
                hospitalId: HOSPITAL_ID
            });
            console.log('Start Treatment Response:', treatRes.data);
        } catch (e) {
            console.log('Start Treatment Error (might already be treating):', e.response ? e.response.data : e.message);
        }

        // 2. Get Details
        console.log('Fetching details...');
        const detailsRes = await axios.get(`${API_URL}/hospital/${HOSPITAL_ID}/details`);
        
        const activeTreatments = detailsRes.data.activeTreatments;
        console.log('Active Treatments:', activeTreatments);

        if (activeTreatments && activeTreatments.length > 0) {
            const myTreatment = activeTreatments.find(t => t.user_id === USER_ID);
            if (myTreatment) {
                console.log('My Treatment Time Left (Seconds):', myTreatment.time_left_seconds);
                console.log('End Time:', myTreatment.end_time);
            } else {
                console.log('My treatment not found in list.');
            }
        } else {
            console.log('No active treatments found.');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

runTest();
