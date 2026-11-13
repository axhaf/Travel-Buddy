require("dotenv").config();

const PORT = process.env.PORT || 3000;
const authRoutes = require("./routes/authRoutes");
const tripRoutes = require("./routes/tripRoutes");
const requestRoutes = require("./routes/requestRoutes");
const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/requests", requestRoutes);

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

async function startServer() {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
