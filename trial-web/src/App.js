import { useEffect, useState } from "react";

const BASE = "https://trial-web-1.onrender.com";

function App() {
  const [online, setOnline] = useState(false);

  // CHECK STATUS
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(BASE + "/status");
      const data = await res.json();
      setOnline(data.online);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const sendPower = (state) => {
    fetch(BASE + "/power", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ power: state }),
    });
  };

  const foldServo = () => {
    fetch(BASE + "/servo", { method: "POST" });
  };

  const setMotor = (speed) => {
    fetch(BASE + "/motor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speed }),
    });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h1>Pico Control Panel</h1>

      {/* STATUS */}
      <h2>
        Status: {online ? "🟢 Connected" : "🔴 Offline"}
      </h2>

      {/* POWER */}
      <h3>Power</h3>
      <button onClick={() => sendPower("ON")}>ON</button>
      <button onClick={() => sendPower("OFF")}>OFF</button>

      {/* SERVO */}
      <h3>Servo</h3>
      <button onClick={foldServo}>FOLD</button>

      {/* MOTOR */}
      <h3>BLDC Motor</h3>
      <button onClick={() => setMotor("slow")}>Slow</button>
      <button onClick={() => setMotor("medium")}>Medium</button>
      <button onClick={() => setMotor("fast")}>Fast</button>
    </div>
  );
}

export default App;