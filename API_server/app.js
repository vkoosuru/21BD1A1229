const express = require("express");
const axios = require("axios");
require('dotenv').config();
 
const app = express();
 
const access_token_url = "http://20.244.56.144/test/auth/";
 
const payload = {
    companyName: process.env.COMPANY_NAME,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    ownerName: process.env.OWNER_NAME,
    ownerEmail: process.env.OWNER_EMAIL,
    rollNo: process.env.ROLL_NO
  };
 
let accessToken = null;
let expiresAt = null;
 
const fetchAccessToken = async () => {
    try {
        const response = await axios.post(access_token_url, payload);
 
        if (response.status === 200) {
            const data = response.data;
            accessToken = `${data.token_type} ${data.access_token}`;
            expiresAt = data.expires_in * 1000;
 
            console.log(`Access Token: ${accessToken}`);
            console.log(`Expires In: ${data.expires_in} seconds`);
        } else {
            console.error(`Error: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error fetching access token:", error);
    }
};
 
const getAccessToken = async () => {
    if (!accessToken || Date.now() >= expiresAt) {
        await fetchAccessToken();
    }
    return accessToken;
};
 
const windowSize = 10;
const storedNumbers = [];
const baseUrl = "http://20.244.56.144/test";
 
const numberTypeMap = {
    p: "primes",
    f: "fibo",
    e: "even",
    r: "rand",
};
 
const fetchNumbers = async (numberType) => {
    try {
        const authToken = await getAccessToken();
        const response = await axios.get(`${baseUrl}/${numberType}`, {
            timeout: 500,
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
 
        const numbers = response.data.numbers;
        return numbers.filter((num) => !storedNumbers.includes(num));
    } catch (error) {
        // console.error("Error fetching numbers:", error);
        return [];
    }
};
 
const calculateAverage = (numbers) => {
    if (numbers.length === 0) {
        return 0;
    }
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};
 
app.get("/numbers/:numberId", async (req, res) => {
    const startTime = new Date().getTime();
    const numberId = req.params.numberId;
    const numberType = numberTypeMap[numberId];
 
    if (!numberType) {
        return res.status(400).json({ error: "Invalid number ID" });
    }
 
    const newNumbers = await fetchNumbers(numberType);
 
    const oldStoredNumbers = [...storedNumbers];
    storedNumbers.push(...newNumbers);
 
    if (storedNumbers.length > windowSize) {
        storedNumbers.splice(0, storedNumbers.length - windowSize);
    }
 
    const avg = calculateAverage(storedNumbers);
    const windowPrevState = oldStoredNumbers;
    const windowCurrState = storedNumbers;
 
    const response = {
        windowPrevState,
        windowCurrState,
        numbers: newNumbers,
        avg,
    };
 
    const endTime = new Date().getTime();
    const elapsedTime = endTime - startTime;
 
    if (elapsedTime > 500) {
        return res.status(500).json({ error: "Request took too long" });
    }
 
    res.json(response);
});
 
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});