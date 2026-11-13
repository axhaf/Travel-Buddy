const mongoose = require("mongoose");
const Request = require("../models/Requests");
const Trip = require("../models/Trip");

// 1. SEND CONNECTION REQUEST
async function sendRequest(req, res) {
  try {
    const { senderTrip, receiverTrip } = req.body;

    // Validate IDs
    if (
      !mongoose.isValidObjectId(senderTrip) ||
      !mongoose.isValidObjectId(receiverTrip)
    ) {
      return res.status(400).json({
        message: "Valid sender and receiver trip IDs are required.",
      });
    }

    // Prevent sending a request to your own trip
    if (senderTrip === receiverTrip) {
      return res.status(400).json({
        message: "You cannot send a request to your own trip.",
      });
    }

    // Check whether both trips exist
    const [sender, receiver] = await Promise.all([
      Trip.findById(senderTrip),
      Trip.findById(receiverTrip),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({
        message: "One or both trips could not be found.",
      });
    }

    // Check for an existing request
    const existingRequest = await Request.findOne({
      senderTrip,
      receiverTrip,
    });

    if (existingRequest) {
      return res.status(409).json({
        message: "A request has already been sent for this trip.",
        request: existingRequest,
      });
    }

    const request = await Request.create({
      senderTrip,
      receiverTrip,
    });

    return res.status(201).json({
      message: "Connection request sent successfully!",
      request,
    });
  } catch (error) {
    // Handles duplicate-key errors, including simultaneous requests
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A request has already been sent for this trip.",
      });
    }

    console.error("Send request error:", error.message);

    return res.status(500).json({
      message: "Could not send connection request.",
    });
  }
}

// 2. GET INCOMING REQUESTS
async function getIncomingRequests(req, res) {
  try {
    const { tripId } = req.query;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({
        message: "A valid trip ID is required.",
      });
    }

    const requests = await Request.find({
      receiverTrip: tripId,
      status: "Pending",
    })
      .populate("senderTrip", "name from to date time transport")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Incoming requests error:", error.message);

    return res.status(500).json({
      message: "Could not retrieve incoming requests.",
    });
  }
}

// 3. ACCEPT A CONNECTION REQUEST
async function acceptRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { tripId } = req.body;

    if (
      !mongoose.isValidObjectId(requestId) ||
      !mongoose.isValidObjectId(tripId)
    ) {
      return res.status(400).json({
        message: "Valid request ID and trip ID are required.",
      });
    }

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Connection request not found.",
      });
    }

    // Only the receiver of the request can accept it
    if (request.receiverTrip.toString() !== tripId) {
      return res.status(403).json({
        message: "You cannot accept this request.",
      });
    }

    if (request.status !== "Pending") {
      return res.status(409).json({
        message: "This request has already been processed.",
      });
    }

    request.status = "Accepted";
    await request.save();

    return res.status(200).json({
      message: "Connection request accepted!",
      request,
    });
  } catch (error) {
    console.error("Accept request error:", error.message);

    return res.status(500).json({
      message: "Could not accept connection request.",
    });
  }
}

// 4. REJECT A CONNECTION REQUEST
async function rejectRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { tripId } = req.body;

    if (
      !mongoose.isValidObjectId(requestId) ||
      !mongoose.isValidObjectId(tripId)
    ) {
      return res.status(400).json({
        message: "Valid request ID and trip ID are required.",
      });
    }

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Connection request not found.",
      });
    }

    // Only the receiver can reject the request
    if (request.receiverTrip.toString() !== tripId) {
      return res.status(403).json({
        message: "You cannot reject this request.",
      });
    }

    if (request.status !== "Pending") {
      return res.status(409).json({
        message: "This request has already been processed.",
      });
    }

    request.status = "Rejected";
    await request.save();

    return res.status(200).json({
      message: "Connection request rejected!",
      request,
    });
  } catch (error) {
    console.error("Reject request error:", error.message);

    return res.status(500).json({
      message: "Could not reject connection request.",
    });
  }
}

// 5. GET OUTGOING REQUESTS
async function getOutgoingRequests(req, res) {
  try {
    const { tripId } = req.query;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({
        message: "A valid trip ID is required.",
      });
    }

    const requests = await Request.find({
      senderTrip: tripId,
    })
      .populate("receiverTrip", "name from to date time transport")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Outgoing requests error:", error.message);

    return res.status(500).json({
      message: "Could not retrieve outgoing requests.",
    });
  }
}
// 6. GET ACCEPTED CONNECTIONS
async function getConnections(req, res) {
  try {
    const { tripId } = req.query;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({
        message: "A valid trip ID is required.",
      });
    }

    const connections = await Request.find({
      status: "Accepted",
      $or: [{ senderTrip: tripId }, { receiverTrip: tripId }],
    })
      .populate("senderTrip", "name from to date time transport")
      .populate("receiverTrip", "name from to date time transport")
      .sort({ updatedAt: -1 });

    // Return the other person's trip as buddyTrip
    const result = connections.map((request) => {
      const isSender = request.senderTrip._id.toString() === tripId;

      return {
        requestId: request._id,
        buddyTrip: isSender ? request.receiverTrip : request.senderTrip,
        connectedAt: request.updatedAt,
      };
    });

    return res.status(200).json({
      count: result.length,
      connections: result,
    });
  } catch (error) {
    console.error("Connections error:", error.message);

    return res.status(500).json({
      message: "Could not retrieve connections.",
    });
  }
}

module.exports = {
  sendRequest,
  getIncomingRequests,
  acceptRequest,
  rejectRequest,
  getOutgoingRequests,
   getConnections
};
