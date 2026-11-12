const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    from: {
        type: String,
        required: true,
        trim: true
    },

    to: {
        type: String,
        required: true,
        trim: true
    },

    date: {
        type: String,
        required: true
    },

    time: {
        type: String,
        required: true
    },

    transport: {
        type: String,
        default: "Not Selected"
    }
});

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;