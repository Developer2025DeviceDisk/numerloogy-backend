const axios = require('axios');

const getNumerologyReport = async (userData) => {
    const dob = userData.dob;
    const [year, month, day] = dob.split('-').map(Number);
    const name = userData.fullName;

    const commonHeaders = {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.RAPIDAPI_HOST
    };

    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');

    const endpoints = [
        { key: 'life_path', url: '/life_path', params: { birth_day: day, birth_month: month, birth_year: year } },
        { key: 'expression', url: '/expression_number', params: { name: name, first_name: firstName, last_name: lastName } },
        { key: 'soul_urge', url: '/soul_urge_number', params: { name: name, first_name: firstName, last_name: lastName } },
        { key: 'personality', url: '/personality_number', params: { name: name, first_name: firstName, last_name: lastName } },
        { key: 'attitude', url: '/attitude_number', params: { birth_day: day, birth_month: month } }
    ];


    try {
        console.log(`Starting aggregation for ${name} (DOB: ${dob})`);
        
        const requests = endpoints.map(endpoint => 
            axios.get(`https://${process.env.RAPIDAPI_HOST}${endpoint.url}`, {
                params: endpoint.params,
                headers: commonHeaders
            }).catch(err => {
                console.error(`Error fetching ${endpoint.key}:`, err.response ? err.response.data : err.message);
                return { data: { error: 'Not available' } }; // Fail gracefully for individual endpoints
            })
        );

        const responses = await Promise.all(requests);
        
        const combinedData = {};
        responses.forEach((res, index) => {
            combinedData[endpoints[index].key] = res.data;
        });

        console.log('Combined Numerology Data:', JSON.stringify(combinedData, null, 2));
        return combinedData;

    } catch (error) {
        console.error('RapidAPI Aggregation Error:', error.message);
        throw new Error('Failed to fetch complete numerology report');
    }
};



module.exports = { getNumerologyReport };
