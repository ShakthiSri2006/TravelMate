
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("Please set JWT_SECRET in your .env file.");
}

// -------------------- DATABASE MODELS --------------------

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { type: String, required: true },
    interests: { type: [String], default: [] }
}, { timestamps: true });

const planSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    destination: { type: String, required: true, trim: true },
    destinationNormalized: { type: String, required: true, index: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },
    budgetRange: { type: String, default: "" },
    travelStyle: { type: String, default: "Balanced" },
    transport: { type: String, default: "Flexible" },
    accommodation: { type: String, default: "Flexible" },
    pace: { type: String, default: "Balanced" },
    wakeTime: { type: String, default: "Flexible" },
    groupSize: { type: String, default: "Flexible" },
    interests: { type: [String], default: [] },
    description: { type: String, default: "" }
}, { timestamps: true });

const requestSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TravelPlan",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

requestSchema.index({ from: 1, to: 1, plan: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
const TravelPlan = mongoose.model("TravelPlan", planSchema);
const ConnectionRequest = mongoose.model("ConnectionRequest", requestSchema);

// -------------------- AUTHENTICATION --------------------

function createToken(user) {
    return jwt.sign(
        { id: user._id.toString() },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function auth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ")
        ? header.slice(7)
        : "";

    if (!token) {
        return res.status(401).json({ message: "Please log in first." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        return res.status(401).json({
            message: "Your session expired. Please log in again."
        });
    }
}

function publicUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        interests: user.interests || []
    };
}

// -------------------- REGISTER --------------------

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password, interests } = req.body;

        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        const existing = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (existing) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            interests: Array.isArray(interests) ? interests : []
        });

        res.status(201).json({
            message: "Account created successfully.",
            token: createToken(user),
            user: publicUser(user)
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Could not create account." });
    }
});

// -------------------- LOGIN --------------------

app.post("/api/auth/login", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                message: "Incorrect email or password."
            });
        }

        res.json({
            message: "Login successful.",
            token: createToken(user),
            user: publicUser(user)
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Could not log in." });
    }
});

// -------------------- CURRENT USER --------------------

app.get("/api/auth/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json({ user: publicUser(user) });
    } catch {
        res.status(500).json({ message: "Could not load profile." });
    }
});

// -------------------- CREATE TRAVEL PLAN --------------------

app.post("/api/travelplans", auth, async (req, res) => {
    try {
      
        const {
            destination,
            departureDate,
            returnDate,
            budgetMin,
            budgetMax,
            budgetRange,
            travelStyle,
            transport,
            accommodation,
            pace,
            wakeTime,
            groupSize,
            interests,
            description
        } = req.body;

        

        if (!destination?.trim() || !departureDate || !returnDate) {
            return res.status(400).json({
                message: "Destination and both travel dates are required."
            });
        }

        const start = new Date(departureDate);
        const end = new Date(returnDate);

        if (Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end < start) {
            return res.status(400).json({
                message: "Please enter valid travel dates."
            });
        }

        
        const plan = await TravelPlan.create({
            user: req.userId,
            destination: destination.trim(),
            destinationNormalized: destination.trim().toLowerCase(),
            departureDate: start,
            returnDate: end,
            budgetMin: Number(budgetMin) || 0,
            budgetMax: Number(budgetMax) || 0,
            budgetRange: String(budgetRange || ""),
            travelStyle: String(travelStyle || "Balanced"),
            transport: String(transport || "Flexible"),
            accommodation: String(accommodation || "Flexible"),
            pace: String(pace || "Balanced"),
            wakeTime: String(wakeTime || "Flexible"),
            groupSize: String(groupSize || "Flexible"),
            interests: Array.isArray(interests) ? interests : [],
            description: String(description || "").trim()
        });

        

        res.status(201).json({
            message: "Your travel plan has been published.",
            plan
        });
    } catch (error) {
        console.error("Create plan error:", error);
        res.status(500).json({ message: "Could not save travel plan." });
    }
});

// -------------------- MY TRAVEL PLANS --------------------

app.get("/api/travelplans/mine", auth, async (req, res) => {
    try {
        const plans = await TravelPlan.find({ user: req.userId })
            .sort({ departureDate: 1 });

        res.json({ plans });
    } catch {
        res.status(500).json({ message: "Could not load your plans." });
    }
});

// -------------------- MATCH SCORE --------------------

