const API = "/api/atm";

const loginSection = document.getElementById("login-section");
const menuSection = document.getElementById("menu-section");
const transactionSection = document.getElementById("transaction-section");
const pinSection = document.getElementById("pin-section");

const output = document.getElementById("output");

// API connection
async function apiRequest(endpoint, method = "GET", data = null) {
    const options = {
        method: method,
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (data !== null) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(API + endpoint, options);

    if (!response.ok) {
        throw new Error("Server error: " + response.status);
    }

    return await response.json();
}

// Show message
function showMessage(message) {
    output.textContent = message;
}

// Login
async function login() {
    const pin = document.getElementById("pin").value;
    const loginMessage = document.getElementById("login-message");

    if (!/^\d{4}$/.test(pin)) {
        loginMessage.textContent = "Please enter a valid 4-digit PIN.";
        return;
    }

    try {
        const result = await apiRequest("/login", "POST", {
            pin: Number(pin)
        });

        loginMessage.textContent = result.message;

        if (result.success) {
            loginSection.hidden = true;
            menuSection.hidden = false;
            document.getElementById("welcome").textContent =
                "Welcome! Choose an ATM service.";
            document.getElementById("pin").value = "";
            showMessage("You are successfully logged in.");
        }
    } catch (error) {
        loginMessage.textContent = "Server connection failed!";
        console.error(error);
    }
}

// Check balance
async function checkBalance() {
    try {
        const result = await apiRequest("/balance");

        if (!result.success) {
            showMessage(result.message);
            return;
        }

        showMessage(
            "YOUR ACCOUNT BALANCE\n\n₹ " +
            Number(result.balance).toLocaleString("en-IN")
        );
    } catch (error) {
        showMessage("Unable to fetch balance.");
        console.error(error);
    }
}

// Show deposit or withdrawal section
function showTransaction(type) {
    menuSection.hidden = true;
    transactionSection.hidden = false;
    document.getElementById("amount").value = "";

    document.getElementById("transaction-title").textContent =
        type === "withdraw" ? "CASH WITHDRAWAL" : "CASH DEPOSIT";

    transactionSection.dataset.type = type;
}

// Submit transaction
async function submitTransaction() {
    const amount = Number(document.getElementById("amount").value);
    const type = transactionSection.dataset.type;

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }

    try {
        const result = await apiRequest(
            type === "withdraw" ? "/withdraw" : "/deposit",
            "POST",
            { amount: amount }
        );

        if (result.success) {
            const receipt = result.receipt;

            showMessage(
                result.message +
                "\n\nTransaction: " + receipt.type +
                "\nAmount: ₹ " + receipt.amount +
                "\nRemaining Balance: ₹ " +
                Number(receipt.balance).toLocaleString("en-IN") +
                "\nTime: " + receipt.time
            );

            transactionSection.hidden = true;
            menuSection.hidden = false;
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("Transaction failed. Please try again.");
        console.error(error);
    }
}

// Mini statement
async function statement() {
    try {
        const result = await apiRequest("/statement");

        if (!result.success) {
            showMessage(result.message);
            return;
        }

        if (result.transactions.length === 0) {
            showMessage("No transactions available.");
            return;
        }

        let text = "MINI STATEMENT\n\n";

        result.transactions.forEach((item, index) => {
            text +=
                (index + 1) + ". " + item.type +
                "\nAmount: ₹ " + item.amount +
                "\nBalance: ₹ " + item.balance +
                "\nDate: " + item.time + "\n\n";
        });

        showMessage(text);
    } catch (error) {
        showMessage("Unable to fetch statement.");
        console.error(error);
    }
}

// Show change PIN section
function showChangePin() {
    menuSection.hidden = true;
    pinSection.hidden = false;

    document.getElementById("oldPin").value = "";
    document.getElementById("newPin").value = "";
    showMessage("Enter your old and new PIN.");
}

// Change PIN
async function changePin() {
    const oldPin = document.getElementById("oldPin").value;
    const newPin = document.getElementById("newPin").value;

    if (!/^\d{4}$/.test(oldPin) || !/^\d{4}$/.test(newPin)) {
        alert("Both PINs must contain exactly 4 digits.");
        return;
    }

    try {
        const result = await apiRequest("/change-pin", "POST", {
            oldPin: Number(oldPin),
            newPin: Number(newPin)
        });

        alert(result.message);

        if (result.success) {
            pinSection.hidden = true;
            menuSection.hidden = false;
            showMessage("Your PIN has been changed successfully.");
        }
    } catch (error) {
        alert("Unable to change PIN.");
        console.error(error);
    }
}

// Back to menu
function backToMenu() {
    transactionSection.hidden = true;
    pinSection.hidden = true;
    menuSection.hidden = false;
}

// Logout
async function logout() {
    try {
        const result = await apiRequest("/logout", "POST");

        alert(result.message);

        menuSection.hidden = true;
        transactionSection.hidden = true;
        pinSection.hidden = true;
        loginSection.hidden = false;

        document.getElementById("pin").value = "";
        document.getElementById("login-message").textContent = "";
        showMessage("Please login to continue.");
    } catch (error) {
        alert("Logout failed. Please try again.");
        console.error(error);
    }
}