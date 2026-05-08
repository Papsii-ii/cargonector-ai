import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    console.error("Missing OPENROUTER_API_KEY environment variable.");
}

app.get("/", (req, res) => {
    res.send("Cargonector AI is running.");
});

app.post("/chat", async (req, res) => {
    const message = req.body.message || "";

    if (!message.trim()) {
        return res.json({
            reply: "Please type a message."
        });
    }

    if (!OPENROUTER_API_KEY) {
        return res.json({
            reply: "AI assistant is not configured yet."
        });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://cargonectorclientportal.rf.gd",
                "X-Title": "Cargonector AI"
            },
            body: JSON.stringify({
               model: "google/gemma-2-9b-it:free",
                messages: [
                    {
                        role: "system",
                        content: `
You are Cargonector AI Support Assistant.

About Cargonector:
- Cargonector is a logistics and freight client portal.
- Services include Air Freight, Sea Freight, and Land Freight.
- Users can submit shipment inquiries through the Inquiries page.
- Users can track shipments through the Tracking page.
- Users can view transaction history through the History page.
- Regular clients can submit up to 2 inquiries per day.
- Admins manually review quotations and update shipment statuses.
- Tracking references look like CNX-2026-1234.
- Quotations are manually reviewed by the company after submission.

Portal pages:
- Dashboard: shows shipment and inquiry summaries.
- Profile: lets users update account details.
- Inquiries: lets users submit freight inquiries.
- Tracking: lets users track shipment status.
- History: shows previous transactions.
- Admin Panel: lets admins manage inquiries and shipment statuses.

Rules:
- Keep answers short, professional, and helpful.
- Answer like a customer support assistant.
- Do not invent shipment prices.
- Do not invent tracking statuses.
- Do not ask for passwords or sensitive account information.
- If the user asks for exact quotation pricing, tell them to submit an inquiry and wait for manual review.
- If the question is unrelated to CargoNector, politely redirect them to logistics, freight, tracking, or account support.
`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            })
        });

        const data = await response.json();

        console.log("OpenRouter response:", JSON.stringify(data, null, 2));

        if (!response.ok) {
            return res.json({
                reply: "AI assistant error: " + (data.error?.message || response.status)
            });
        }

        const reply = data?.choices?.[0]?.message?.content;

        return res.json({
            reply: reply || "Sorry, I couldn't process that."
        });

    } catch (err) {
        console.error("Server error:", err);

        return res.json({
            reply: "AI assistant is currently unavailable."
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
