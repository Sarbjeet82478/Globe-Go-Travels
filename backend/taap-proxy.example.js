/**
 * Example backend shape only.
 * Replace the placeholder supplier call with your approved Expedia TAAP,
 * Expedia Group Rapid API, booking engine, GDS, or NDC integration.
 */

const http = require("node:http");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const net = require("node:net");
const path = require("node:path");
const tls = require("node:tls");

const rootDir = path.resolve(__dirname, "..");

const loadEnvFile = (filePath) => {
  if (!fsSync.existsSync(filePath)) return;

  const lines = fsSync.readFileSync(filePath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

loadEnvFile(path.resolve(__dirname, ".env"));

const port = Number(process.env.PORT || 8787);
const leadsDir = path.resolve(__dirname, "leads");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const supplierStatus = () => ({
  mode: process.env.EXPEDIA_TAAP_MODE || "not_configured",
  taapCredentialsConfigured: Boolean(process.env.EXPEDIA_TAAP_USERNAME && process.env.EXPEDIA_TAAP_PASSWORD),
  rapidCredentialsConfigured: Boolean(process.env.EXPEDIA_RAPID_API_KEY && process.env.EXPEDIA_RAPID_SHARED_SECRET),
  baseUrlConfigured: Boolean(process.env.EXPEDIA_RAPID_BASE_URL)
});

const chatSystemPrompt = `
You are the Globe Go Travels website assistant.
Business: Globe Go Travels, an online travel agency serving Canadian travellers.
Services: flights, hotels, all-inclusive vacation packages, cruises, car rentals, honeymoon travel, family vacations, holiday travel, food and wine trips, custom travel planning, and affordable travel deals.
Operational reality: bookings are handled manually by the agency owner for now. Do not pretend live Expedia/TAAP booking is available.
Style: concise, friendly, professional, and practical.
Rules:
- Ask for useful quote details: departure city, destination, travel dates, adults, children, budget, trip type, hotel rating, and special requests.
- Do not guarantee prices, availability, refunds, visa approval, entry rules, baggage rules, or schedule changes.
- Tell customers prices and availability must be confirmed before booking.
- Encourage urgent customers to continue on WhatsApp or request a quote.
- Do not ask for credit card numbers, passport numbers, or highly sensitive personal data in chat.
`;

const fallbackChatReply = (message) => {
  const text = String(message || "").toLowerCase();

  if (text.includes("flight") || text.includes("ticket")) {
    return "I can help with flight quote details. Please share your departure city, destination, travel dates, number of passengers, preferred airline if any, and budget. Globe Go Travels will manually verify routes, baggage, fare rules, and availability before booking.";
  }

  if (text.includes("hotel") || text.includes("resort")) {
    return "For hotels, please share the destination, check-in and check-out dates, number of rooms, guests, preferred hotel rating, and budget. We can shortlist options and confirm final price and availability manually.";
  }

  if (text.includes("package") || text.includes("all-inclusive") || text.includes("vacation")) {
    return "For vacation packages, please send your departure city, destination, dates, number of adults and children, preferred resort rating, and budget. Prices change often, so Globe Go Travels will confirm availability before booking.";
  }

  if (text.includes("cruise")) {
    return "For cruises, please share your preferred destination, sailing month, number of travellers, cabin preference, and budget. We can compare cruise options and help with flights or hotels before and after sailing.";
  }

  if (text.includes("honeymoon")) {
    return "For honeymoon travel, please share destination ideas, travel dates, budget, preferred resort style, and any special requests. We can help build a romantic package and confirm details manually.";
  }

  if (text.includes("car")) {
    return "For car rentals, please share pickup city or airport, pickup and drop-off dates, driver age, vehicle type, and whether you need airport pickup. We will confirm rental rules and availability manually.";
  }

  return "I can help you prepare a travel quote request. Please share your departure city, destination, travel dates, number of adults and children, trip type, budget, and any special requests. For faster manual help, continue through WhatsApp when available.";
};

const normalizePhone = (value) => String(value || "").replace(/\D/g, "");

const publicChatConfig = () => {
  const whatsappNumber = normalizePhone(process.env.WHATSAPP_BUSINESS_NUMBER);

  return {
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    whatsappEnabled: Boolean(whatsappNumber),
    whatsappNumber,
    whatsappCloudConfigured: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN)
  };
};

const buildWhatsAppUrl = (text) => {
  const { whatsappNumber } = publicChatConfig();
  if (!whatsappNumber) return null;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
};

const sendJson = (response, status, payload) => {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(payload));
};

const escapeEmailHeader = (value) => String(value || "").replace(/[\r\n]+/g, " ").trim();

const smtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const leadRecipient = () => process.env.LEAD_RECIPIENT_EMAIL || "info@globegotravels.com";

