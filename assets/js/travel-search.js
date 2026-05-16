// Multi-product search UI. Real inventory should come from a secure backend proxy.
(function () {
  const tabs = Array.from(document.querySelectorAll("[data-search-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-search-panel]"));
  const results = document.querySelector("[data-search-results]");
  const status = document.querySelector("[data-search-status]");
  const productLabel = document.querySelector("[data-product-label]");

  if (!tabs.length || !panels.length || !results) return;

  const productCopy = {
    flights: "Flights",
    hotels: "Hotels",
    packages: "Vacation packages",
    cars: "Car rentals",
    cruises: "Cruises",
    activities: "Activities"
  };

  const locationOptions = [
    { city: "Kelowna", code: "YLW", country: "Canada", detail: "Kelowna International Airport", keywords: "okanagan british columbia bc" },
    { city: "Vancouver", code: "YVR", country: "Canada", detail: "Vancouver International Airport", keywords: "british columbia bc" },
    { city: "Victoria", code: "YYJ", country: "Canada", detail: "Victoria International Airport", keywords: "vancouver island british columbia bc" },
    { city: "Abbotsford", code: "YXX", country: "Canada", detail: "Abbotsford International Airport", keywords: "british columbia bc fraser valley" },
    { city: "Calgary", code: "YYC", country: "Canada", detail: "Calgary International Airport", keywords: "alberta" },
    { city: "Edmonton", code: "YEG", country: "Canada", detail: "Edmonton International Airport", keywords: "alberta" },
    { city: "Toronto", code: "YYZ", country: "Canada", detail: "Toronto Pearson International Airport", keywords: "ontario pearson" },
    { city: "Montreal", code: "YUL", country: "Canada", detail: "Montreal Trudeau International Airport", keywords: "quebec" },
    { city: "Ottawa", code: "YOW", country: "Canada", detail: "Ottawa International Airport", keywords: "ontario" },
    { city: "Winnipeg", code: "YWG", country: "Canada", detail: "Winnipeg Richardson International Airport", keywords: "manitoba" },
    { city: "Halifax", code: "YHZ", country: "Canada", detail: "Halifax Stanfield International Airport", keywords: "nova scotia" },
    { city: "Seattle", code: "SEA", country: "United States", detail: "Seattle-Tacoma International Airport", keywords: "washington" },
    { city: "Los Angeles", code: "LAX", country: "United States", detail: "Los Angeles International Airport", keywords: "california" },
    { city: "San Francisco", code: "SFO", country: "United States", detail: "San Francisco International Airport", keywords: "california bay area" },
    { city: "Las Vegas", code: "LAS", country: "United States", detail: "Harry Reid International Airport", keywords: "nevada" },
    { city: "Orlando", code: "MCO", country: "United States", detail: "Orlando International Airport", keywords: "florida disney family vacation" },
    { city: "Miami", code: "MIA", country: "United States", detail: "Miami International Airport", keywords: "florida cruise caribbean" },
    { city: "New York", code: "JFK", country: "United States", detail: "John F. Kennedy International Airport", keywords: "nyc new york city" },
    { city: "Chicago", code: "ORD", country: "United States", detail: "O'Hare International Airport", keywords: "illinois" },
    { city: "Honolulu", code: "HNL", country: "United States", detail: "Daniel K. Inouye International Airport", keywords: "hawaii oahu" },
    { city: "Cancun", code: "CUN", country: "Mexico", detail: "Cancun International Airport", keywords: "all inclusive mexico beach riviera maya" },
    { city: "Puerto Vallarta", code: "PVR", country: "Mexico", detail: "Puerto Vallarta International Airport", keywords: "all inclusive mexico beach" },
    { city: "Los Cabos", code: "SJD", country: "Mexico", detail: "Los Cabos International Airport", keywords: "cabo san lucas mexico beach" },
    { city: "Mexico City", code: "MEX", country: "Mexico", detail: "Mexico City International Airport", keywords: "mexico" },
    { city: "Punta Cana", code: "PUJ", country: "Dominican Republic", detail: "Punta Cana International Airport", keywords: "caribbean all inclusive beach" },
    { city: "Montego Bay", code: "MBJ", country: "Jamaica", detail: "Sangster International Airport", keywords: "caribbean all inclusive beach" },
    { city: "Varadero", code: "VRA", country: "Cuba", detail: "Juan Gualberto Gomez Airport", keywords: "caribbean all inclusive beach" },
    { city: "Nassau", code: "NAS", country: "Bahamas", detail: "Lynden Pindling International Airport", keywords: "caribbean beach cruise" },
    { city: "Delhi", code: "DEL", country: "India", detail: "Indira Gandhi International Airport", keywords: "new delhi india" },
    { city: "Mumbai", code: "BOM", country: "India", detail: "Chhatrapati Shivaji Maharaj International Airport", keywords: "bombay india" },
    { city: "Amritsar", code: "ATQ", country: "India", detail: "Sri Guru Ram Dass Jee International Airport", keywords: "punjab india" },
    { city: "Dubai", code: "DXB", country: "United Arab Emirates", detail: "Dubai International Airport", keywords: "uae middle east" },
    { city: "London", code: "LHR", country: "United Kingdom", detail: "London Heathrow Airport", keywords: "england europe" },
    { city: "Paris", code: "CDG", country: "France", detail: "Charles de Gaulle Airport", keywords: "europe honeymoon" },
    { city: "Rome", code: "FCO", country: "Italy", detail: "Leonardo da Vinci Fiumicino Airport", keywords: "europe italy honeymoon" },
    { city: "Amsterdam", code: "AMS", country: "Netherlands", detail: "Amsterdam Schiphol Airport", keywords: "europe" },
    { city: "Barcelona", code: "BCN", country: "Spain", detail: "Barcelona El Prat Airport", keywords: "europe spain cruise" },
    { city: "Athens", code: "ATH", country: "Greece", detail: "Athens International Airport", keywords: "europe greece cruise honeymoon" },
    { city: "Tokyo", code: "HND", country: "Japan", detail: "Tokyo Haneda Airport", keywords: "japan asia" },
    { city: "Bangkok", code: "BKK", country: "Thailand", detail: "Suvarnabhumi Airport", keywords: "thailand asia honeymoon" },
    { city: "Singapore", code: "SIN", country: "Singapore", detail: "Singapore Changi Airport", keywords: "asia cruise" },
    { city: "Sydney", code: "SYD", country: "Australia", detail: "Sydney Kingsford Smith Airport", keywords: "australia" },
    { city: "Auckland", code: "AKL", country: "New Zealand", detail: "Auckland Airport", keywords: "new zealand" },
    { city: "Caribbean", code: "", country: "Region", detail: "Popular cruise and all-inclusive region", keywords: "cruise beach mexico jamaica dominican bahamas" },
    { city: "Alaska", code: "", country: "Region", detail: "Popular cruise region", keywords: "cruise glacier north america" },
    { city: "Mediterranean", code: "", country: "Region", detail: "Popular Europe cruise region", keywords: "cruise europe greece italy spain" },
    { city: "Europe", code: "", country: "Region", detail: "Multi-city Europe travel", keywords: "london paris rome amsterdam barcelona" }
  ];

  const sampleResults = {
    flights: [
      {
        title: "Air Canada | Flexible Round Trip",
        subtitle: "YVR to DEL with one connection. Includes carry-on and agent fare review.",
        price: "CA$1,248",
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80",
        meta: ["1 stop", "Economy", "Refundable options"]
      },
      {
        title: "WestJet + Partner Airline",
        subtitle: "Canada departure with strong connection timing and baggage comparison.",
        price: "CA$978",
        image: "https://images.unsplash.com/photo-1540339832862-474599807836?auto=format&fit=crop&w=900&q=80",
        meta: ["Best value", "Baggage extra", "Quote required"]
      }
    ],
    hotels: [
      {
        title: "Oceanfront Resort Collection",
        subtitle: "Beachfront hotels with breakfast, pool, family rooms, and flexible rates.",
        price: "CA$189/night",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
        meta: ["4 star", "Breakfast", "Beachfront"]
      },
      {
        title: "City Centre Hotel Options",
        subtitle: "Urban hotel shortlist near shopping, dining, transit, and business areas.",
        price: "CA$149/night",
        image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
        meta: ["Central", "Free Wi-Fi", "Pay later options"]
      }
    ],
    packages: [
      {
        title: "Mexico All-Inclusive Package",
        subtitle: "Flight, resort, transfers, and checked-bag review for sun vacations.",
        price: "CA$1,099",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
        meta: ["Flight + Hotel", "Transfers", "Family friendly"]
      },
      {
        title: "Dubai Flight + Hotel Escape",
        subtitle: "Premium city package with hotel location and stopover planning.",
        price: "CA$1,499",
        image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80",
        meta: ["Luxury", "Transfers", "Custom quote"]
      }
    ],
    cars: [
      {
        title: "Compact Airport Rental",
        subtitle: "Efficient vehicle for city travel, airport pickup, and short stays.",
        price: "CA$49/day",
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
        meta: ["Unlimited km options", "Airport pickup", "Insurance review"]
      },
      {
        title: "SUV Family Rental",
        subtitle: "More room for luggage, children, ski gear, or road-trip comfort.",
        price: "CA$88/day",
        image: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80",
        meta: ["Family size", "Automatic", "Quote required"]
      }
    ],
    cruises: [
      {
        title: "Caribbean 7-Night Cruise",
        subtitle: "Balcony and ocean-view cabins with itinerary and port guidance.",
        price: "CA$1,299",
        image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=900&q=80",
        meta: ["7 nights", "Balcony options", "Taxes extra"]
      },
      {
        title: "Mediterranean Cruise Search",
        subtitle: "Compare ports, cabin types, pre-cruise hotels, and flight add-ons.",
        price: "CA$1,899",
        image: "https://images.unsplash.com/photo-1508433957232-3107f5fd5993?auto=format&fit=crop&w=900&q=80",
        meta: ["Europe", "Flight add-on", "Custom quote"]
      }
    ],
    activities: [
      {
        title: "Food and Wine Experience",
        subtitle: "Tastings, local guides, transfers, and custom travel planning.",
        price: "CA$129",
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
        meta: ["Guided", "Small group", "Flexible dates"]
      },
      {
        title: "City Tour and Transfers",
        subtitle: "Private or shared tours that can be added to hotels and packages.",
        price: "CA$89",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
        meta: ["Transfers", "Family friendly", "Add-on"]
      }
    ]
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);

  const normalizeText = (value) => String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const formatLocationValue = (option) => option.code ? `${option.city} (${option.code})` : option.city;

  const getLocationMatches = (query) => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return [];

    const queryParts = normalizedQuery.split(" ").filter(Boolean);

    return locationOptions
      .map((option, index) => {
        const normalizedCode = normalizeText(option.code);
        const normalizedCity = normalizeText(option.city);
        const searchText = normalizeText(`${option.city} ${option.code} ${option.country} ${option.detail} ${option.keywords}`);
        const includesAllParts = queryParts.every((part) => searchText.includes(part));

        if (!includesAllParts) return null;

        const score = normalizedCode === normalizedQuery
          ? 0
          : normalizedCode.startsWith(normalizedQuery)
            ? 1
            : normalizedCity.startsWith(normalizedQuery)
              ? 2
              : searchText.includes(` ${normalizedQuery}`)
                ? 3
                : 4;

        return { ...option, score, index };
      })
      .filter(Boolean)
      .sort((first, second) => first.score - second.score || first.index - second.index)
      .slice(0, 8);
  };

  const setupLocationAutocomplete = () => {
    document.querySelectorAll("[data-location-autocomplete]").forEach((input, inputIndex) => {
      const field = input.closest(".field");
      if (!field) return;

      const list = document.createElement("div");
      const listId = `location-suggestions-${input.id || inputIndex}`;
      let matches = [];
      let activeIndex = -1;

      list.id = listId;
      list.className = "autocomplete-list";
      list.setAttribute("role", "listbox");

      input.setAttribute("aria-autocomplete", "list");
      input.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-controls", listId);

      field.append(list);

      const closeList = () => {
        activeIndex = -1;
        list.classList.remove("show");
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
      };

      const setActiveOption = (nextIndex) => {
        const options = Array.from(list.querySelectorAll("[data-location-index]"));
        if (!options.length) return;

        activeIndex = (nextIndex + options.length) % options.length;
        options.forEach((option, optionIndex) => {
          const isActive = optionIndex === activeIndex;
          option.classList.toggle("active", isActive);
          option.setAttribute("aria-selected", String(isActive));
        });
        input.setAttribute("aria-activedescendant", options[activeIndex].id);
      };

      const selectOption = (option) => {
        input.value = formatLocationValue(option);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        closeList();
      };

      const renderList = () => {
        matches = getLocationMatches(input.value);
        activeIndex = -1;

        if (!matches.length) {
          closeList();
          return;
        }

        list.innerHTML = matches.map((option, optionIndex) => `
          <button
            class="autocomplete-option"
            id="${listId}-option-${optionIndex}"
            type="button"
            role="option"
            data-location-index="${optionIndex}"
            aria-selected="false"
          >
            <span class="autocomplete-main">
              <span class="autocomplete-city">${escapeHtml(option.city)}</span>
              <span class="autocomplete-detail">${escapeHtml(option.detail)} · ${escapeHtml(option.country)}</span>
            </span>
            ${option.code ? `<span class="autocomplete-code">${escapeHtml(option.code)}</span>` : ""}
          </button>
        `).join("");

        list.querySelectorAll("[data-location-index]").forEach((button) => {
          button.addEventListener("mousedown", (event) => event.preventDefault());
          button.addEventListener("click", () => {
            selectOption(matches[Number(button.getAttribute("data-location-index"))]);
          });
        });

        list.classList.add("show");
        input.setAttribute("aria-expanded", "true");
      };

      input.addEventListener("input", renderList);
      input.addEventListener("focus", () => {
        if (input.value.trim()) renderList();
      });
      input.addEventListener("blur", () => {
        window.setTimeout(closeList, 120);
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeList();
          return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (!list.classList.contains("show")) {
            renderList();
          }

          if (!matches.length) return;

          setActiveOption(event.key === "ArrowDown" ? activeIndex + 1 : activeIndex - 1);
          return;
        }

        if (event.key === "Enter" && activeIndex >= 0 && matches[activeIndex]) {
          event.preventDefault();
          selectOption(matches[activeIndex]);
        }
      });
    });
  };

  const setActiveProduct = (product) => {
    tabs.forEach((tab) => {
      const isActive = tab.getAttribute("data-search-tab") === product;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach((panel) => {
      panel.classList.toggle("active", panel.getAttribute("data-search-panel") === product);
    });

    if (productLabel) {
      productLabel.textContent = productCopy[product] || "Travel";
    }

    renderResults(product);
  };

  const renderResults = (product, suppliedItems) => {
    const items = Array.isArray(suppliedItems) && suppliedItems.length
      ? suppliedItems
      : sampleResults[product] || sampleResults.flights;
    const defaultImage = (sampleResults[product] || sampleResults.flights)[0].image;

    results.innerHTML = items.map((item) => `
      <article class="result-card">
        <img class="result-thumb" src="${escapeHtml(item.image || defaultImage)}" alt="${escapeHtml(item.title || "Travel option")}" />
        <div>
          <h3 class="result-title">${escapeHtml(item.title || "Travel option")}</h3>
          <p class="card-meta">${escapeHtml(item.subtitle || "Live supplier option returned by the backend search API.")}</p>
          <div class="result-meta">${(item.meta || []).map((meta) => `<span>${escapeHtml(meta)}</span>`).join("")}</div>
        </div>
        <div class="result-price">
          <span class="muted">${suppliedItems ? "Live from" : "Sample from"}</span>
          <strong>${escapeHtml(item.price || "Quote required")}</strong>
          <a class="btn btn-primary" href="request-a-quote.html">Request Booking</a>
        </div>
      </article>
    `).join("");
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const product = tab.getAttribute("data-search-tab") || "flights";
      const url = new URL(window.location.href);
      url.searchParams.set("service", product);
      window.history.replaceState({}, "", url);
      setActiveProduct(product);
    });
  });

  document.querySelectorAll("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const product = form.getAttribute("data-product") || "travel";
      const formData = Object.fromEntries(new FormData(form).entries());

      if (status) {
        status.textContent = "Searching live TAAP inventory requires the secure backend proxy. Showing sample results for now.";
        status.classList.add("show");
      }

      try {
        const response = await fetch("/api/taap/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product, criteria: formData })
        });

        if (response.ok) {
          const payload = await response.json();

          if (Array.isArray(payload.results) && payload.results.length) {
            if (status) {
              status.textContent = "Live supplier results loaded. Final pricing, taxes, and rules must be verified before booking.";
            }
            renderResults(product, payload.results);
            results.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
          }

          if (status && payload.message) {
            status.textContent = `${payload.message} Showing sample results for now.`;
          }
        }
      } catch (_error) {
        // Expected on static hosting until a backend is connected.
      }

      renderResults(product);
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  setupLocationAutocomplete();

  const requestedProduct = new URLSearchParams(window.location.search).get("service") || "flights";
  setActiveProduct(productCopy[requestedProduct] ? requestedProduct : "flights");
})();
