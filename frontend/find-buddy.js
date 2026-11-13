// ==========================================
// 1. GET CURRENT TRIP
// ==========================================

const tripInfo = document.getElementById("tripInfo");
const results = document.getElementById("results");

const outgoingPage = document.getElementById("outgoingPage");
const incomingPage = document.getElementById("incomingPage");
const connectionsPage = document.getElementById("connectionsPage");

const outgoingBtn = document.getElementById("outgoingBtn");
const incomingBtn = document.getElementById("incomingBtn");
const connectionsBtn = document.getElementById("connectionsBtn");

const incomingRequestsContainer = document.getElementById("incomingRequests");

const connectionsList = document.getElementById("connectionsList");

let trip = null;

try {
  trip = JSON.parse(localStorage.getItem("trip"));
} catch (error) {
  console.error("Could not read saved trip:", error);
}

console.log("Current Trip:", trip);

// ==========================================
// 2. TAB NAVIGATION
// ==========================================

const tabs = [
  { button: outgoingBtn, page: outgoingPage },
  { button: incomingBtn, page: incomingPage },
  { button: connectionsBtn, page: connectionsPage },
];

function showTab(selectedTab) {
  tabs.forEach((tab) => {
    if (!tab.button || !tab.page) return;

    const isActive = tab === selectedTab;

    tab.page.hidden = !isActive;

    tab.button.classList.toggle("active-tab", isActive);

    tab.button.setAttribute("aria-selected", String(isActive));
  });
}

tabs.forEach((tab) => {
  if (!tab.button || !tab.page) return;

  tab.button.addEventListener("click", () => {
    showTab(tab);
  });
});

const outgoingTab = tabs.find((tab) => tab.button === outgoingBtn);

if (outgoingTab) {
  showTab(outgoingTab);
}

// ==========================================
// 3. HANDLE MISSING TRIP
// ==========================================

