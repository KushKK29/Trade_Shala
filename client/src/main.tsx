import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
// const id= import.meta.env.GOOGLE_CLIENT_ID;
const id='40261907168-bfruha2ttc4t3hi6neqa76l8fus2ohe1.apps.googleusercontent.com'
console.log("Google Client ID:", id);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={id}>
      <App />
      </GoogleOAuthProvider>
    <Toaster position="top-right" richColors closeButton />
    
  </StrictMode>
  
);