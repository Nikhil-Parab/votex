import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import AuthForm from "./AuthForm";
import PartyAuth from "./PartyAuth";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user" element={<AuthForm />} />
        <Route path="/party" element={<PartyAuth />} />
      </Routes>
    </Router>
  );
}

export default App;