if (!trip) {
  if (tripInfo) {
    tripInfo.innerHTML = `
      <p>No saved trip was found.</p>
      <p>Please return home and submit your trip details.</p>
    `;
  }

  if (results) {
    results.innerHTML = `
      <div class="empty-state">
        <h3>No Trip Available</h3>
        <p>Create a trip before searching for travel buddies.</p>
        <a href="index.html">Create a Trip</a>
      </div>
    `;
  }

  if (incomingRequestsContainer) {
    incomingRequestsContainer.innerHTML =
      "<p>No incoming requests are available.</p>";
  }

  if (connectionsList) {
    connectionsList.innerHTML = "<p>No connections are available.</p>";
  }
} else {
  // ==========================================
  // 4. DISPLAY CURRENT TRIP
  // ==========================================

  if (tripInfo) {
    tripInfo.innerHTML = `
      <p><strong>Name:</strong> ${escapeHTML(trip.name || "Not provided")}</p>
      <p><strong>From:</strong> ${escapeHTML(trip.from || "")}</p>
      <p><strong>To:</strong> ${escapeHTML(trip.to || "")}</p>
      <p><strong>Date:</strong> ${escapeHTML(trip.date || "")}</p>
      <p><strong>Time:</strong> ${escapeHTML(trip.time || "")}</p>
      <p><strong>Transport:</strong> ${escapeHTML(trip.transport || "Not selected")}</p>
    `;
  }

  // ==========================================
  // 5. REQUEST ARRAYS
  // ==========================================

  const outgoingRequests = [];
  const incomingRequests = [];
  const connections = [];

  // ==========================================
  // 6. DISPLAY INCOMING REQUESTS
  // ==========================================

  function renderIncomingRequests() {
    if (!incomingRequestsContainer) return;

    if (incomingRequests.length === 0) {
      incomingRequestsContainer.innerHTML = `
        <div class="empty-state">
          <h3>No Incoming Requests</h3>
          <p>New requests from other students will appear here.</p>
        </div>
      `;

      return;
    }

    incomingRequestsContainer.innerHTML = incomingRequests
      .map((request, index) => {
        const sender = request.senderTrip;

        if (!sender) {
          return `
            <article class="buddy-card">
              <h3>Student details unavailable</h3>
              <p>This student's trip could not be retrieved.</p>
            </article>
          `;
        }

        return `
          <article class="buddy-card">

            <h3>${escapeHTML(sender.name || "Student")}</h3>

            <p><strong>From:</strong>
              ${escapeHTML(sender.from || "")}
            </p>

            <p><strong>To:</strong>
              ${escapeHTML(sender.to || "")}
            </p>

            <p><strong>Date:</strong>
              ${escapeHTML(sender.date || "")}
            </p>

            <p><strong>Time:</strong>
              ${escapeHTML(sender.time || "")}
            </p>

            <p><strong>Transport:</strong>
              ${escapeHTML(sender.transport || "Not selected")}
            </p>

            <p><strong>Status:</strong>
              ${escapeHTML(request.status || "Pending")}
            </p>

            ${
              request.status === "Pending"
                ? `
                  <div class="request-actions">

                    <button
                      type="button"
                      class="accept-btn"
                      data-index="${index}"
                    >
                      Accept
                    </button>

                    <button
                      type="button"
                      class="reject-btn"
                      data-index="${index}"
                    >
                      Reject
                    </button>

                  </div>
                `
                : ""
            }

          </article>
        `;
      })
      .join("");
  }

  // ==========================================
  // 7. LOAD INCOMING REQUESTS
  // ==========================================

  async function loadIncomingRequests() {
    if (incomingRequestsContainer) {
      incomingRequestsContainer.innerHTML =
        "<p>Loading incoming requests...</p>";
    }

    try {
      const response = await fetch(
        `/api/requests/incoming?tripId=${encodeURIComponent(trip._id)}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load incoming requests.");
      }

      if (!Array.isArray(data.requests)) {
        throw new Error("Unexpected incoming requests response.");
      }

      incomingRequests.length = 0;
      incomingRequests.push(...data.requests);

      console.log("Incoming Requests:", incomingRequests);

      renderIncomingRequests();
    } catch (error) {
      console.error("Incoming requests error:", error);

      if (incomingRequestsContainer) {
        incomingRequestsContainer.innerHTML = `
          <div class="empty-state">
            <h3>Could Not Load Requests</h3>
            <p>${escapeHTML(error.message)}</p>
          </div>
        `;
      }

      throw error;
    }
  }

  // ==========================================
  // 8. FETCH OUTGOING REQUEST DATA
  // INTERNAL USE ONLY - NO DISPLAY
  // ==========================================

  async function fetchOutgoingRequests() {
    try {
      const response = await fetch(
        `/api/requests/outgoing?tripId=${encodeURIComponent(trip._id)}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load outgoing requests.");
      }

      if (!Array.isArray(data.requests)) {
        throw new Error("Unexpected outgoing requests response.");
      }

      outgoingRequests.length = 0;
      outgoingRequests.push(...data.requests);

      console.log("Outgoing Request Data:", outgoingRequests);
    } catch (error) {
      console.error("Outgoing requests error:", error);

      throw error;
    }
  }

  // ==========================================
  // 9. DISPLAY CONNECTIONS
  // ==========================================

  function renderConnections() {
    if (!connectionsList) return;

    if (connections.length === 0) {
      connectionsList.innerHTML = `
        <div class="empty-state">
          <h3>No Connections Yet</h3>
          <p>Accepted connections will appear here.</p>
        </div>
      `;

      return;
    }

    connectionsList.innerHTML = connections
      .map((connection) => {
        const buddy = connection.buddyTrip;

        if (!buddy) return "";

        return `
          <article class="buddy-card">

            <h3>${escapeHTML(buddy.name || "Student")}</h3>

            <p><strong>From:</strong>
              ${escapeHTML(buddy.from || "")}
            </p>

            <p><strong>To:</strong>
              ${escapeHTML(buddy.to || "")}
            </p>

            <p><strong>Date:</strong>
              ${escapeHTML(buddy.date || "")}
            </p>

            <p><strong>Time:</strong>
              ${escapeHTML(buddy.time || "")}
            </p>

            <p><strong>Transport:</strong>
              ${escapeHTML(buddy.transport || "Not selected")}
            </p>

            <p class="connection-status">Connected</p>

          </article>
        `;
      })
      .join("");
  }

  // ==========================================
  // 10. LOAD CONNECTIONS
  // ==========================================

  async function loadConnections() {
    if (connectionsList) {
      connectionsList.innerHTML = "<p>Loading connections...</p>";
    }

    try {
      const response = await fetch(
        `/api/requests/connections?tripId=${encodeURIComponent(trip._id)}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load connections.");
      }

      if (!Array.isArray(data.connections)) {
        throw new Error("Unexpected connections response.");
      }

      connections.length = 0;
      connections.push(...data.connections);

      console.log("Accepted Connections:", connections);

      renderConnections();
    } catch (error) {
      console.error("Connections error:", error);

      if (connectionsList) {
        connectionsList.innerHTML = `
          <div class="empty-state">
            <h3>Could Not Load Connections</h3>
            <p>${escapeHTML(error.message)}</p>
          </div>
        `;
      }

      throw error;
    }
  }

  // ==========================================
  // 11. ACCEPT OR REJECT REQUESTS
  // ==========================================

  if (incomingRequestsContainer) {
    incomingRequestsContainer.addEventListener("click", async (event) => {
      const acceptButton = event.target.closest(".accept-btn");
      const rejectButton = event.target.closest(".reject-btn");

      if (!acceptButton && !rejectButton) return;

      const button = acceptButton || rejectButton;

      const index = Number(button.dataset.index);

      const request = incomingRequests[index];

      if (!request || request.status !== "Pending") return;

      const action = acceptButton ? "accept" : "reject";

      try {
        button.disabled = true;
        button.textContent = "Processing...";

        const response = await fetch(`/api/requests/${request._id}/${action}`, {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            tripId: trip._id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not process request.");
        }

        alert(data.message);

        // Refresh all relevant data.
        await refreshAllData();
      } catch (error) {
        console.error(`${action} request error:`, error);

        alert(error.message);

        button.disabled = false;

        button.textContent = action === "accept" ? "Accept" : "Reject";
      }
    });
  }

  // ==========================================
  // 12. SEND CONNECT REQUEST
  // ==========================================

  async function sendRequest(button, match) {
    try {
      button.disabled = true;
      button.textContent = "Sending...";

      const response = await fetch("/api/requests/send", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          senderTrip: trip._id,
          receiverTrip: match._id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not send request.");
      }

      console.log("Request saved:", data.request);

      button.textContent = "Request Sent";

      // Refresh outgoing request data and available matches.
      await fetchOutgoingRequests();
      await loadMatches();
    } catch (error) {
      console.error("Send request error:", error);

      button.disabled = false;
      button.textContent = "Connect";

      alert(error.message);
    }
  }

  // ==========================================
  // 13. FETCH AND FILTER MATCHING TRIPS
  // ==========================================

  async function loadMatches() {
    if (!results) return;

    if (!trip._id) {
      results.innerHTML = `
        <div class="empty-state">
          <h3>Trip ID Missing</h3>
          <p>Your saved trip does not have a database ID. Please submit the trip again.</p>
        </div>
      `;

      return;
    }

    results.innerHTML = "<p>Searching for travel buddies...</p>";

    try {
      const params = new URLSearchParams({
        from: trip.from || "",
        to: trip.to || "",
        date: trip.date || "",
        time: trip.time || "",
        tripId: trip._id,
      });

      const response = await fetch(`/api/trips/matches?${params.toString()}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to find matches.");
      }

      if (!Array.isArray(data.matches)) {
        throw new Error("The server returned an unexpected response.");
      }

      console.log("Matching trips from backend:", data.matches);

      // --------------------------------------
      // FILTER ALREADY CONTACTED/CONNECTED USERS
      // --------------------------------------

      const filteredMatches = data.matches.filter((match) => {
        // 1. Exclude the current user's own trip.
        if (String(match._id) === String(trip._id)) {
          return false;
        }

        // 2. Exclude students with pending outgoing requests.
        const alreadySentRequest = outgoingRequests.some(
          (request) =>
            request.status === "Pending" &&
            String(request.receiverTrip?._id) === String(match._id),
        );

        // 3. Exclude students who sent us pending requests.
        const alreadyReceivedRequest = incomingRequests.some(
          (request) =>
            request.status === "Pending" &&
            String(request.senderTrip?._id) === String(match._id),
        );

        // 4. Exclude already connected students.
        const alreadyConnected = connections.some(
          (connection) =>
            String(connection.buddyTrip?._id) === String(match._id),
        );

        return (
          !alreadySentRequest && !alreadyReceivedRequest && !alreadyConnected
        );
      });

      console.log("Filtered Available Matches:", filteredMatches);

      // --------------------------------------
      // DISPLAY EMPTY STATE
      // --------------------------------------

      if (filteredMatches.length === 0) {
        results.innerHTML = `
          <div class="empty-state no-match">
            <h3>No Travel Buddies Found</h3>
            <p>Try another route, date, or departure time.</p>
          </div>
        `;

        return;
      }

      // --------------------------------------
      // DISPLAY AVAILABLE MATCHES
      // --------------------------------------

      results.innerHTML = filteredMatches
        .map(
          (match) => `
            <article class="buddy-card">

              <h3>${escapeHTML(match.name || "Student")}</h3>

              <p><strong>From:</strong>
                ${escapeHTML(match.from || "")}
              </p>

              <p><strong>To:</strong>
                ${escapeHTML(match.to || "")}
              </p>

              <p><strong>Date:</strong>
                ${escapeHTML(match.date || "")}
              </p>

              <p><strong>Time:</strong>
                ${escapeHTML(match.time || "")}
              </p>

              <p><strong>Transport:</strong>
                ${escapeHTML(match.transport || "Not selected")}
              </p>

              <button
                type="button"
                class="connect-btn"
                data-trip-id="${escapeHTML(match._id || "")}"
              >
                Connect
              </button>

            </article>
          `,
        )
        .join("");
    } catch (error) {
      console.error("Error loading matches:", error);

      results.innerHTML = `
        <div class="empty-state no-match">
          <h3>Could Not Load Matches</h3>
          <p>${escapeHTML(error.message || "Please try again.")}</p>
        </div>
      `;
    }
  }

  // ==========================================
  // 14. REFRESH ALL REQUEST AND CONNECTION DATA
  // ==========================================

  async function refreshAllData() {
    await Promise.all([
      loadIncomingRequests(),
      fetchOutgoingRequests(),
      loadConnections(),
    ]);

    await loadMatches();
  }

  // ==========================================
  // 15. CONNECT BUTTON EVENTS
  // ==========================================

  if (results) {
    results.addEventListener("click", (event) => {
      const button = event.target.closest(".connect-btn");

      if (!button || button.disabled) return;

      const tripId = button.dataset.tripId;

      const match = {
        _id: tripId,

        name:
          button.closest(".buddy-card")?.querySelector("h3")?.textContent ||
          "Student",
      };

      sendRequest(button, match);
    });
  }

  // ==========================================
  // 16. INITIALIZE PAGE
  // ==========================================

  async function initializePage() {
    if (!trip._id) {
      if (results) {
        results.innerHTML = `
          <div class="empty-state">
            <h3>Trip ID Missing</h3>
            <p>Please submit your trip again.</p>
          </div>
        `;
      }

      return;
    }

    try {
      await refreshAllData();

      console.log("Buddy Find initialized successfully.");
    } catch (error) {
      console.error("Page initialization error:", error);

      if (results) {
        results.innerHTML = `
          <div class="empty-state">
            <h3>Could Not Initialize Buddy Find</h3>
            <p>${escapeHTML(error.message || "Please refresh the page.")}</p>
          </div>
        `;
      }
    }
  }

  initializePage();
}

// ==========================================
// 17. HTML ESCAPING HELPER
// ==========================================

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return replacements[character];
  });
}
