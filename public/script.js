
const $ = (selector) => document.querySelector(selector);

const tokenKey = "travelmate_token";
let currentUser = null;
let authMode = "login";
let toastTimer;

const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

function getToken() {
    return localStorage.getItem(tokenKey);
}

async function api(url, options = {}) {
    const headers = { ...(options.headers || {}) };

    if (options.body) headers["Content-Type"] = "application/json";
    if (getToken()) headers.Authorization = `Bearer ${getToken()}`;

    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401 && getToken()) {
            localStorage.removeItem(tokenKey);
            currentUser = null;
            updateAuthUI();
        }
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function formatDate(date) {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    });
}

function dateValue(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function updateAuthUI() {
    const loggedIn = Boolean(currentUser);

    $("#loginOpen").classList.toggle("hidden", loggedIn);
    $("#signupOpen").classList.toggle("hidden", loggedIn);
    $("#logoutButton").classList.toggle("hidden", !loggedIn);

    $("#welcomeTitle").textContent = loggedIn
        ? `Welcome to your next adventure, ${currentUser.name.split(" ")[0]}.`
        : "A world of journeys, waiting to connect.";

    $("#welcomeText").textContent = loggedIn
        ? "Your travel plans and potential companions are waiting below."
        : "Create your travel plan and discover people heading in the same direction.";
}

function openAuth(mode = "login") {
    setAuthMode(mode);
    $("#authMessage").textContent = "";
    $("#authModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeAuth() {
    $("#authModal").classList.add("hidden");
    document.body.style.overflow = "";
}

function setAuthMode(mode) {
    authMode = mode;
    const signingUp = mode === "signup";

    $("#showLogin").classList.toggle("active", !signingUp);
    $("#showSignup").classList.toggle("active", signingUp);
    $("#nameField").classList.toggle("hidden", !signingUp);
    $("#authName").required = signingUp;
    $("#authPassword").autocomplete = signingUp ? "new-password" : "current-password";
    $("#authTitle").textContent = signingUp
        ? "Your next chapter starts here."
        : "Welcome back, traveller.";
    $("#authSubmit").textContent = signingUp ? "Create my account ↗" : "Log in ↗";
    $("#authMessage").textContent = "";
}

function requireLogin() {
    if (currentUser) return true;
    openAuth("signup");
    showToast("Create an account or log in to continue.");
    return false;
}

$("#loginOpen").addEventListener("click", () => openAuth("login"));
$("#signupOpen").addEventListener("click", () => openAuth("signup"));
$("#closeModal").addEventListener("click", closeAuth);
$("#modalBackdrop").addEventListener("click", closeAuth);
$("#showLogin").addEventListener("click", () => setAuthMode("login"));
$("#showSignup").addEventListener("click", () => setAuthMode("signup"));

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeAuth();
});

// ---------------- AUTH FORM ----------------

