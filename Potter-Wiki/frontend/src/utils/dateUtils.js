// frontend/src/utils/dateUtils.js

export const formatDate = (dateStr) => {
  if (!dateStr) return "No date";

  let date;

  // 🧩 Check if it's already a valid ISO or timestamp
  if (!isNaN(Date.parse(dateStr))) {
    date = new Date(dateStr);
  } else if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    // Detect if first part looks like a year
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      date = new Date(dateStr);
    } else {
      // DD-MM-YYYY → convert to ISO
      const [day, month, year] = parts;
      date = new Date(`${year}-${month}-${day}`);
    }
  } else {
    return dateStr; // fallback if format unknown
  }

  if (isNaN(date)) return dateStr;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
