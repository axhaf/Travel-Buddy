const User = require("../models/User");
const bcrypt = require("bcryptjs");

async function registerUser(req, res) {
    try {
        const { name, phone, password } = req.body;

        if (!name || !phone || !password) {
            return res.status(400).json({
                message: "Name, phone, and password are required."
            });
        }

        const existingUser = await User.findOne({ phone });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this phone number already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            phone,
            passwordHash
        });

        return res.status(201).json({
            message: "Registration successful!",
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Registration failed."
        });
    }
}

module.exports = { registerUser };