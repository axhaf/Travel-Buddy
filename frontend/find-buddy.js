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

const incomingRequestsContainer =
    document.getElementById("incomingRequests");

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
    { button: connectionsBtn, page: connectionsPage }
];

function showTab(selectedTab) {
    tabs.forEach(tab => {
        if (!tab.button || !tab.page) return;

        const isActive = tab === selectedTab;

        tab.page.hidden = !isActive;

        tab.button.classList.toggle("active-tab", isActive);

        tab.button.setAttribute(
            "aria-selected",
            String(isActive)
        );
    });
}

tabs.forEach(tab => {
    if (!tab.button || !tab.page) return;

    tab.button.addEventListener("click", () => {
        showTab(tab);
    });
});

const outgoingTab = tabs.find(
    tab => tab.button === outgoingBtn
);

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

        incomingRequestsContainer.innerHTML =
            incomingRequests.map((request, index) => {

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

            }).join("");

        
    }


    // ==========================================
    // 7. LOAD INCOMING REQUESTS FROM MONGODB
    // ==========================================

    async function loadIncomingRequests() {

        if (!incomingRequestsContainer) return;

        if (!trip._id) {
            incomingRequestsContainer.innerHTML =
                "<p>Your trip ID is missing. Please submit your trip again.</p>";

            return;
        }

        incomingRequestsContainer.innerHTML =
            "<p>Loading incoming requests...</p>";

        try {

            const response = await fetch(
                `/api/requests/incoming?tripId=${encodeURIComponent(trip._id)}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not load incoming requests."
                );
            }

            if (!Array.isArray(data.requests)) {
                throw new Error("Unexpected response from server.");
            }

            // Update the existing array.
            incomingRequests.length = 0;
            incomingRequests.push(...data.requests);

            console.log("Incoming Requests:", data.requests);

            renderIncomingRequests();

        } catch (error) {

            console.error("Incoming requests error:", error);

            incomingRequestsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Could Not Load Requests</h3>
                    <p>${escapeHTML(error.message)}</p>
                </div>
            `;
        }
    }


    // ==========================================
    // 8. DISPLAY CONNECTIONS
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

        connectionsList.innerHTML =
            connections.map(connection => `

                <article class="buddy-card">

                    <h3>${escapeHTML(connection.name || "Student")}</h3>

                    <p><strong>From:</strong>
                        ${escapeHTML(connection.from || "")}
                    </p>

                    <p><strong>To:</strong>
                        ${escapeHTML(connection.to || "")}
                    </p>

                    <p><strong>Date:</strong>
                        ${escapeHTML(connection.date || "")}
                    </p>

                    <p><strong>Time:</strong>
                        ${escapeHTML(connection.time || "")}
                    </p>

                    <p class="connection-status">Connected</p>

                </article>

            `).join("");
    }


    // ==========================================
    // 9. ACCEPT OR REJECT REQUESTS
    // TEMPORARY FRONTEND SIMULATION
    // ==========================================

    if (incomingRequestsContainer) {

        incomingRequestsContainer.addEventListener("click", event => {

            const acceptButton = event.target.closest(".accept-btn");
            const rejectButton = event.target.closest(".reject-btn");

            if (!acceptButton && !rejectButton) return;

            const button = acceptButton || rejectButton;
            const index = Number(button.dataset.index);

            if (!Number.isInteger(index) || !incomingRequests[index]) {
                return;
            }

            const request = incomingRequests[index];

            if (request.status !== "Pending") return;

            const sender = request.senderTrip;

            if (acceptButton) {

                request.status = "Accepted";

                if (sender) {
                    connections.push({
                        name: sender.name,
                        from: sender.from,
                        to: sender.to,
                        date: sender.date,
                        time: sender.time,
                        transport: sender.transport
                    });
                }

                console.log("Request accepted:", request);

                renderConnections();

            } else {

                request.status = "Rejected";

                console.log("Request rejected:", request);
            }

            renderIncomingRequests();

        });
    }


    // ==========================================
    // 10. SEND CONNECT REQUEST TO BACKEND
    // ==========================================

    async function sendRequest(button, match) {

        try {

            button.disabled = true;
            button.textContent = "Sending...";

            const response = await fetch("/api/requests/send", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    senderTrip: trip._id,
                    receiverTrip: match._id
                })

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not send request."
                );
            }

            button.textContent = "Request Sent";

            console.log("Request saved:", data.request);

        } catch (error) {

            console.error("Send request error:", error);

            button.disabled = false;
            button.textContent = "Connect";

            alert(error.message);
        }
    }


    // ==========================================
    // 11. FETCH MATCHING TRIPS
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

        results.innerHTML =
            "<p>Searching for travel buddies...</p>";

        try {

            const params = new URLSearchParams({

                from: trip.from || "",
                to: trip.to || "",
                date: trip.date || "",
                time: trip.time || "",
                tripId: trip._id

            });

            const response = await fetch(
                `/api/trips/matches?${params.toString()}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to find matches."
                );
            }

            if (!Array.isArray(data.matches)) {
                throw new Error(
                    "The server returned an unexpected response."
                );
            }

            console.log(
                "Matching trips from backend:",
                data.matches
            );

            if (data.matches.length === 0) {

                results.innerHTML = `
                    <div class="empty-state no-match">
                        <h3>No Travel Buddies Found</h3>
                        <p>Try another route, date, or departure time.</p>
                    </div>
                `;

                return;
            }

            results.innerHTML = data.matches.map(match => `

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

            `).join("");

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
    // 12. CONNECT BUTTON EVENTS
    // ==========================================

    if (results) {

        results.addEventListener("click", event => {

            const button = event.target.closest(".connect-btn");

            if (!button || button.disabled) return;

            const tripId = button.dataset.tripId;

            const match = {
                _id: tripId,

                name: button.closest(".buddy-card")
                    ?.querySelector("h3")?.textContent || "Student"
            };

            sendRequest(button, match);
        });
    }


    // ==========================================
    // 13. INITIALIZE PAGE
    // ==========================================

    loadIncomingRequests();

    renderConnections();

    loadMatches();

}


// ==========================================
// 14. HTML ESCAPING HELPER
// ==========================================

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => {

        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[character];

    });
}