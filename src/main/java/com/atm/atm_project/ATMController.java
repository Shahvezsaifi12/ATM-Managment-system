
package com.atm.atm_project;

import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.util.*;

@RestController
@RequestMapping("/api/atm")
public class ATMController {

    private boolean loggedIn(HttpSession session) {
        return Boolean.TRUE.equals(session.getAttribute("loggedIn"));
    }

    private Map<String, Object> message(boolean success, String msg) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("message", msg);
        return result;
    }

    @PostMapping("/login")
    public Map<String, Object> login(
            @RequestBody Map<String, Integer> data,
            HttpSession session) {

        Integer pin = data.get("pin");

        if (Boolean.TRUE.equals(session.getAttribute("locked"))) {
            return message(false, "Account locked. Contact support.");
        }

        if (pin == null) {
            return message(false, "Please enter PIN.");
        }

        int correctPin = session.getAttribute("currentPin") == null
                ? 1212 : (int) session.getAttribute("currentPin");

        if (pin != correctPin) {
            int attempts = session.getAttribute("attempts") == null
                    ? 0 : (int) session.getAttribute("attempts");

            attempts++;
            session.setAttribute("attempts", attempts);

            if (attempts >= 3) {
                session.setAttribute("locked", true);
                return message(false, "3 wrong attempts. Account locked!");
            }

            return message(false,
                    "Wrong PIN! Attempts left: " + (3 - attempts));
        }

        session.setAttribute("loggedIn", true);
        session.setAttribute("attempts", 0);

        if (session.getAttribute("balance") == null) {
            session.setAttribute("balance", 100000.0);
            session.setAttribute("transactions",
                    new ArrayList<Map<String, Object>>());
        }

        return message(true, "PIN Correct! Welcome to ATM.");
    }

    @GetMapping("/balance")
    public Map<String, Object> balance(HttpSession session) {

        if (!loggedIn(session))
            return message(false, "Please login first.");

        Map<String, Object> result = message(true, "Balance fetched.");
        result.put("balance", session.getAttribute("balance"));

        return result;
    }

    private Map<String, Object> transaction(
            String type, double amount, HttpSession session) {

        double balance = (double) session.getAttribute("balance");

        Map<String, Object> receipt = new HashMap<>();
        receipt.put("type", type);
        receipt.put("amount", amount);
        receipt.put("balance", balance);
        receipt.put("time", new Date().toString());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> list =
                (List<Map<String, Object>>) session.getAttribute("transactions");

        list.add(receipt);
        session.setAttribute("transactions", list);

        Map<String, Object> result =
                message(true, type + " successful!");

        result.put("receipt", receipt);

        return result;
    }

    @PostMapping("/withdraw")
    public Map<String, Object> withdraw(
            @RequestBody Map<String, Double> data,
            HttpSession session) {

        if (!loggedIn(session))
            return message(false, "Please login first.");

        Double amount = data.get("amount");

        if (amount == null || !Double.isFinite(amount) || amount <= 0)
            return message(false, "Invalid amount!");

        double balance = (double) session.getAttribute("balance");

        if (amount > balance)
            return message(false, "Insufficient balance!");

        balance -= amount;
        session.setAttribute("balance", balance);

        return transaction("Withdrawal", amount, session);
    }

    @PostMapping("/deposit")
    public Map<String, Object> deposit(
            @RequestBody Map<String, Double> data,
            HttpSession session) {

        if (!loggedIn(session))
            return message(false, "Please login first.");

        Double amount = data.get("amount");

        if (amount == null || !Double.isFinite(amount) || amount <= 0)
            return message(false, "Invalid amount!");

        double balance = (double) session.getAttribute("balance");

        balance += amount;
        session.setAttribute("balance", balance);

        return transaction("Deposit", amount, session);
    }

    @GetMapping("/statement")
    public Map<String, Object> statement(HttpSession session) {

        if (!loggedIn(session))
            return message(false, "Please login first.");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> list =
                (List<Map<String, Object>>) session.getAttribute("transactions");

        List<Map<String, Object>> lastFive =
                new ArrayList<>(list.subList(
                        Math.max(0, list.size() - 5), list.size()));

        Map<String, Object> result = message(true, "Mini Statement");
        result.put("transactions", lastFive);

        return result;
    }

    @PostMapping("/change-pin")
    public Map<String, Object> changePin(
            @RequestBody Map<String, Integer> data,
            HttpSession session) {

        if (!loggedIn(session))
            return message(false, "Please login first.");

        Integer oldPin = data.get("oldPin");
        Integer newPin = data.get("newPin");

        int currentPin = session.getAttribute("currentPin") == null
                ? 1212 : (int) session.getAttribute("currentPin");

        if (oldPin == null || newPin == null || oldPin != currentPin)
            return message(false, "Old PIN is incorrect!");

        if (newPin < 1000 || newPin > 9999 || newPin.equals(oldPin))
            return message(false, "Enter a different 4-digit PIN.");

        session.setAttribute("currentPin", newPin);

        return message(true, "PIN changed successfully!");
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpSession session) {

        session.invalidate();

        return message(true, "Logged out successfully!");
    }
}
