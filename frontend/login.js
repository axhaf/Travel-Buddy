const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                phone,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Registration failed.");
            return;
        }

        alert(data.message);

        // Save only the public user details, never the password.
        localStorage.setItem("user", JSON.stringify(data.user));

        window.location.href = "index.html";

    } catch (error) {
        console.error("Registration error:", error);
        alert("Could not connect to the server. Please try again.");
    }
});