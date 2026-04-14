const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// GLOBAL STATE
let state = {
  power: "OFF",
  servo: "STOP",
  motor: { power: "OFF", holdTime: 0, maxPulse: 1.1 },
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
  const { state: servoState } = req.body;
  if (["FOLD", "UNFOLD"].includes(servoState)) {
    state.servo = servoState;
    res.json({ message: `Servo state updated to ${servoState}` });
  } else {
    res.status(400).json({ message: "Invalid servo state" });
  }
});

// -----------------------------
// MOTOR CONTROL
// -----------------------------
app.post("/motor", (req, res) => {
  const { power, holdTime } = req.body;
  if (["ON", "OFF"].includes(power)) {
    state.motor = {
      ...state.motor,
      power,
      holdTime: parseInt(holdTime)
    };
    res.json({ message: "Motor updated" });
  } else {
    res.status(400).json({ message: "Invalid power state" });
  }
});

// -----------------------------
// MOTOR MAX PULSE CONTROL
// -----------------------------
app.post("/motor/maxPulse", (req, res) => {
  const { maxPulse } = req.body;
  const value = parseFloat(maxPulse);

  if (isNaN(value) || value < 1.1 || value > 1.5) {
    return res.status(400).json({ message: "Invalid maxPulse value" });
  }

  state.motor.maxPulse = value;
  res.json({ message: "maxPulse updated" });
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

app.listen(5000, () => console.log("Server running"));