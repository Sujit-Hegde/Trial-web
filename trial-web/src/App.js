// App.js
import { useState } from "react";

function App() {
  const [status, setStatus] = useState("OFF");

  const sendCommand = async (state) => {
    try {
      const res = await fetch("https://your-backend.onrender.com/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ led: state }),
      });

      if (res.ok) {
        setStatus(state);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Pico W Control</h1>

      <h2>Status: {status}</h2>

      <button onClick={() => sendCommand("ON")} style={{ margin: "10px" }}>
        Turn ON
      </button>

      <button onClick={() => sendCommand("OFF")} style={{ margin: "10px" }}>
        Turn OFF
      </button>
    </div>
  );
}

export default App;