const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let state = { led: "OFF" };

// Update state from frontend
app.post("/update", (req, res) => {
  state = req.body;
  console.log("Updated state:", state);
  res.json({ message: "State updated" });
});

// Send state to Pico W
app.get("/state", (req, res) => {
  res.json(state);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});