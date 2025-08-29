import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId =
  "1025012127670-8pv7poj127e87cqck5bhimv9qne6n65r.apps.googleusercontent.com";

if (!googleClientId) {
  // Surface a clear error during development if the client ID is missing
  // eslint-disable-next-line no-console
  console.error(
    "Missing VITE_GOOGLE_CLIENT_ID env var. Set it in your environment."
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <App />
    </GoogleOAuthProvider>
    <Toaster position="top-right" richColors closeButton />
  </StrictMode>
);
