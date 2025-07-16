import React, { useState } from "react";
import HomePage from "./HomePage.jsx";
import UserPage from "./UserPage.jsx";

function App() {
  const [page, setPage] = useState("home");

  const handleLogin = () => setPage("user");
  const handleBackToHome = () => setPage("home");

  return (
    <div className="App">
      {page === "home" ? (
        <HomePage onLogin={handleLogin} />
      ) : (
        <UserPage onBack={handleBackToHome} />
      )}
    </div>
  );
}

export default App;