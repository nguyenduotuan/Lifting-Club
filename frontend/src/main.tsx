import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/pages.css";

const savedTheme = window.localStorage.getItem("circuit-theme");
if (savedTheme === "steel" || savedTheme === "field" || savedTheme === "signal") {
  document.documentElement.dataset.theme = savedTheme;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);