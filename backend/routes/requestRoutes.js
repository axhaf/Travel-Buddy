const express = require("express");
const router = express.Router();

const {
    sendRequest,
    getIncomingRequests
} = require("../controllers/requestController");

// Send a connection request
router.post("/send", sendRequest);

// Get incoming requests
router.get("/incoming", getIncomingRequests);

module.exports = router;