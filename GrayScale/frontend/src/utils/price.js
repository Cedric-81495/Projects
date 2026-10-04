// Mirrors backend/services/pricingService.js getUnitPrice() so the price shown is the
// price charged: the sale price when discountPrice is a real discount, else the regular price.
export const getUnitPrice = (product) => {
  const price = Number(product?.price);
  const sale = Number(product?.discountPrice);
  if (Number.isFinite(sale) && sale > 0 && sale < price) return sale;
  return Number.isFinite(price) ? price : 0;
};

export const isOnSale = (product) => getUnitPrice(product) < Number(product?.price);

export const formatPeso = (amount) =>
  `₱${Number(amount || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
