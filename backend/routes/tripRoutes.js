const express = require("express");
const router = express.Router();

const {
    createTrip,
    findMatches
} = require("../controllers/tripController");

router.post("/", createTrip);

router.get("/matches", findMatches);

module.exports = router;