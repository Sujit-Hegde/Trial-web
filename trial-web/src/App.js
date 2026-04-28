import { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";

const BASE ="https://trial-web-1.onrender.com";

function App() {
  const [online, setOnline] = useState(false);
  const [power, setPower] = useState(null);
  const [motorSpeed, setMotorSpeed] = useState(null);
  const [servoStatus, setServoStatus] = useState("Unfolded");

  const [maxPulse, setMaxPulse] = useState(1.1);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);
  const joystickRef = useRef(null);
  const lastSentMaxPulseRef = useRef(null);
  const lastSendAtRef = useRef(0);

const [holdTime, setHoldTime] = useState("");
const [submittedHoldTime, setSubmittedHoldTime] = useState(null);

  const MIN_MAX_PULSE = 1.1;
  const MAX_MAX_PULSE = 1.5;
  const JOYSTICK_LIMIT = 40;
  const MAXPULSE_PUSH_INTERVAL_MS = 120;

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
          if (!isDraggingJoystick && data.motor && typeof data.motor.maxPulse === "number") {
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
  }, [isDraggingJoystick]);

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

  const clampMaxPulse = (value) => {
    return Math.min(MAX_MAX_PULSE, Math.max(MIN_MAX_PULSE, Number(value)));
  };

  const mapPulseToJoystickY = useCallback((value) => {
    const clamped = clampMaxPulse(value);
    const ratio = (clamped - MIN_MAX_PULSE) / (MAX_MAX_PULSE - MIN_MAX_PULSE);
    return (1 - ratio * 2) * JOYSTICK_LIMIT;
  }, [MIN_MAX_PULSE, MAX_MAX_PULSE, JOYSTICK_LIMIT]);

  const postMaxPulse = async (value, options = {}) => {
    const { silentSuccess = true } = options;
    const numeric = Number(value);
    if (isNaN(numeric)) {
      if (!silentSuccess) {
        alert("Invalid maxPulse value");
      }
      return;
    }

    const clamped = clampMaxPulse(numeric);
    setMaxPulse(clamped);

    lastSentMaxPulseRef.current = clamped;
    lastSendAtRef.current = Date.now();

    try {
      const res = await fetch(BASE + "/motor/maxPulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPulse: clamped })
      });

      if (!res.ok) {
        throw new Error("Failed to update maxPulse");
      }

      if (!silentSuccess) {
        alert(`Max pulse set to ${clamped.toFixed(2)} ms`);
      }
    } catch (error) {
      console.error("Error updating maxPulse:", error);
      lastSentMaxPulseRef.current = null;
      if (!silentSuccess) {
        alert("Error updating maxPulse on server");
      }
    }
  };

  useEffect(() => {
    if (!isDraggingJoystick) {
      setJoystickPos({ x: 0, y: mapPulseToJoystickY(maxPulse) });
    }
  }, [maxPulse, isDraggingJoystick, mapPulseToJoystickY]);

  const updateJoystickFromPointer = (event) => {
    const base = joystickRef.current;
    if (!base) {
      return;
    }

    const rect = base.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const dy = event.clientY - centerY;
    const constrainedY = Math.max(-JOYSTICK_LIMIT, Math.min(JOYSTICK_LIMIT, dy));

    setJoystickPos({ x: 0, y: constrainedY });

    const normalizedY = Math.max(-1, Math.min(1, -constrainedY / JOYSTICK_LIMIT));
    const nextPulse = MIN_MAX_PULSE + ((normalizedY + 1) / 2) * (MAX_MAX_PULSE - MIN_MAX_PULSE);
    const rounded = Number(nextPulse.toFixed(2));
    setMaxPulse(rounded);

    const now = Date.now();
    const shouldPush =
      now - lastSendAtRef.current >= MAXPULSE_PUSH_INTERVAL_MS &&
      rounded !== lastSentMaxPulseRef.current;

    if (shouldPush) {
      postMaxPulse(rounded, { silentSuccess: true });
    }
  };

  const handleJoystickPointerDown = (event) => {
    setIsDraggingJoystick(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateJoystickFromPointer(event);
  };

  const handleJoystickPointerMove = (event) => {
    if (!isDraggingJoystick) {
      return;
    }
    updateJoystickFromPointer(event);
  };

  const handleJoystickPointerUp = (event) => {
    setIsDraggingJoystick(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    handleMaxPulseSubmit(maxPulse, { silentSuccess: true });
  };

  const handleMaxPulseSubmit = async (value = maxPulse, options = {}) => {
    await postMaxPulse(value, options);
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
          <div className="joystick-wrapper">
            <div
              ref={joystickRef}
              className="joystick-base"
              onPointerDown={handleJoystickPointerDown}
              onPointerMove={handleJoystickPointerMove}
              onPointerUp={handleJoystickPointerUp}
              onPointerCancel={handleJoystickPointerUp}
            >
              <div className="joystick-crosshair-x"></div>
              <div className="joystick-crosshair-y"></div>
              <div
                className="joystick-knob"
                style={{ transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)` }}
              ></div>
            </div>
          </div>
          <p className="maxpulse-value-display">Value: {maxPulse.toFixed(2)} ms</p>
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
      </div>
    </div>
  );
}

export default App;