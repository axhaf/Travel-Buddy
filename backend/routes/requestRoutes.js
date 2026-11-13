const express = require("express");
const router = express.Router();

const {
  sendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  acceptRequest,
  rejectRequest,
  getConnections,
} = require("../controllers/requestController");

// Send a connection request
router.post("/send", sendRequest);

// Get incoming requests
router.get("/incoming", getIncomingRequests);

// Get outgoing requests
router.get("/outgoing", getOutgoingRequests);

// Accept a request
router.patch("/:requestId/accept", acceptRequest);

// Reject a request
router.patch("/:requestId/reject", rejectRequest);

// Get accepted connections
router.get("/connections", getConnections);

module.exports = router;
