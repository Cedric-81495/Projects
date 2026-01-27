// frontend/src/components/GoogleLoginButton.jsx
import React, { useEffect } from "react";

/* onLoginSuccess will dispatch your loginWithGoogle thunk */
const GoogleLoginButton = ({ onLoginSuccess }) => {
 useEffect(() => {
  const interval = setInterval(() => {
    if (window.google) {
      clearInterval(interval);

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        { theme: "outline", size: "large" }
      );
    }
  }, 100);

  function handleCredentialResponse(response) {
    onLoginSuccess(response.credential);
  }

  return () => clearInterval(interval);
}, [onLoginSuccess]);

  return <div id="google-signin-button"></div>;
};

export default GoogleLoginButton;
