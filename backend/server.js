const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// GLOBAL STATE
let state = {
  power: "OFF",
  servo: "STOP",
  motor: "STOP",
  lastSeen: Date.now()
};

// -----------------------------
// PICO FETCH STATE
// -----------------------------
app.get("/state", (req, res) => {
  state.lastSeen = Date.now();
  res.json(state);
});

// -----------------------------
// POWER CONTROL
// -----------------------------
app.post("/power", (req, res) => {
  state.power = req.body.power; // ON / OFF
  res.json({ message: "Power updated" });
});

// -----------------------------
// SERVO CONTROL
// -----------------------------
app.post("/servo", (req, res) => {
  state.servo = "FOLD";
  res.json({ message: "Servo triggered" });
});

// -----------------------------
// MOTOR CONTROL
// -----------------------------
app.post("/motor", (req, res) => {
  const { speed } = req.body;
  if (["slow", "medium"].includes(speed)) {
    state.motor = speed; // slow/medium
    res.json({ message: "Motor updated" });
  } else {
    res.status(400).json({ message: "Invalid speed" });
  }
});

// -----------------------------
// RESET COMMANDS (PICO USE)
// -----------------------------
app.post("/reset", (req, res) => {
  state.servo = "STOP";
  res.json({ message: "Reset done" });
});

// -----------------------------
// STATUS FOR FRONTEND
// -----------------------------
app.get("/status", (req, res) => {
  const now = Date.now();
  const online = now - state.lastSeen < 5000;
  res.json({ online });
});

app.listen(3000, () => console.log("Server running"));