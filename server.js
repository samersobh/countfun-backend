const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());

// ✅ Fix CORS to Allow Frontend Requests
app.use(cors({
    origin: "http://127.0.0.1:5500", // Adjust to your frontend's actual port if different
    methods: "GET,POST,OPTIONS",
    allowedHeaders: "Content-Type,Authorization"
}));

// ✅ Handle Preflight Requests
app.options("/api/fetch-activities", cors());

// ✅ API Route: Fetch AI-Generated Activities
app.post("/api/fetch-activities", async (req, res) => {
    const { eventName, eventLocation, countdownDays } = req.body;

    try {
        // ✅ NEW IMPROVED AI PROMPT
        const prompt = `
        I am preparing a special event: ${eventName} in ${eventLocation}.
        I have ${countdownDays} days to prepare. 
        Suggest one unique, fun, and relevant activity for each day leading up to the event. 
        The activities should fit both the event type and location. 
        Be detailed, practical, and creative. Ensure that no activities repeat. 
        Format the response as a numbered list with each day's idea.`;

        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an expert event planner providing tailored event preparation ideas." },
                { role: "user", content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.9
        }, {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        // ✅ Extract AI Response into an Array
        let activities = response.data.choices[0].message.content
            .split("\n") // Split by new lines
            .map(line => line.replace(/^\d+\.\s*/, "").trim()) // Remove numbering & trim spaces
            .filter(line => line.length > 0); // Remove empty lines

        // ✅ If AI returned fewer activities than needed, fill the missing ones
        while (activities.length < countdownDays) {
            activities.push("📝 Plan your own activity for this day!");
        }

        res.json({ activities });
    } catch (error) {
        console.error("AI Fetch Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to fetch activity ideas" });
    }
});

// ✅ Start Server on Correct Port
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
