// backend/utils/formatContact.js
// Clean up customer contact details before sending them to payment providers.

// "  Jhon Cedric   Susmerano " -> "Jhon Cedric Susmerano"
const cleanName = (name) => String(name || "").replace(/\s+/g, " ").trim().slice(0, 100);

/**
 * Normalize a Philippine mobile number to international (E.164) format: +639XXXXXXXXX
 * Accepts what customers actually type:
 *   09686795190, 0968 679 5190, 0968-679-5190, 9686795190,
 *   639686795190, +639686795190, +63 09686795190 (extra 0 after +63)
 * Returns null if it isn't a valid PH mobile number (the phone is optional for PayMongo,
 * so it's better to send nothing than something invalid).
 */
const toPhMobileE164 = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/[^\d+]/g, "");
  const hadPlus = digits.startsWith("+");
  digits = digits.replace(/\+/g, "");

  if (digits.startsWith("63")) digits = digits.slice(2);      // country code
  else if (hadPlus) return null;                             // +<other country>: leave it out
  if (digits.startsWith("0")) digits = digits.slice(1);      // local trunk 0 (also "+63 0...")

  // PH mobile numbers: 10 digits starting with 9 (e.g. 968 679 5190)
  return /^9\d{9}$/.test(digits) ? `+63${digits}` : null;
};

/**
 * Philippine mobile number in LOCAL format: 09XXXXXXXXX (11 digits).
 * This is the format PayMongo's checkout accepted in testing: its form shows "+63" as a fixed
 * label and expects the local number after it. Sending "+639..." made the page unusable.
 */
const toPhMobileLocal = (phone) => {
  const e164 = toPhMobileE164(phone);
  return e164 ? `0${e164.slice(3)}` : null; // +639686795190 -> 09686795190
};

module.exports = { cleanName, toPhMobileE164, toPhMobileLocal };
