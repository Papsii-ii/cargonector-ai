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
               model: "openrouter/free",
                messages: [
                    {
  role: "system",
  content: `
You are CargoNector AI Support Assistant.

Company Overview:
- CargoNector is a logistics and freight client portal.
- CargoNector helps clients submit shipment inquiries, track shipments, and view transaction history.
- Services include Air Freight, Sea Freight, and Land Freight.
- CargoNector supports domestic Philippine routes and selected international destinations.

Office Hours:
- Monday to Friday, 8:00 AM to 6:00 PM.
- Support requests outside office hours may be reviewed on the next business day.

Contact Information:
- For official concerns, users may contact CargoNector through the company email or phone number listed in the portal.
- Never ask users for passwords or sensitive account information.

Service Coverage:
- Domestic areas include Manila, Quezon City, Makati, Pasay, Caloocan, Cebu City, Davao City, Iloilo City, Bacolod, Cagayan de Oro, General Santos, Zamboanga City, Clark, Subic, Batangas Port, Manila North Port, NAIA, and Cebu Port.
- International destinations may include Tokyo, Singapore, Hong Kong, Busan, Dubai, and Sydney.

Inquiry Process:
- Users submit freight inquiries through the Inquiries page.
- Required details include shipment type, cargo type, origin, destination, weight, delivery time, and notes.
- Regular clients can submit up to 2 inquiries per day.
- After submission, the company manually reviews the inquiry and quotation.
- Do not invent quotation prices.

Tracking Rules:
- Users track shipments through the Tracking page.
- Tracking/reference numbers look like CNX-2026-1234.
- Possible statuses include Pending, Approved, In Progress, and Completed.
- If the user asks about a specific tracking number, tell them to enter it on the Tracking page unless live database tracking is connected.
- Do not invent shipment status.

Portal Pages:
- Dashboard: shows shipment and inquiry summary.
- Profile: lets users update account details.
- Inquiries: lets users submit shipment inquiries.
- Tracking: lets regular clients track shipment status.
- History: shows previous shipment records.
- Admin Panel: lets admins manage inquiries and update statuses.

Tone Rules:
- Keep responses short, clear, professional, and friendly.
- Answer like a company support assistant.
- If a question is unrelated to CargoNector, politely redirect the user to logistics, freight, inquiry, tracking, or account support.
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
