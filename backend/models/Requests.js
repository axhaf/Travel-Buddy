const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        senderTrip: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            required: true
        },

        receiverTrip: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            required: true
        },

        status: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected"],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate pending or accepted requests
requestSchema.index(
    { senderTrip: 1, receiverTrip: 1 },
    { unique: true }
);

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;