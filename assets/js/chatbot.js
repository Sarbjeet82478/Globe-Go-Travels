// Floating travel assistant. Gemini and WhatsApp credentials stay on the backend.
(function () {
  const messages = [
    {
      role: "assistant",
      content: "Hi, I am the Globe Go Travels assistant. I can help prepare flight, hotel, vacation package, cruise, car rental, or honeymoon quote details."
    }
  ];

  let config = {
    geminiConfigured: false,
    whatsappEnabled: false,
    whatsappNumber: ""
  };

  const quickReplies = ["Flight quote", "Vacation package", "Hotel options", "Talk on WhatsApp"];

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);

  const fallbackReply = (message) => {
    const text = message.toLowerCase();

    if (text.includes("flight")) {
      return "Please share departure city, destination, dates, number of passengers, preferred airline, and budget. Globe Go Travels will manually confirm fare rules and availability.";
    }

    if (text.includes("hotel")) {
      return "Please share destination, check-in and check-out dates, number of rooms, guests, preferred hotel rating, and budget. We will manually confirm available hotel options.";
    }

    if (text.includes("package") || text.includes("vacation") || text.includes("all-inclusive")) {
      return "Please share departure city, destination, travel dates, adults, children, resort rating, and budget. Package prices change often, so final pricing must be confirmed manually.";
    }

    if (text.includes("whatsapp")) {
      return config.whatsappEnabled
        ? "Use the WhatsApp button below to continue with Globe Go Travels for faster manual support."
        : "WhatsApp is ready in the website code, but the business WhatsApp number is not configured yet.";
    }

    return "Please share your departure city, destination, dates, number of travellers, trip type, and budget. I will help organize the details so Globe Go Travels can respond faster.";
  };

  const buildWhatsAppUrl = (message) => {
    const number = String(config.whatsappNumber || "").replace(/\D/g, "");
    if (!number) return "";

    const recent = messages
      .slice(-6)
      .map((item) => `${item.role === "assistant" ? "Assistant" : "Customer"}: ${item.content}`)
      .join("\n");
    const text = message || `Hello Globe Go Travels, I need help with my trip.\n\nChat summary:\n${recent}`;

    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  };

  const widget = document.createElement("section");
  widget.className = "chatbot-widget";
  widget.setAttribute("aria-label", "Globe Go Travels chat assistant");
  widget.innerHTML = `
    <button class="chatbot-launcher" type="button" aria-expanded="false" aria-controls="chatbot-panel">
      <span class="chatbot-launcher-icon">✈</span>
      <span>Travel Help</span>
    </button>
    <div class="chatbot-panel" id="chatbot-panel" aria-hidden="true">
      <div class="chatbot-header">
        <div>
          <strong>Globe Go Assistant</strong>
          <span data-chat-status>Manual booking support</span>
        </div>
        <button class="chatbot-close" type="button" aria-label="Close chat">×</button>
      </div>
      <div class="chatbot-messages" data-chat-messages></div>
      <div class="chatbot-quick" data-chat-quick></div>
      <form class="chatbot-form" data-chat-form>
        <label class="sr-only" for="chatbot-input">Type your travel question</label>
        <textarea id="chatbot-input" name="message" rows="2" placeholder="Ask about flights, hotels, packages..." required></textarea>
        <button class="btn btn-primary" type="submit">Send</button>
      </form>
      <a class="chatbot-whatsapp" data-chat-whatsapp href="#" target="_blank" rel="noopener">
        Continue on WhatsApp
      </a>
    </div>
  `;

  document.body.append(widget);

  const launcher = widget.querySelector(".chatbot-launcher");
  const panel = widget.querySelector(".chatbot-panel");
  const closeButton = widget.querySelector(".chatbot-close");
  const messageList = widget.querySelector("[data-chat-messages]");
  const quickWrap = widget.querySelector("[data-chat-quick]");
  const form = widget.querySelector("[data-chat-form]");
  const input = widget.querySelector("#chatbot-input");
  const status = widget.querySelector("[data-chat-status]");
  const whatsappLink = widget.querySelector("[data-chat-whatsapp]");

  const setOpen = (isOpen) => {
    widget.classList.toggle("open", isOpen);
    launcher.setAttribute("aria-expanded", String(isOpen));
    panel.setAttribute("aria-hidden", String(!isOpen));
    if (isOpen) input.focus();
  };

  const renderMessages = () => {
    messageList.innerHTML = messages.map((message) => `
      <div class="chatbot-message ${message.role === "assistant" ? "assistant" : "user"}">
        ${escapeHtml(message.content)}
      </div>
    `).join("");
    messageList.scrollTop = messageList.scrollHeight;
  };

  const renderQuickReplies = () => {
    quickWrap.innerHTML = quickReplies.map((reply) => `
      <button type="button" data-quick-reply="${escapeHtml(reply)}">${escapeHtml(reply)}</button>
    `).join("");

    quickWrap.querySelectorAll("[data-quick-reply]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.getAttribute("data-quick-reply") || "";
        input.value = value;
        form.requestSubmit();
      });
    });
  };

  const updateWhatsApp = () => {
    const url = buildWhatsAppUrl();

    if (url) {
      whatsappLink.href = url;
      whatsappLink.classList.remove("disabled");
      whatsappLink.textContent = "Continue on WhatsApp";
      return;
    }

    whatsappLink.href = "contact-us.html";
    whatsappLink.classList.add("disabled");
    whatsappLink.textContent = "WhatsApp number pending";
  };

  const submitChatSummary = () => {
    const transcript = messages
      .filter((item) => item.content && item.content !== "Typing...")
      .slice(-12);
    const customerMessages = transcript
      .filter((item) => item.role === "user")
      .map((item) => item.content);

    if (!customerMessages.length) return;

    const payload = {
      source: "Chatbot WhatsApp handoff",
      pageUrl: window.location.href,
      fields: {
        summary: customerMessages.join(" | "),
        preferredContact: "WhatsApp"
      },
      chatTranscript: transcript
    };
    const body = JSON.stringify(payload);

    if ("sendBeacon" in navigator) {
      navigator.sendBeacon("/api/lead", new Blob([body], { type: "application/json" }));
      return;
    }

    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    }).catch(() => {});
  };

  const addTyping = () => {
    messages.push({ role: "assistant", content: "Typing..." });
    renderMessages();
  };

  const replaceTyping = (reply) => {
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant" && last.content === "Typing...") {
      last.content = reply;
    } else {
      messages.push({ role: "assistant", content: reply });
    }
    renderMessages();
    updateWhatsApp();
  };

  const sendMessage = async (message) => {
    messages.push({ role: "user", content: message });
    renderMessages();
    updateWhatsApp();
    addTyping();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: messages.filter((item) => item.content !== "Typing...").slice(-8)
        })
      });

      if (!response.ok) throw new Error("Chat request failed");

      const payload = await response.json();
      replaceTyping(payload.reply || fallbackReply(message));
    } catch (_error) {
      replaceTyping(fallbackReply(message));
    }
  };

  launcher.addEventListener("click", () => setOpen(!widget.classList.contains("open")));
  closeButton.addEventListener("click", () => setOpen(false));
  whatsappLink.addEventListener("click", submitChatSummary);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    sendMessage(message);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  fetch("/api/chat/config")
    .then((response) => response.ok ? response.json() : config)
    .then((payload) => {
      config = { ...config, ...payload };
      status.textContent = config.geminiConfigured ? "Gemini powered assistant" : "Manual booking support";
      updateWhatsApp();
    })
    .catch(() => {
      updateWhatsApp();
    });

  renderMessages();
  renderQuickReplies();
  updateWhatsApp();
})();
