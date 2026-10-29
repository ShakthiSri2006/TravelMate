# ✈️ TravelMate – Find Your Travel Companion

**TravelMate** is a full-stack web application designed to connect people travelling to the same destination on similar dates. It allows users to create travel plans, discover matching travellers, and send connection requests through a single platform.

The goal is to make travel planning more social, convenient, and interactive by helping people discover potential travel companions.

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [How It Works](#-how-it-works)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Future Enhancements](#-future-enhancements)
- [Conclusion](#-conclusion)

## 🌍 Overview

Planning a trip alone can sometimes be challenging, especially when travellers want to find people visiting the same destination during a similar period. TravelMate addresses this problem by providing a platform where users can share their travel plans and discover other travellers with compatible schedules.

Users can register, log in, add their destinations and travel dates, view matching travel plans, and manage connection requests.

## ❓ Problem Statement

Travellers often struggle to find suitable companions who share their destination and travel schedule. Traditional travel platforms primarily focus on bookings and itineraries, leaving fewer opportunities to discover other individual travellers with similar plans.

TravelMate aims to simplify this process through destination-based and date-based matching.

## 🎯 Objectives

- Develop a user-friendly platform for discovering travel companions.
- Allow users to create and manage travel plans.
- Identify potential matches based on destinations and overlapping dates.
- Provide a connection request mechanism between users.
- Store and retrieve application data using a database.
- Demonstrate full-stack web development and client-server communication.

## ✨ Key Features

### 1. User Authentication
Allows users to register and log in to access the platform.

### 2. Travel Plan Management
Users can create travel plans by entering a destination, departure date, and return date.

### 3. Smart Travel Matching
Compares destinations and travel dates to identify potentially compatible travellers.

### 4. Connection Requests
Allows users to send connection requests to matching travellers.

### 5. Request Management
Provides functionality to view and manage incoming and outgoing connection requests.

### 6. Interactive Dashboard
Brings travel plans, matching results, and connection requests together in one interface.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Structures the web pages |
| CSS3 | Styles the user interface |
| JavaScript | Handles interactions and API communication |
| Node.js | Runs the backend JavaScript application |
| Express.js | Provides backend routes and REST APIs |
| MongoDB | Stores application data |
| Mongoose | Defines schemas and interacts with MongoDB |
| MongoDB Compass | Provides a graphical interface for database management |
| JSON Web Token (JWT) | Supports authenticated API requests |

## 🏗️ System Architecture

TravelMate follows a client-server architecture.

```text
              USER
                |
                v
       FRONTEND (Browser)
       HTML + CSS + JavaScript
                |
                | HTTP / JSON
                v
        BACKEND (Server)
        Node.js + Express.js
                |
                | Mongoose
                v
          MONGODB DATABASE
                |
                v
     Users | Travel Plans | Requests
```

The frontend sends requests to the backend through API endpoints. The backend processes these requests, interacts with MongoDB, and returns responses to the frontend.

## 🔄 How It Works

1. **Register or log in:** Users create an account or authenticate with existing credentials.
2. **Create a travel plan:** Users enter their destination and travel dates.
3. **Find matching travellers:** The system identifies other users with the same destination and overlapping travel periods.
4. **Send a request:** Users can send connection requests to potential travel companions.
5. **Manage requests:** Users can review incoming requests and respond to them.
6. **View the dashboard:** Users can access their travel information and matching results from one place.

## 📂 Project Structure

```text
TravelMate/
│
├── public/
│   ├── index.html       # Frontend page structure
│   ├── style.css        # Website styling
│   └── script.js        # Frontend interactions and API calls
│
├── models/              # Database models, if organized separately
│
├── server.js            # Express server and API routes
├── package.json         # Project metadata and dependencies
├── package-lock.json    # Dependency lock file
├── .env                 # Environment configuration (not committed)
├── .gitignore           # Files excluded from Git
└── README.md            # Project documentation
```

*Note: The `models/` directory is optional; adjust this tree to match your actual project files.*

## 🚀 Installation and Setup

### Prerequisites

Install the following before running TravelMate:

- [Node.js](https://nodejs.org/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) or an accessible MongoDB deployment
- [MongoDB Compass](https://www.mongodb.com/products/tools/compass) (optional, for viewing database records)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended)

### Step 1: Clone or Download the Project

If the project is hosted on GitHub:

```bash
git clone <your-repository-url>
cd TravelMate
```

Alternatively, open your existing TravelMate project folder in VS Code.

### Step 2: Install Dependencies

Open the terminal in the project folder and run:

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root and configure the variables expected by your `server.js`.

For example:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/travelmate
JWT_SECRET=replace_with_a_long_random_secret
```

**Important:** These variable names and the MongoDB URI are examples. Use the exact variable names and database configuration required by your existing application. Never commit real credentials or secrets to GitHub.

### Step 4: Start the Application

Run:

```bash
npm start
```

When the database connection succeeds and the server starts, open:

```text
http://localhost:3000
```

If port `3000` is already in use, stop the existing server process or configure a different available port.

## 🔐 Security Considerations

- Protect private API endpoints with authentication.
- Store passwords using a suitable password-hashing algorithm.
- Keep database credentials and JWT secrets in environment variables.
- Validate user input on the backend.
- Restrict access to travel plans and connection requests to authorized users.
- Avoid exposing sensitive personal information to other users.

## 🔮 Future Enhancements

Possible improvements include:

- Real-time messaging between connected travellers.
- Profile verification and traveller reviews.
- Group trip creation and collaborative planning.
- Maps and location-based recommendations.
- Travel itinerary sharing.
- Email notifications for connection requests.
- Improved privacy controls and reporting features.

## 🎓 Learning Outcomes

This project demonstrates practical concepts in:

- Full-stack web application development.
- REST API design and implementation.
- Database integration using MongoDB and Mongoose.
- Authentication and protected routes.
- Asynchronous JavaScript and HTTP communication.
- Date-based matching logic.
- Application configuration and debugging.

## 🏁 Conclusion

TravelMate aims to make travel planning more collaborative by helping users discover people with similar destinations and travel schedules. By combining frontend technologies, a Node.js and Express.js backend, and MongoDB, the project demonstrates how a full-stack web application can support user authentication, travel plan management, traveller matching, and connection requests.

**TravelMate — Discover destinations. Find companions. Share the journey.**
