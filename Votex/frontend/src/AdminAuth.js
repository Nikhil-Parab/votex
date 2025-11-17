import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminAuth() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate(); // 🟢 Use inside the component

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Temporary login validation
    if (formData.username === "admin" && formData.password === "admin123") {
      alert("Admin Logged In!");
      navigate("/admin/dashboard"); 
    } else {
      alert("Invalid Username or Password");
    }

    setFormData({ username: "", password: "" });
  };

  return (
    <div style={styles.container}>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="username"
          placeholder="Admin Username"
          onChange={handleChange}
          value={formData.username}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Admin Password"
          onChange={handleChange}
          value={formData.password}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

const styles = {
  container: { width: "250px", margin: "100px auto", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "10px" }
};
