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
                message: "Valid sender and receiver trip IDs are required."
            });
        }

        // Prevent sending a request to your own trip
        if (senderTrip === receiverTrip) {
            return res.status(400).json({
                message: "You cannot send a request to your own trip."
            });
        }

        // Check whether both trips exist
        const [sender, receiver] = await Promise.all([
            Trip.findById(senderTrip),
            Trip.findById(receiverTrip)
        ]);

        if (!sender || !receiver) {
            return res.status(404).json({
                message: "One or both trips could not be found."
            });
        }

        // Check for an existing request
        const existingRequest = await Request.findOne({
            senderTrip,
            receiverTrip
        });

        if (existingRequest) {
            return res.status(409).json({
                message: "A request has already been sent for this trip.",
                request: existingRequest
            });
        }

        const request = await Request.create({
            senderTrip,
            receiverTrip
        });

        return res.status(201).json({
            message: "Connection request sent successfully!",
            request
        });

    } catch (error) {
        // Handles duplicate-key errors, including simultaneous requests
        if (error.code === 11000) {
            return res.status(409).json({
                message: "A request has already been sent for this trip."
            });
        }

        console.error("Send request error:", error.message);

        return res.status(500).json({
            message: "Could not send connection request."
        });
    }
}


// 2. GET INCOMING REQUESTS
async function getIncomingRequests(req, res) {
    try {
        const { tripId } = req.query;

        if (!mongoose.isValidObjectId(tripId)) {
            return res.status(400).json({
                message: "A valid trip ID is required."
            });
        }

        const requests = await Request.find({
            receiverTrip: tripId,
            status: "Pending"
        })
        .populate("senderTrip", "name from to date time transport")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            count: requests.length,
            requests
        });

    } catch (error) {
        console.error("Incoming requests error:", error.message);

        return res.status(500).json({
            message: "Could not retrieve incoming requests."
        });
    }
}


module.exports = {
    sendRequest,
    getIncomingRequests
};