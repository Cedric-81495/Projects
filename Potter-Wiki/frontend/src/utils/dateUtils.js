// frontend/src/utils/dateUtils.js

export const formatDate = (dateStr) => {
  if (!dateStr || !dateStr.includes("-")) return dateStr;

  const [day, month, year] = dateStr.split("-");
  const isoDate = `${year}-${month}-${day}`; // YYYY-MM-DD
  const date = new Date(isoDate);

  if (isNaN(date)) return dateStr;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};