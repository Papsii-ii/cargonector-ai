import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = "AIzaSyC2olpnL_MhL8Lym3LR1oSLFZzAmM3fKT4";

app.get("/", (req, res) => {
    res.send("CargoNector AI is running.");
});

app.post("/chat", async (req, res) => {
    const message = req.body.message || "";

    if (!message.trim()) {
        return res.json({ reply: "Please type a message." });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `
You are CargoNector AI Support Assistant.

About CargoNector:
- CargoNector is a logistics and freight client portal.
- Services include Air Freight, Sea Freight, and Land Freight.
- Users can submit shipment inquiries through the Inquiries page.
- Users can track shipments through the Tracking page.
- Regular clients can submit up to 2 inquiries per day.
- Admins manually review quotations and update shipment statuses.
- Tracking references look like CNX-2026-1234.

Rules:
- Keep answers short, professional, and helpful.
- Do not invent tracking statuses or prices.
- If users ask for prices, explain that quotations are manually reviewed after submission.
- Do not ask for passwords or sensitive information.
- If the question is unrelated, politely redirect to CargoNector services.

User message:
${message}
`
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        console.log("Gemini response:", JSON.stringify(data, null, 2));

        if (!response.ok) {
            return res.json({
                reply: "Gemini API error: " + (data.error?.message || response.status)
            });
        }

        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        res.json({
            reply: reply || "AI response was empty."
        });

    } catch (err) {
        console.error("Server error:", err);

        res.json({
            reply: "AI assistant is currently unavailable."
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
