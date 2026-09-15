import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// this is used to render the app in the root element of the HTML file
// again this is a new way of rendering the app in React 18, using createRoot instead of ReactDOM.render
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
