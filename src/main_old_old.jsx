import React        from "react";
import ReactDOM     from "react-dom/client";
import { BrowserRouter } from "react-router-dom";   // ← add
import App          from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>   {/* ← router context */}
    <App />
  </BrowserRouter>
);

