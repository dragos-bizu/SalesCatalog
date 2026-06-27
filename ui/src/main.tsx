import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { installTokenProvider } from "./app/authBootstrap";

// Plug the api client into the Redux auth slice so admin requests get the
// current id token automatically.
installTokenProvider();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
