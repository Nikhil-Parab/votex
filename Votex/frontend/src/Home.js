import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1>Welcome to the Voting Portal</h1>
      <div style={styles.buttonGroup}>
        <button style={styles.button} onClick={() => navigate("/user")}>
          User Login / Register
        </button>
        <button style={styles.button} onClick={() => navigate("/party")}>
          Party Login / Register
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "100px"
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "30px"
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer"
  }
};
