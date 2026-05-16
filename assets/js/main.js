// Shared behavior for all pages: mobile menu, nav state, form validation, and light reveal effects.
(function () {
  const body = document.body;
  const menuButton = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const yearNode = document.querySelector("[data-current-year]");

  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  // Highlight the current page in the desktop and mobile navigation.
  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const hrefPath = new URL(link.href, window.location.origin).pathname.replace(/\/+$/, "") || "/";
    if (hrefPath === currentPath || (currentPath === "/" && hrefPath === "/index.html")) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    mobileNav.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLAnchorElement) {
        mobileNav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  }

  const submitLead = async ({ source, fields }) => {
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        fields,
        pageUrl: window.location.href
      })
    });

    if (!response.ok) {
      throw new Error("Lead submission failed");
    }

    return response.json();
  };

  // Validate travel forms, then send a lead summary to the backend.
  document.querySelectorAll("[data-travel-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const message = form.querySelector("[data-form-message]");
      const submitButton = form.querySelector('button[type="submit"]');
      const requiredFields = Array.from(form.querySelectorAll("[required]"));
      let firstInvalid = null;

      requiredFields.forEach((field) => {
        if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
          field.setCustomValidity("");
          if (!field.value.trim()) {
            field.setCustomValidity("This field is required.");
            firstInvalid ||= field;
          }
        }
      });

      const emailField = form.querySelector('input[type="email"]');
      if (emailField instanceof HTMLInputElement && emailField.value && !emailField.validity.valid) {
        firstInvalid ||= emailField;
      }

      const departure = form.querySelector('input[name="departureDate"]');
      const returnDate = form.querySelector('input[name="returnDate"]');
      if (departure instanceof HTMLInputElement && returnDate instanceof HTMLInputElement && departure.value && returnDate.value) {
        const departureValue = new Date(departure.value).getTime();
        const returnValue = new Date(returnDate.value).getTime();
        if (returnValue < departureValue) {
          returnDate.setCustomValidity("Return date must be after departure date.");
          firstInvalid ||= returnDate;
        }
      }

      if (firstInvalid) {
        firstInvalid.reportValidity();
        return;
      }

      const fields = Object.fromEntries(new FormData(form).entries());
      const source = form.getAttribute("data-lead-source") || document.title || "website form";

      if (submitButton) {
        submitButton.disabled = true;
      }

      if (message) {
        message.textContent = "Sending your request...";
        message.classList.add("show");
      }

      try {
        const result = await submitLead({ source, fields });

        if (message) {
          message.textContent = result.emailSent
            ? "Thank you! Globe Go Travels has received your request and emailed the summary. We will contact you soon."
            : "Thank you! Globe Go Travels has received your request. We will contact you soon.";
        }

        form.reset();
      } catch (_error) {
        if (message) {
          message.textContent = "We could not send the form right now. Please contact Globe Go Travels by phone, email, or WhatsApp.";
        }
      }

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.blur();
      }
    });
  });

  // Gentle reveal effect for sections and cards as users scroll.
  const revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealItems.length) {
    revealItems.forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(18px)";
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.transition = "opacity 500ms ease, transform 500ms ease";
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });

    revealItems.forEach((item) => observer.observe(item));
  }

  // Close the mobile menu when clicking outside it.
  document.addEventListener("click", (event) => {
    if (!mobileNav || !menuButton) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    const clickedInsideHeader = body.querySelector(".site-header")?.contains(target);
    if (!clickedInsideHeader) {
      mobileNav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
})();
