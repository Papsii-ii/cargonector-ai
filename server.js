import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.CARGONECTOR_SITE_URL;

if (!OPENROUTER_API_KEY) {
    console.error("Missing OPENROUTER_API_KEY environment variable.");
}

if (!SITE_URL) {
    console.error("Missing CARGONECTOR_SITE_URL environment variable.");
}

function findTrackingNumber(message) {
    const match = message.match(/CNX-\d{4}-\d{4}/i);
    return match ? match[0].toUpperCase() : null;
}

async function getShipment(reference) {
    if (!SITE_URL) return null;

    const response = await fetch(`${SITE_URL}/tracking_api.php?reference=${reference}`);
    const text = await response.text();

    console.log("Tracking API status:", response.status);
    console.log("Tracking API response:", text);

    return JSON.parse(text);
}

app.get("/", (req, res) => {
    res.send("CargoNector AI is running.");
});

app.post("/chat", async (req, res) => {
    const message = req.body.message || "";

    if (!message.trim()) {
        return res.json({
            reply: "Please type a message."
        });
    }

    const trackingNumber = findTrackingNumber(message);

    if (trackingNumber) {
        try {
            const shipment = await getShipment(trackingNumber);

            if (!shipment || shipment.error) {
                return res.json({
                    reply: "I couldn't access the tracking system right now."
                });
            }

            if (!shipment.found) {
                return res.json({
                    reply: `I couldn't find shipment ${trackingNumber}. Please check the tracking number and try again.`
                });
            }

            return res.json({
                reply: `Shipment ${shipment.reference} is currently ${shipment.status}. Route: ${shipment.origin} to ${shipment.destination}. Service: ${shipment.shipment_type}. Estimated arrival: ${shipment.eta}.`
            });
        } catch (err) {
            console.error("Tracking API error:", err);

            return res.json({
                reply: "I couldn't access the tracking system right now."
            });
        }
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
                "HTTP-Referer": SITE_URL || "https://cargonectorclientportal.rf.gd",
                "X-Title": "CargoNector AI"
            },
            body: JSON.stringify({
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
- Tracking/reference numbers look like CNX-2026-1234.
- Possible statuses include Pending, Approved, In Progress, Delayed, Cancelled, and Completed.
- Do not invent shipment statuses.
- If the user gives a tracking/reference number, the system checks the database separately.

Portal Pages:
- Dashboard: shows shipment and inquiry summary.
- Profile: lets users update account details.
- Inquiries: lets users submit shipment inquiries.
- Tracking: lets users track shipment status.
- History: shows previous shipment records.
- Admin Panel: lets admins manage inquiries and update statuses.

Tone Rules:
- Keep responses short, clear, professional, and friendly.
- Answer like a company support assistant.
- Do not ask users for passwords or sensitive account information.
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
