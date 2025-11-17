import React, { useState } from "react";

export default function PartyAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", phone: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLogin) {
      alert(`Login Successful!\nParty Name: ${formData.name}`);
    } else {
      alert(`Registered Successfully!\nParty: ${formData.name}\nPhone: ${formData.phone}`);
    }

    // Reset form fields
    setFormData({ name: "", phone: "", password: "" });
    // Integrate with backend later
  };

  return (
    <div style={styles.container}>
      <h2>{isLogin ? "Party Login" : "Register Party"}</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="name"
          placeholder="Party Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        {!isLogin && (
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            pattern="[0-9]{10}"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        )}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">{isLogin ? "Login" : "Register"}</button>
      </form>

      <p
        onClick={() => {
          setIsLogin(!isLogin);
          setFormData({ name: "", phone: "", password: "" });
        }}
        style={styles.toggle}
      >
        {isLogin ? "New party? Register here" : "Already registered? Login"}
      </p>
    </div>
  );
}

const styles = {
  container: { width: "300px", margin: "100px auto", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  toggle: {
    color: "blue",
    cursor: "pointer",
    textDecoration: "underline",
    marginTop: "10px"
  }
};
