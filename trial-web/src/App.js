import { useEffect, useState } from "react";
import "./App.css";

const BASE = "https://trial-web-1.onrender.com";

function App() {
  const [online, setOnline] = useState(false);
  const [power, setPower] = useState(null);
  const [motorSpeed, setMotorSpeed] = useState(null);
  const [servoStatus, setServoStatus] = useState("Unfolded");

const [holdTime, setHoldTime] = useState("");
const [submittedHoldTime, setSubmittedHoldTime] = useState(null);

  // CHECK STATUS
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(BASE + "/status");
        const data = await res.json();
        setOnline(data.online);
        // setPower(data.power); // Temporarily disabled to prevent overwriting optimistic UI
        // setMotorSpeed(data.motorSpeed); // Temporarily disabled to prevent overwriting optimistic UI
      } catch (error) {
        console.error("Error fetching status:", error);
        setOnline(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const sendPower = (state) => {
    setPower(state);
    fetch(BASE + "/power", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ power: state }),
    });
  };

  const foldServo = () => {
    setServoStatus("Folded");
    fetch(BASE + "/servo", { method: "POST" });
  };

  const resetServo = () => {
    setServoStatus("Unfolded");
    // Optionally, you can send a request to the backend to unfold the servo
    // fetch(BASE + "/servo-unfold", { method: "POST" });
  };

  const sendMotorState = (power) => {
    if (power === "ON" && submittedHoldTime === null) {
      alert("Please enter and submit a hold time first.");
      return;
    }
    setMotorSpeed(power);
    fetch(BASE + "/motor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ power, holdTime: submittedHoldTime }),
    });
  };

  const handleHoldTimeSubmit = () => {
    if (holdTime === "" || holdTime < 0 || holdTime > 9) {
      alert("Please enter a valid hold time between 0 and 9.");
      return;
    }
    setSubmittedHoldTime(holdTime);
    alert(`Hold time of ${holdTime} seconds submitted.`);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Foldable Rotary Origami Wing Dashboard</h1>
        <div className={`status ${online ? "online" : "offline"}`}>
          {online ? "🟢 Connected" : "🔴 Offline"}
        </div>
      </header>

      <div className="controls">
        {/* POWER */}
        <div className="control-group">
          <h2>Power: <span className="current-power">{power || "Off"}</span></h2>
          <div className="button-group">
            <button
              onClick={() => sendPower("ON")}
              className={power === "ON" ? "active" : ""}
            >
              ON
            </button>
            <button
              onClick={() => sendPower("OFF")}
              className={power === "OFF" ? "active" : ""}
            >
              OFF
            </button>
          </div>
        </div>

        {/* SERVO */}
        <div className="control-group">
          <h2>Servo: <span className="current-servo-status">{servoStatus}</span></h2>
          <div className="button-group">
            <button onClick={foldServo}>FOLD</button>
            <button onClick={resetServo}>RESET</button>
          </div>
        </div>

        {/* HOLD TIME */}
        <div className="control-group">
          <h2>Hold Time</h2>
          <div className="input-group">
            <input
              type="number"
              id="holdTime"
              value={holdTime}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || (value >= 0 && value <= 9)) {
                  setHoldTime(value);
                }
              }}
              max="9"
              placeholder="0-9"
            />
            <button onClick={handleHoldTimeSubmit}>Submit</button>
          </div>
        </div>

        {/* MOTOR */}
        <div className="control-group">
          <h2>BLDC Motor: <span className="current-speed">{motorSpeed || "Off"}</span></h2>
          <div className="button-group">
            <button
              onClick={() => sendMotorState("ON")}
              className={motorSpeed === "ON" ? "active" : ""}
            >
              ON
            </button>
            <button
              onClick={() => sendMotorState("OFF")}
              className={motorSpeed === "OFF" ? "active" : ""}
            >
              OFF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;