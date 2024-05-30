const express = require("express");
const axios = require("axios");
const app = express();
const windowSize = 10;
const storedNumbers = [];
const baseUrl = "http://20.244.56.144/test";
const fetchNumbers = async (numberType) => {
    try {
        const response = await axios.get(baseUrl + "/" + numberType, {
            timeout: 500,
            headers: {
                Authorization:
                    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzE3MDc4NzI4LCJpYXQiOjE3MTcwNzg0MjgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6Ijk0OWQxN2FkLWM0YzItNDhjNy1iZGVkLThjMjBjMzI0YjY4OSIsInN1YiI6Imtvb3N1cnV2YXJkaGluaUBnbWFpbC5jb20ifSwiY29tcGFueU5hbWUiOiJteUNvbXBhbnkiLCJjbGllbnRJRCI6Ijk0OWQxN2FkLWM0YzItNDhjNy1iZGVkLThjMjBjMzI0YjY4OSIsImNsaWVudFNlY3JldCI6IlpVUHlCdklHb2VoRGplRFQiLCJvd25lck5hbWUiOiJLb29zdXJ1IFZhcmRoaW5pIiwib3duZXJFbWFpbCI6Imtvb3N1cnV2YXJkaGluaUBnbWFpbC5jb20iLCJyb2xsTm8iOiIyMUJEMUExMjI5In0.mpQNJiWwmkpls0f8wWS77oR4H0akHBs1ITp2m01NUxE",
            },
        });
        console.log("Response:", response.data);
        const numbers = response.data.numbers;
        return numbers.filter((num) => !storedNumbers.includes(num));
    } catch (error) {
        console.error("Error fetching numbers:", error);
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

    let newNumbers = [];
    if (numberId === "p") {
        newNumbers = await fetchNumbers("primes");
    } else if (numberId === "f") {
        newNumbers = await fetchNumbers("fibo");
    } else if (numberId === "e") {
        newNumbers = await fetchNumbers("even");
    }
     else if (numberId === "r") {
        newNumbers = await fetchNumbers("rand");
    } else {
        return res.status(400).json({ error: "Invalid number ID" });
    }

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
    console.log("Server is running on port " + PORT);
});