const sendSmtpEmail = ({ to, subject, text, replyTo }) => new Promise((resolve, reject) => {
  if (!smtpConfigured()) {
    reject(new Error("SMTP is not configured"));
    return;
  }

  const host = process.env.SMTP_HOST;
  const portNumber = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || portNumber === 465;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  let socket = secure
    ? tls.connect({ host, port: portNumber, servername: host })
    : net.connect({ host, port: portNumber });
  let buffer = "";
  let pending;

  const waitFor = () => new Promise((resolveLine, rejectLine) => {
    pending = { resolve: resolveLine, reject: rejectLine };
  });

  const command = async (line) => {
    socket.write(`${line}\r\n`);
    return waitFor();
  };

  const upgradeToTls = async () => new Promise((resolveUpgrade, rejectUpgrade) => {
    socket = tls.connect({ socket, servername: host }, resolveUpgrade);
    socket.once("error", rejectUpgrade);
    socket.on("data", handleData);
  });

  const handleData = (chunk) => {
    buffer += chunk.toString("utf8");
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (/^\d{3} /.test(line) && pending) {
        const current = pending;
        pending = null;
        if (/^[23]/.test(line)) {
          current.resolve(line);
        } else {
          current.reject(new Error(line));
        }
      }
    }
  };

  socket.setTimeout(12000, () => reject(new Error("SMTP timeout")));
  socket.on("data", handleData);
  socket.once("error", reject);

  (async () => {
    await waitFor();
    await command(`EHLO ${host}`);

    if (!secure) {
      await command("STARTTLS");
      await upgradeToTls();
      await command(`EHLO ${host}`);
    }

    await command("AUTH LOGIN");
    await command(Buffer.from(process.env.SMTP_USER || "").toString("base64"));
    await command(Buffer.from(process.env.SMTP_PASS || "").toString("base64"));
    await command(`MAIL FROM:<${from}>`);
    await command(`RCPT TO:<${to}>`);
    await command("DATA");

    const headers = [
      `From: Globe Go Travels <${escapeEmailHeader(from)}>`,
      `To: ${escapeEmailHeader(to)}`,
      `Subject: ${escapeEmailHeader(subject)}`,
      replyTo ? `Reply-To: ${escapeEmailHeader(replyTo)}` : "",
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8"
    ].filter(Boolean);
    const body = String(text || "").replace(/^\./gm, "..");

    socket.write(`${headers.join("\r\n")}\r\n\r\n${body}\r\n.\r\n`);
    await waitFor();
    await command("QUIT").catch(() => {});
    socket.end();
    resolve();
  })().catch((error) => {
    socket.destroy();
    reject(error);
  });
});

