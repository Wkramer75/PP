import React from "react";
import ScrapingForm from "./components/ScrapingForm";

const styles = {
  app: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#1a1a2e",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    color: "#666",
    marginTop: "0.5rem",
  },
};

function App() {
  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>Sales Prospecting Tool</h1>
        <p style={styles.subtitle}>Module Scraping — V1</p>
      </header>
      <ScrapingForm />
    </div>
  );
}

export default App;
