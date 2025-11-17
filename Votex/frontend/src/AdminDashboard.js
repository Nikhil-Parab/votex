import React, { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Fetch results from backend
    fetch("http://localhost:5000/api/results") // Replace with your API endpoint
      .then((res) => res.json())
      .then((data) => setResults(data))
      .catch((error) => console.error("Error fetching results:", error));
  }, []);

  return (
    <div style={styles.container}>
      <h1>Election Results</h1>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Party Name</th>
            <th>Votes</th>
          </tr>
        </thead>
        <tbody>
          {results.map((party, index) => (
            <tr key={index}>
              <td>{party.name}</td>
              <td>{party.votes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { padding: "20px", textAlign: "center" },
  table: { width: "80%", margin: "20px auto", borderCollapse: "collapse" }
};
