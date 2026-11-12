const user =
JSON.parse(
    localStorage.getItem("user")
);

console.log(user);
const form = document.getElementById("travelForm");

const welcomeUser =
    document.getElementById("welcomeUser");

if (welcomeUser) {
    welcomeUser.innerHTML =
        `${user ? user.name : "Guest"} 👋`;
}

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const selectedTransport = document.querySelector(
        'input[name="transport"]:checked'
    );

    const trip = {
        name: user ? user.name : "Guest",
        from,
        to,
        date,
        time,
        transport: selectedTransport
            ? selectedTransport.value
            : "Not Selected"
    };

    console.log("Sending trip to backend:", trip);

fetch("/api/trips", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(trip)
})
.then(async response => {
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to save trip");
    }

    console.log("Trip saved successfully:", data.trip);

    // Save the trip returned by the backend, including its MongoDB _id
    localStorage.setItem("trip", JSON.stringify(data.trip));

    window.location.href = "find-buddy.html";
})
.catch(error => {
    console.error("Error saving trip:", error.message);
    alert("Could not save your trip. Please try again.");
});
});