$("#authForm").addEventListener("submit", async event => {
    event.preventDefault();

    const message = $("#authMessage");
    const button = $("#authSubmit");

    const payload = {
        email: $("#authEmail").value.trim(),
        password: $("#authPassword").value
    };

    if (authMode === "signup") {
        payload.name = $("#authName").value.trim();
        payload.interests = [];
    }

    button.disabled = true;
    message.textContent = "Please wait...";

    try {
        const result = await api(`/api/auth/${authMode === "signup" ? "register" : "login"}`, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        localStorage.setItem(tokenKey, result.token);
        currentUser = result.user;

        closeAuth();
        $("#authForm").reset();
        updateAuthUI();

        showToast(authMode === "signup"
            ? "Welcome to TravelMate!"
            : "You're logged in!");

        await refreshDashboard();
    } catch (error) {
        message.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

// ---------------- LOGOUT ----------------

$("#logoutButton").addEventListener("click", () => {
    localStorage.removeItem(tokenKey);
    currentUser = null;
    updateAuthUI();
    $("#plansList").innerHTML = emptyState("Your next chapter starts here.", "Log in to view your travel plans.");
    $("#matchesList").innerHTML = emptyState("Your travel matches will appear here.", "Log in and create a travel plan to find companions.");
    $("#incomingList").innerHTML = '<p class="empty-small">Log in to view requests.</p>';
    $("#outgoingList").innerHTML = '<p class="empty-small">Log in to view requests.</p>';
    $("#connectionsList").innerHTML = '<p class="empty-small">Log in to view connections.</p>';
    $("#myPlanCount").textContent = "0";
    $("#matchCount").textContent = "0";
    $("#requestCount").textContent = "0";
    showToast("You have logged out.");
});

// ---------------- DATE VALIDATION ----------------

const today = dateValue(new Date());
$("#departureDate").min = today;
$("#returnDate").min = today;

$("#departureDate").addEventListener("change", () => {
    $("#returnDate").min = $("#departureDate").value || today;

    if ($("#returnDate").value &&
        $("#returnDate").value < $("#departureDate").value) {
        $("#returnDate").value = $("#departureDate").value;
    }
});

// ---------------- DESTINATION SHORTCUTS ----------------

document.querySelectorAll("[data-destination]").forEach(card => {
    card.addEventListener("click", () => {
        $("#planDestination").value = card.dataset.destination;
        $("#planner").scrollIntoView({ behavior: "smooth" });
        $("#planDestination").focus({ preventScroll: true });
    });
});

// ---------------- CREATE TRAVEL PLAN ----------------


 // ---------------- CREATE TRAVEL PLAN ----------------

$("#planForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!requireLogin()) return;

    const departureDate = $("#departureDate").value;
    const returnDate = $("#returnDate").value;

    if (returnDate < departureDate) {
        showToast("Return date must be on or after departure.");
        return;
    }

    const budgetRange = $("#budgetRange").value;
    const [budgetMin, budgetMax] = budgetRange.split("-").map(Number);

    const interests = [
        ...document.querySelectorAll('input[name="interests"]:checked')
    ].map(input => input.value);

    const payload = {
        destination: $("#planDestination").value.trim(),
        departureDate,
        returnDate,
        budgetMin,
        budgetMax,
        budgetRange,
        travelStyle: $("#travelStyle").value,
        transport: $("#transport").value,
        accommodation: $("#accommodation").value,
        pace: $("#pace").value,
        wakeTime: $("#wakeTime").value,
        groupSize: $("#groupSize").value,
        interests,
        description: $("#tripNotes").value.trim()
    };

    if (!payload.destination) {
        showToast("Please enter a destination.");
        return;
    }

    try {
        await api("/api/travelplans", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        $("#planForm").reset();
        $("#returnDate").min = today;

        showToast("Your travel plan has been published!");
        await refreshDashboard();
        switchTab("myPlans");
        $("#myDashboard").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
        showToast(error.message);
    }
});


// ---------------- EMPTY STATES ----------------

function emptyState(title, description) {
    return `<div class="empty-state">
        <span>✳</span>
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(description)}</p>
    </div>`;
}

// ---------------- MY PLANS ----------------

async function loadPlans() {
    const result = await api("/api/travelplans/mine");
    const plans = result.plans || [];

    $("#myPlanCount").textContent = plans.length;

    if (!plans.length) {
        $("#plansList").innerHTML = emptyState(
            "Your next chapter starts here.",
            "Create a travel plan above to find people travelling to the same place."
        );
        $("#matchCount").textContent = "0";
        $("#matchesList").innerHTML = emptyState(
            "No matches yet.",
            "Create a travel plan to discover compatible travellers."
        );
        return;
    }

    $("#plansList").innerHTML = plans.map(plan => `
        <article class="plan-card">
            <div class="card-topline">
                <div>
                    <p class="eyebrow">YOUR TRAVEL PLAN</p>
                    <h3>${escapeHTML(plan.destination)}</h3>
                </div>
                <span class="status-pill">Published</span>
            </div>
            <p class="card-meta">
                ↗ ${formatDate(plan.departureDate)} — ${formatDate(plan.returnDate)}
            </p>
            ${plan.description
                ? `<p class="card-subtitle">${escapeHTML(plan.description)}</p>`
                : ""}
            <div class="chip-row">
                ${(plan.interests || []).map(interest =>
                    `<span class="chip">${escapeHTML(interest)}</span>`
                ).join("")}
            </div>
            <div class="card-actions">
                <button class="action-primary" data-find-matches="${plan._id}">
                    Find travel matches ↗
                </button>
            </div>
        </article>
    `).join("");

    await loadMatches(plans);
}

// ---------------- MATCHES ----------------

async function loadMatches(plans) {
    const allMatches = [];
    const seen = new Set();

    for (const plan of plans) {
        const result = await api(
            `/api/travelplans/${encodeURIComponent(plan._id)}/matches`
        );

        for (const match of result.matches || []) {
            const key = `${match.user.id}-${match.plan.id}`;

            if (!seen.has(key)) {
                seen.add(key);
                allMatches.push({ ...match, myPlanId: plan._id });
            }
        }
    }

    allMatches.sort((a, b) => b.score - a.score);
    $("#matchCount").textContent = allMatches.length;

    if (!allMatches.length) {
        $("#matchesList").innerHTML = emptyState(
            "Your travel people are out there.",
            "No overlapping plans found yet. Check back as more travellers publish their trips."
        );
        return;
    }

    $("#matchesList").innerHTML = allMatches.map(match => {
        const reasons = [];

        if (match.sameDestination) reasons.push("Same destination");
        if (match.overlapsDates) reasons.push("Overlapping dates");

        if (match.sharedInterests?.length) {
            reasons.push(`${match.sharedInterests.length} shared interest${match.sharedInterests.length > 1 ? "s" : ""}`);
        }

        return `
            <article class="match-card">
                <div class="card-topline">
                    <div>
                        <p class="eyebrow">TRAVEL COMPANION</p>
                        <h3>${escapeHTML(match.user.name)}</h3>
                        <p class="card-subtitle">${escapeHTML(match.plan.destination)}</p>
                    </div>
                    <div class="match-score">${match.score}%</div>
                </div>

                <p class="score-caption">Travel-plan match score</p>

                <p class="card-meta">
                    ↗ ${formatDate(match.plan.departureDate)} — ${formatDate(match.plan.returnDate)}
                </p>

                ${match.plan.description
                    ? `<p class="card-subtitle">${escapeHTML(match.plan.description)}</p>`
                    : ""}

                <div class="chip-row">
                    ${reasons.map(reason =>
                        `<span class="chip">${escapeHTML(reason)}</span>`
                    ).join("")}
                </div>

                ${match.sharedInterests?.length
                    ? `<p class="card-subtitle">Shared interests: ${match.sharedInterests.map(escapeHTML).join(", ")}</p>`
                    : ""}

                <div class="card-actions">
                    <button class="action-primary" data-connect="${match.plan.id}">
                        Send connection request ↗
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

$("#matchesList").addEventListener("click", async event => {
    const button = event.target.closest("[data-connect]");
    if (!button) return;

    if (!requireLogin()) return;

    button.disabled = true;

    try {
        const result = await api("/api/requests", {
            method: "POST",
            body: JSON.stringify({ planId: button.dataset.connect })
        });

        showToast(result.message);
        await loadRequests();
    } catch (error) {
        showToast(error.message);
    } finally {
        button.disabled = false;
    }
});

$("#plansList").addEventListener("click", async event => {
    const button = event.target.closest("[data-find-matches]");
    if (!button) return;

    if (!requireLogin()) return;

    button.disabled = true;
    button.textContent = "Finding matches...";

    try {
        const result = await api(
            `/api/travelplans/${encodeURIComponent(button.dataset.findMatches)}/matches`
        );

        showToast(`${result.matches.length} matching travel plan(s) found.`);
        switchTab("matches");

        // Refresh all match cards and scores.
        await loadPlans();
        switchTab("matches");
        $("#matches").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        showToast(error.message);
    } finally {
        button.disabled = false;
        button.textContent = "Find travel matches ↗";
    }
});

// ---------------- CONNECTION REQUESTS ----------------

async function loadRequests() {
    const result = await api("/api/requests");

    const incoming = result.incoming || [];
    const outgoing = result.outgoing || [];
    const accepted = result.accepted || [];

    $("#requestCount").textContent = incoming.length;

    $("#incomingList").innerHTML = incoming.length
        ? incoming.map(request => `
            <article class="request-card">
                <h4>${escapeHTML(request.from?.name || "Traveller")}</h4>
                <p>Wants to connect about ${escapeHTML(request.plan?.destination || "a trip")}.</p>
                <p>${formatDate(request.plan?.departureDate)} — ${formatDate(request.plan?.returnDate)}</p>
                <div class="card-actions">
                    <button class="action-primary" data-request-id="${request._id}" data-request-status="accepted">Accept</button>
                    <button class="action-secondary" data-request-id="${request._id}" data-request-status="rejected">Decline</button>
                </div>
            </article>
        `).join("")
        : '<p class="empty-small">No incoming requests yet.</p>';

    $("#outgoingList").innerHTML = outgoing.length
        ? outgoing.map(request => `
            <article class="request-card">
                <h4>${escapeHTML(request.to?.name || "Traveller")}</h4>
                <p>${escapeHTML(request.plan?.destination || "Travel plan")}</p>
                <span class="status-pill">Awaiting response</span>
            </article>
        `).join("")
        : '<p class="empty-small">No pending sent requests.</p>';

    $("#connectionsList").innerHTML = accepted.length
        ? accepted.map(request => {
            const otherUser = String(request.from?._id) === String(currentUser.id)
                ? request.to
                : request.from;

            return `
                <article class="request-card">
                    <h4>${escapeHTML(otherUser?.name || "Traveller")}</h4>
                    <p>${escapeHTML(request.plan?.destination || "Travel plan")}</p>
                    <span class="status-pill">Connected</span>
                    ${otherUser?.email
                        ? `<p>Contact: ${escapeHTML(otherUser.email)}</p>`
                        : ""}
                </article>
            `;
        }).join("")
        : '<p class="empty-small">Your accepted connections will appear here.</p>';
}

$("#requests").addEventListener("click", async event => {
    const button = event.target.closest("[data-request-id]");
    if (!button) return;

    const status = button.dataset.requestStatus;
    if (!status) return;

    button.disabled = true;

    try {
        const result = await api(
            `/api/requests/${encodeURIComponent(button.dataset.requestId)}`,
            {
                method: "PATCH",
                body: JSON.stringify({ status })
            }
        );

        showToast(result.message);
        await loadRequests();
    } catch (error) {
        showToast(error.message);
    } finally {
        button.disabled = false;
    }
});

// ---------------- DASHBOARD TABS ----------------

function switchTab(tabName) {
    document.querySelectorAll(".dashboard-panel").forEach(panel => {
        panel.classList.toggle("hidden", panel.id !== tabName);
    });

    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.tab === tabName);
    });
}

document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        switchTab(tab.dataset.tab);
    });
});

async function refreshDashboard() {
    if (!currentUser) return;

    try {
        await loadPlans();
        await loadRequests();
    } catch (error) {
        showToast(error.message);
    }
}

$("#refreshButton").addEventListener("click", async () => {
    if (!requireLogin()) return;

    try {
        await refreshDashboard();
        showToast("Dashboard updated.");
    } catch (error) {
        showToast(error.message);
    }
});

// ---------------- INITIAL LOAD ----------------

async function initialize() {
    updateAuthUI();

    try {
        if (getToken()) {
            const result = await api("/api/auth/me");
            currentUser = result.user;
            updateAuthUI();
            await refreshDashboard();
        }
    } catch (error) {
        console.error("Session restore:", error.message);
    }
}

initialize();
