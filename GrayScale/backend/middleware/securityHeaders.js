// backend/middleware/securityHeaders.js
// Browser security headers via helmet.
//
// Content-Security-Policy starts in REPORT-ONLY mode: browsers log violations in the
// console but block nothing, so a missed PayPal/Google domain can't break checkout.
// After checking your live site's console for a while, set CSP_ENFORCE=true to enforce.
//
// NOTE: these headers apply to pages THIS server sends (e.g. Render serving frontend/dist).
// If the frontend is hosted separately (e.g. Vercel), add the same headers in vercel.json.
const helmet = require("helmet");

const directives = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"], // no one may embed the store in an iframe (clickjacking)
  formAction: ["'self'"],
  scriptSrc: [
    "'self'",
    "https://www.paypal.com",
    "https://*.paypal.com",
    "https://*.paypalobjects.com",
    "https://accounts.google.com",
  ],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
    "https://res.cloudinary.com",
    "https://*.paypal.com",
    "https://*.paypalobjects.com",
    "https://*.googleusercontent.com",
  ],
  connectSrc: ["'self'", "https://*.paypal.com", "https://accounts.google.com"],
  frameSrc: ["https://www.paypal.com", "https://*.paypal.com", "https://accounts.google.com"],
  upgradeInsecureRequests: [],
};

const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives,
    reportOnly: process.env.CSP_ENFORCE !== "true",
  },
  // helmet's default "same-origin" breaks the Google Sign-In and PayPal popups
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  // Strict-Transport-Security only when served over HTTPS in production
  strictTransportSecurity:
    process.env.NODE_ENV === "production" ? { maxAge: 15552000, includeSubDomains: true } : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

module.exports = { securityHeaders };
