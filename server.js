// ✅ Import Required Packages
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config(); // Load environment variables

// ✅ Initialize Express App
const app = express();
app.use(express.json()); // Enable JSON parsing

// ✅ Allow CORS for Frontend Requests (Change if needed)
app.use(cors({
    origin: "*", // Allow requests from any frontend
    methods: "GET, POST, OPTIONS",
    allowedHeaders: "Content-Type, Authorization"
}));

// ✅ Handle Preflight Requests (Fixes CORS Issues)
app.options("/api/fetch-activities", cors());

// ✅ API Route: Fetch AI-Generated Activities
app.post("/api/fetch-activities", async (req, res) => {
    const { eventName, eventLocation, countdownDays } = req.body;

    // ✅ Validate Inputs
    if (!eventName || !eventLocation || !countdownDays) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        // ✅ Improved AI Prompt for Better Recommendations
    const prompt = `
    You are an enthusiastic and friendly event planner. Suggest one unique and relevant activity for each of the ${countdownDays} days leading up to the event.
    Additionally, suggest 5 extra fun activities related to this event and location that can be done anytime.
    - Event: ${eventName}
    - Location: ${eventLocation}
    - Ensure activities fit the event type and location, and they can range between expert ideas and simple ideas. 
    - Format: First, list ${countdownDays} countdown ideas. Then, list 5 extra fun ideas.
    `;

        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an expert event planner providing unique event preparation ideas." },
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
            .split("\n")
            .map(line => line.replace(/^\d+\.\s*/, "").trim()) // Remove numbering & clean text
            .filter(line => line.length > 0); // Remove empty lines

        // ✅ Ensure Each Countdown Day Has an Activity
        while (activities.length < countdownDays) {
            activities.push("📝 Plan your own activity for this day!");
        }

        res.json({ activities });

    } catch (error) {
        console.error("❌ AI Fetch Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to fetch activity ideas from OpenAI" });
    }
});

// ✅ Start Server on Render (Use Port 5001 or Default to Environment Port)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
