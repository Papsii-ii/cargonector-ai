const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {

    const message = req.body.message || "";

    try {

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": "Bearer AIzaSyC2olpnL_MhL8Lym3LR1oSLFZzAmM3fKT4",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "mistralai/mistral-7b-instruct",
                    messages: [
                        {
                            role: "system",
                            content: `
You are CargoNector AI.

You help users with:
- freight shipping
- cargo tracking
- logistics
- inquiries
- account support

CargoNector services:
- Air Freight
- Sea Freight
- Land Freight
- Domestic & International Shipping

Keep responses short, professional, and helpful.
`
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        const reply =
            data.choices?.[0]?.message?.content ||
            "Sorry, I couldn't process that.";

        res.json({ reply });

    } catch (err) {

        console.error(err);

        res.json({
            reply: "AI assistant is currently unavailable."
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
