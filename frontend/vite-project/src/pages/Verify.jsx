import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Verify() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/url/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortCode, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to the original URL
        window.location.href = data.longUrl;
      } else {
        setError(data.msg || "Incorrect password");
      }
    } catch (err) {
      setError("Server error, try again later.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 300,
        margin: "50px auto",
      }}
    >
      <h2>Enter Password</h2>
      <input
        type="password"
        placeholder="Enter your password here"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: "8px", marginBottom: "10px" }}
      />

      <button onClick={handleVerify} style={{ padding: "8px" }}>
        Submit
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
