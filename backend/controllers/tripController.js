const mongoose = require("mongoose");
const Trip = require("../models/Trip");

async function createTrip(req, res) {
    try {
        const { name, from, to, date, time, transport } = req.body;

        if (!name || !from || !to || !date || !time) {
            return res.status(400).json({
                message: "Please provide all required trip details."
            });
        }

        const trip = await Trip.create({
            name,
            from,
            to,
            date,
            time,
            transport
        });

        return res.status(201).json({
            message: "Trip saved successfully!",
            trip
        });

    } catch (error) {
        console.error("Create trip error:", error.message);

        return res.status(500).json({
            message: "Could not save trip."
        });
    }
}

async function findMatches(req, res) {
    try {
        const { from, to, date, time, tripId } = req.query;

        if (!from || !to || !date || !time || !tripId) {
            return res.status(400).json({
                message: "Please provide the trip ID, starting location, destination, date, and time."
            });
        }

        if (!mongoose.isValidObjectId(tripId)) {
            return res.status(400).json({
                message: "A valid trip ID is required."
            });
        }

        const searchMinutes =
            Number(time.split(":")[0]) * 60 +
            Number(time.split(":")[1]);

        const trips = await Trip.find({
            _id: { $ne: new mongoose.Types.ObjectId(tripId) },
            from: { $regex: `^${from.trim()}$`, $options: "i" },
            to: { $regex: `^${to.trim()}$`, $options: "i" },
            date
        });

        const matches = trips.filter(trip => {
            const tripMinutes =
                Number(trip.time.split(":")[0]) * 60 +
                Number(trip.time.split(":")[1]);

            return Math.abs(tripMinutes - searchMinutes) <= 30;
        });

        return res.status(200).json({
            count: matches.length,
            matches
        });

    } catch (error) {
        console.error("Find matches error:", error.message);

        return res.status(500).json({
            message: "Could not find matching trips."
        });
    }
}

module.exports = { createTrip, findMatches };