import { useEffect, useState } from "react";
import "./App.css";

const BASE ="https://trial-web-1.onrender.com";

function App() {
  const [online, setOnline] = useState(false);
  const [power, setPower] = useState(null);
  const [motorSpeed, setMotorSpeed] = useState(null);
  const [servoStatus, setServoStatus] = useState("Unfolded");
  const [gyro, setGyro] = useState({ x: 0, y: 0, z: 0, timestamp: null });
  const [gyroError, setGyroError] = useState(false);

  const [maxPulse, setMaxPulse] = useState(1.1);

const [holdTime, setHoldTime] = useState("");
const [submittedHoldTime, setSubmittedHoldTime] = useState(null);

  const MIN_MAX_PULSE = 1.1;
  const MAX_MAX_PULSE = 1.5;
  const STEP_MAX_PULSE = 0.05;

  // CHECK STATUS
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(BASE + "/state");
        const data = await res.json();
        const now = Date.now();
        const isOnline = now - data.lastSeen < 5000;
        setOnline(isOnline);

        if (isOnline) {
          setPower(data.power);
          setMotorSpeed(data.motor.power);
          if (data.motor && typeof data.motor.maxPulse === "number") {
            setMaxPulse(data.motor.maxPulse);
          }
          // Do not overwrite servoStatus here; it is controlled
          // only by the FOLD / RESET buttons in the UI.
        }
      } catch (error) {
        console.error("Error fetching state:", error);
        setOnline(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // LIVE GYRO DATA
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(BASE + "/gyro");
        if (!res.ok) {
          throw new Error("Failed to fetch gyro");
        }

        const data = await res.json();
        setGyro({
          x: Number(data.x ?? 0),
          y: Number(data.y ?? 0),
          z: Number(data.z ?? 0),
          timestamp: data.timestamp ?? null
        });
        setGyroError(false);
      } catch (error) {
        console.error("Error fetching gyro:", error);
        setGyroError(true);
      }
    }, 1000);

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
    fetch(BASE + "/servo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "FOLD" }),
    });
  };

  const resetServo = () => {
    setServoStatus("Unfolded");
    fetch(BASE + "/servo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "UNFOLD" }),
    });
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

  const handleIncreaseMaxPulse = () => {
    setMaxPulse((prev) => {
      const next = Math.min(MAX_MAX_PULSE, (Number(prev) || MIN_MAX_PULSE) + STEP_MAX_PULSE);
      return Number(next.toFixed(2));
    });
  };

  const handleDecreaseMaxPulse = () => {
    setMaxPulse((prev) => {
      const next = Math.max(MIN_MAX_PULSE, (Number(prev) || MIN_MAX_PULSE) - STEP_MAX_PULSE);
      return Number(next.toFixed(2));
    });
  };

  const handleMaxPulseSubmit = async () => {
    const numeric = Number(maxPulse);
    if (isNaN(numeric)) {
      alert("Invalid maxPulse value");
      return;
    }

    const clamped = Math.min(MAX_MAX_PULSE, Math.max(MIN_MAX_PULSE, numeric));
    setMaxPulse(clamped);

    try {
      const res = await fetch(BASE + "/motor/maxPulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPulse: clamped })
      });

      if (!res.ok) {
        throw new Error("Failed to update maxPulse");
      }

      alert(`Max pulse set to ${clamped.toFixed(2)} ms`);
    } catch (error) {
      console.error("Error updating maxPulse:", error);
      alert("Error updating maxPulse on server");
    }
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

        {/* MAX PULSE */}
        <div className="control-group">
          <h2>Max Pulse (ms)</h2>
          <div className="maxpulse-group">
            <button onClick={handleDecreaseMaxPulse}>-</button>
            <span className="maxpulse-value">{maxPulse.toFixed(2)}</span>
            <button onClick={handleIncreaseMaxPulse}>+</button>
          </div>
          <div className="button-group" style={{ marginTop: "10px" }}>
            <button onClick={handleMaxPulseSubmit}>Submit</button>
          </div>
          <p className="maxpulse-range">Range: {MIN_MAX_PULSE.toFixed(1)} – {MAX_MAX_PULSE.toFixed(1)}</p>
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

        {/* GYRO LIVE DATA */}
        <div className="control-group gyro-group">
          <h2>Gyro Live Data</h2>
          <div className="gyro-grid">
            <div className="gyro-item">
              <span className="gyro-label">X</span>
              <span className="gyro-value">{gyro.x.toFixed(2)}</span>
            </div>
            <div className="gyro-item">
              <span className="gyro-label">Y</span>
              <span className="gyro-value">{gyro.y.toFixed(2)}</span>
            </div>
            <div className="gyro-item">
              <span className="gyro-label">Z</span>
              <span className="gyro-value">{gyro.z.toFixed(2)}</span>
            </div>
          </div>
          <p className="gyro-timestamp">
            Last update: {gyro.timestamp ? new Date(gyro.timestamp).toLocaleTimeString() : "No data yet"}
          </p>
          {gyroError && <p className="gyro-error">Unable to fetch gyro data from backend.</p>}
        </div>
      </div>
    </div>
  );
}

export default App;