// Front-end business feature prototypes. These keep data in the browser until real integrations are added.
(function () {
  const sampleDeals = [
    {
      destination: "Mexico",
      type: "All-Inclusive",
      price: "CA$899",
      summary: "Beach resort package with flight and hotel options.",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    },
    {
      destination: "Caribbean",
      type: "Cruise",
      price: "CA$1,299",
      summary: "Cruise itinerary with flexible cabin choices.",
      image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80"
    },
    {
      destination: "Dubai",
      type: "Hotel + Flight",
      price: "CA$1,499",
      summary: "Premium city break with hotel and transfer planning.",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80"
    },
    {
      destination: "Europe",
      type: "Custom Trip",
      price: "CA$1,599",
      summary: "Multi-city travel planning for flights, hotels, and rail.",
      image: "https://images.unsplash.com/photo-1486297678162-eb2a19b8ce71?auto=format&fit=crop&w=1200&q=80"
    },
    {
      destination: "Hawaii",
      type: "Honeymoon",
      price: "CA$1,699",
      summary: "Romantic island package with resort options.",
      image: "https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&w=1200&q=80"
    },
    {
      destination: "India",
      type: "Flight Only",
      price: "Quote",
      summary: "Flexible airfare support for family and long-haul travel.",
      image: "https://images.unsplash.com/photo-1513415564515-763d91423bdd?auto=format&fit=crop&w=1200&q=80"
    }
  ];

  const renderDeals = () => {
    const target = document.querySelector("[data-deal-database]");
    if (!target) return;

    const destinationFilter = document.querySelector("[data-deal-destination]");
    const typeFilter = document.querySelector("[data-deal-type]");
    const destinationValue = destinationFilter instanceof HTMLSelectElement ? destinationFilter.value : "";
    const typeValue = typeFilter instanceof HTMLSelectElement ? typeFilter.value : "";

    const filteredDeals = sampleDeals.filter((deal) => {
      const destinationMatch = !destinationValue || deal.destination === destinationValue;
      const typeMatch = !typeValue || deal.type === typeValue;
      return destinationMatch && typeMatch;
    });

    target.innerHTML = filteredDeals.map((deal) => `
      <article class="deal-card" data-reveal>
        <img class="deal-image" src="${deal.image}" alt="${deal.destination} ${deal.type} travel deal" />
        <h3 class="deal-title">${deal.destination} ${deal.type}</h3>
        <p>${deal.summary}</p>
        <span class="deal-price">Starting from ${deal.price}</span>
        <div style="margin-top: 1rem;">
          <a class="btn btn-secondary" href="request-a-quote.html">Request This Deal</a>
        </div>
      </article>
    `).join("");
  };

  document.querySelectorAll("[data-deal-destination], [data-deal-type]").forEach((control) => {
    control.addEventListener("change", renderDeals);
  });
  renderDeals();

  document.querySelectorAll("[data-business-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = form.querySelector("[data-business-message]");
      if (message) {
        message.textContent = form.getAttribute("data-success-message") || "Your request has been saved as a front-end demo. Connect a backend to process it live.";
        message.classList.add("show");
      }
      form.reset();
    });
  });

  const pnrForm = document.querySelector("[data-pnr-form]");
  if (pnrForm) {
    pnrForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const result = document.querySelector("[data-pnr-result]");
      if (result) {
        result.innerHTML = `
          <strong>PNR lookup demo ready.</strong>
          <p>This front-end form is prepared for a future airline, GDS, or booking engine connection. No live reservation data is retrieved yet.</p>
        `;
        result.classList.add("show");
      }
    });
  }
})();