const formatLeadSummary = (lead) => {
  const fields = lead.fields && typeof lead.fields === "object" ? lead.fields : {};
  const lines = [
    `New Globe Go Travels lead`,
    `Lead ID: ${lead.id}`,
    `Source: ${lead.source || "website"}`,
    `Submitted: ${lead.createdAt}`,
    `Page: ${lead.pageUrl || "Not provided"}`,
    "",
    "Customer details:"
  ];

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    lines.push(`${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
  });

  if (Array.isArray(lead.chatTranscript) && lead.chatTranscript.length) {
    lines.push("", "Chat transcript:");
    lead.chatTranscript.forEach((item) => {
      lines.push(`${item.role || "message"}: ${item.content || ""}`);
    });
  }

  return lines.join("\n");
};

const saveLead = async (lead) => {
  await fs.mkdir(leadsDir, { recursive: true });
  const file = path.join(leadsDir, "submissions.jsonl");
  await fs.appendFile(file, `${JSON.stringify(lead)}\n`, "utf8");
};

const handleLeadSubmission = async (payload) => {
  const fields = payload.fields && typeof payload.fields === "object" ? payload.fields : {};
  const lead = {
    id: `GGT-${Date.now()}`,
    createdAt: new Date().toISOString(),
    source: String(payload.source || "website").slice(0, 80),
    pageUrl: String(payload.pageUrl || "").slice(0, 500),
    fields,
    chatTranscript: Array.isArray(payload.chatTranscript) ? payload.chatTranscript.slice(-12) : []
  };
  const summary = formatLeadSummary(lead);
  let emailSent = false;
  let emailError = "";

  await saveLead(lead);

  try {
    await sendSmtpEmail({
      to: leadRecipient(),
      subject: `New ${lead.source} lead - Globe Go Travels`,
      text: summary,
      replyTo: fields.email
    });
    emailSent = true;
  } catch (error) {
    emailError = error.message;
  }

  return {
    leadId: lead.id,
    stored: true,
    emailSent,
    emailConfigured: smtpConfigured(),
    emailError: emailSent ? "" : emailError
  };
};

const readBody = (request) => new Promise((resolve, reject) => {
  let body = "";
  request.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) {
      reject(new Error("Request body too large"));
      request.destroy();
    }
  });
  request.on("end", () => resolve(body));
  request.on("error", reject);
});

const searchSupplier = async ({ product, criteria }) => {
  // TODO: Call the approved supplier integration here.
  // Never put TAAP username/password or API keys in browser code.
  const configured = supplierStatus();

  return {
    product,
    criteria,
    live: false,
    supplier: configured,
    message: configured.taapCredentialsConfigured || configured.rapidCredentialsConfigured
      ? "Supplier credentials are configured on the backend. Replace the placeholder supplier call with the approved Expedia integration to return live inventory."
      : "Backend proxy is ready. Add approved supplier credentials on the backend to return live inventory.",
    results: []
  };
};

const callGemini = async ({ message, history = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const modelPath = model.startsWith("models/") ? model : `models/${model}`;

  if (!apiKey) {
    return {
      provider: "fallback",
      reply: fallbackChatReply(message)
    };
  }

  const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
  const contents = recentHistory
    .filter((item) => item && item.content)
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: String(item.content).slice(0, 1200) }]
    }));

  contents.push({
    role: "user",
    parts: [{ text: String(message).slice(0, 2000) }]
  });

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const geminiResponse = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: chatSystemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 420
      }
    })
  });

  if (!geminiResponse.ok) {
    return {
      provider: "fallback",
      reply: fallbackChatReply(message)
    };
  }

  const payload = await geminiResponse.json();
  const reply = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  return {
    provider: reply ? "gemini" : "fallback",
    reply: reply || fallbackChatReply(message)
  };
};

const sendWhatsAppMessage = async ({ to, message }) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";
  const recipient = normalizePhone(to || process.env.WHATSAPP_NOTIFY_TO);

  if (!phoneNumberId || !accessToken || !recipient) {
    return {
      sent: false,
      reason: "WhatsApp Cloud API is not configured."
    };
  }

  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipient,
      type: "text",
      text: {
        preview_url: false,
        body: String(message || "").slice(0, 3500)
      }
    })
  });

  return {
    sent: response.ok,
    status: response.status
  };
};

const sendFile = async (requestUrl, response, includeBody = true) => {
  let pathname;

  try {
    pathname = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
  } catch (_error) {
    sendJson(response, 400, { error: "Invalid request path" });
    return;
  }

  const requestedPath = path.normalize(path.join(rootDir, pathname));
  const isAllowedPath = requestedPath === rootDir || requestedPath.startsWith(`${rootDir}${path.sep}`);

  if (!isAllowedPath) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  try {
    const file = await fs.readFile(requestedPath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(requestedPath).toLowerCase()] || "application/octet-stream"
    });
    response.end(includeBody ? file : undefined);
  } catch (_error) {
    sendJson(response, 404, { error: "Not found" });
  }
};

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/taap/search") {
    try {
      const body = await readBody(request);
      const payload = body ? JSON.parse(body) : {};
      const result = await searchSupplier(payload);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, { error: "Invalid search request" });
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/taap/status") {
    sendJson(response, 200, supplierStatus());
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/chat/config") {
    sendJson(response, 200, publicChatConfig());
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/chat") {
    try {
      const body = await readBody(request);
      const payload = body ? JSON.parse(body) : {};
      const message = String(payload.message || "").trim();

      if (!message) {
        sendJson(response, 400, { error: "Message is required" });
        return;
      }

      const chatResult = await callGemini({
        message,
        history: payload.history
      });
      const whatsappText = `Hello Globe Go Travels, I need help with my trip.\n\nMy message: ${message}`;

      sendJson(response, 200, {
        ...chatResult,
        whatsappUrl: buildWhatsAppUrl(whatsappText),
        quickReplies: ["Request a quote", "Flights", "Vacation package", "Talk on WhatsApp"]
      });
    } catch (_error) {
      sendJson(response, 500, {
        provider: "fallback",
        reply: "The AI assistant is temporarily unavailable. Please request a quote or contact Globe Go Travels on WhatsApp when available."
      });
    }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/lead") {
    try {
      const body = await readBody(request);
      const payload = body ? JSON.parse(body) : {};
      const result = await handleLeadSubmission(payload);
      sendJson(response, 200, {
        message: result.emailSent
          ? "Lead summary emailed to Globe Go Travels."
          : "Lead received and stored. Email delivery will activate when SMTP is configured.",
        ...result
      });
    } catch (_error) {
      sendJson(response, 500, { error: "Unable to process lead submission" });
    }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/whatsapp/notify") {
    try {
      const body = await readBody(request);
      const payload = body ? JSON.parse(body) : {};
      const result = await sendWhatsAppMessage({
        to: payload.to,
        message: payload.message
      });

      sendJson(response, result.sent ? 200 : 400, result);
    } catch (_error) {
      sendJson(response, 500, { sent: false });
    }
    return;
  }

  if (request.method === "GET" || request.method === "HEAD") {
    await sendFile(requestUrl, response, request.method === "GET");
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`TAAP proxy example listening on http://localhost:${port}`);
});