function calculateMatch(myPlan, otherPlan) {
    const sameDestination =
        myPlan.destinationNormalized === otherPlan.destinationNormalized;

    const myStart = new Date(myPlan.departureDate).getTime();
    const myEnd = new Date(myPlan.returnDate).getTime();
    const theirStart = new Date(otherPlan.departureDate).getTime();
    const theirEnd = new Date(otherPlan.returnDate).getTime();

    const overlap = Math.max(
        0,
        Math.min(myEnd, theirEnd) - Math.max(myStart, theirStart)
    );

    const oneDay = 24 * 60 * 60 * 1000;
    const overlapsDates = overlap >= 0 &&
        Math.min(myEnd, theirEnd) >= Math.max(myStart, theirStart);

    const myInterests = new Set(
        (myPlan.interests || []).map(item => item.toLowerCase())
    );

    const theirInterests = new Set(
        (otherPlan.interests || []).map(item => item.toLowerCase())
    );

    const sharedInterests = [...myInterests].filter(
        item => theirInterests.has(item)
    );

    // Destination: 50 points.
    // Dates: up to 30 points.
    // Shared interests: up to 20 points.
    const destinationScore = sameDestination ? 50 : 0;

    let dateScore = 0;

    if (overlapsDates) {
        const overlapDays = Math.max(1, Math.floor(overlap / oneDay) + 1);
        const myDuration = Math.max(
            1,
            Math.floor((myEnd - myStart) / oneDay) + 1
        );
        const theirDuration = Math.max(
            1,
            Math.floor((theirEnd - theirStart) / oneDay) + 1
        );

        const shorterTrip = Math.min(myDuration, theirDuration);
        dateScore = Math.round(30 * Math.min(1, overlapDays / shorterTrip));
    }

    const totalInterestCount = new Set([
        ...myInterests,
        ...theirInterests
    ]).size;

    const interestScore = totalInterestCount
        ? Math.round(20 * sharedInterests.length / totalInterestCount)
        : 0;

    return {
        score: destinationScore + dateScore + interestScore,
        sameDestination,
        overlapsDates,
        sharedInterests
    };
}

// -------------------- FIND TRAVELLERS --------------------

app.get("/api/travelplans/:id/matches", auth, async (req, res) => {
    try {
        const myPlan = await TravelPlan.findOne({
            _id: req.params.id,
            user: req.userId
        });

        if (!myPlan) {
            return res.status(404).json({
                message: "Travel plan not found."
            });
        }

        const candidates = await TravelPlan.find({
            _id: { $ne: myPlan._id },
            user: { $ne: req.userId },
            destinationNormalized: myPlan.destinationNormalized,
            departureDate: { $lte: myPlan.returnDate },
            returnDate: { $gte: myPlan.departureDate }
        }).populate("user", "name interests");

        const matches = candidates
            .filter(plan => plan.user)
            .map(plan => ({
                plan: {
                    id: plan._id,
                    destination: plan.destination,
                    departureDate: plan.departureDate,
                    returnDate: plan.returnDate,
                    interests: plan.interests,
                    description: plan.description
                },
                user: publicUser(plan.user),
                ...calculateMatch(myPlan, plan)
            }))
            .sort((a, b) => b.score - a.score);

        res.json({ matches });
    } catch (error) {
        console.error("Match error:", error);
        res.status(500).json({ message: "Could not find matches." });
    }
});

// -------------------- SEND CONNECTION REQUEST --------------------

app.post("/api/requests", auth, async (req, res) => {
    try {
        const { planId } = req.body;

        const plan = await TravelPlan.findById(planId);

        if (!plan) {
            return res.status(404).json({ message: "Travel plan not found." });
        }

        if (plan.user.toString() === req.userId) {
            return res.status(400).json({
                message: "You cannot connect with your own travel plan."
            });
        }

        const existing = await ConnectionRequest.findOne({
            from: req.userId,
            to: plan.user,
            plan: plan._id
        });

        if (existing) {
            return res.status(409).json({
                message: "You have already requested this traveller."
            });
        }

        const request = await ConnectionRequest.create({
            from: req.userId,
            to: plan.user,
            plan: plan._id
        });

        res.status(201).json({
            message: "Connection request sent.",
            request
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This connection request already exists."
            });
        }

        console.error("Request error:", error);
        res.status(500).json({ message: "Could not send request." });
    }
});

// -------------------- VIEW CONNECTION REQUESTS --------------------

app.get("/api/requests", auth, async (req, res) => {
    try {
        const [incoming, outgoing, accepted] = await Promise.all([
            ConnectionRequest.find({
                to: req.userId,
                status: "pending"
            }).populate("from", "name email interests")
              .populate("plan"),

            ConnectionRequest.find({
                from: req.userId,
                status: "pending"
            }).populate("to", "name email interests")
              .populate("plan"),

            ConnectionRequest.find({
                $or: [{ from: req.userId }, { to: req.userId }],
                status: "accepted"
            }).populate("from", "name email interests")
              .populate("to", "name email interests")
              .populate("plan")
        ]);

        res.json({ incoming, outgoing, accepted });
    } catch (error) {
        console.error("Load requests error:", error);
        res.status(500).json({ message: "Could not load requests." });
    }
});

// -------------------- ACCEPT OR REJECT REQUEST --------------------

app.patch("/api/requests/:id", auth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be accepted or rejected."
            });
        }

        const request = await ConnectionRequest.findOne({
            _id: req.params.id,
            to: req.userId,
            status: "pending"
        });

        if (!request) {
            return res.status(404).json({
                message: "Pending request not found."
            });
        }

        request.status = status;
        await request.save();

        res.json({
            message: status === "accepted"
                ? "Connection accepted."
                : "Connection rejected.",
            request
        });
    } catch (error) {
        console.error("Update request error:", error);
        res.status(500).json({ message: "Could not update request." });
    }
});

// -------------------- HEALTH CHECK --------------------

app.get("/api/test", (req, res) => {
    res.json({ message: "TravelMate backend is working!" });
});

// -------------------- START SERVER --------------------

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully.");
        app.listen(PORT, () => {
            console.log(`TravelMate is running at http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });
