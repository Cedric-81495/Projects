import { formatPeso, getUnitPrice, isOnSale } from "../../utils/price";

// Shows "₱1,199  ~~₱1,399~~" on sale, otherwise just "₱1,399"
const PriceTag = ({ product, className = "", large = false }) => {
  if (!product) return null;
  const unitPrice = getUnitPrice(product);

  return (
    <p className={`flex items-baseline gap-2 ${className}`}>
      <span className={large ? "text-2xl font-semibold" : "font-medium"}>
        {formatPeso(unitPrice)}
      </span>
      {isOnSale(product) && (
        <span className={`line-through text-gray-500 ${large ? "text-base" : "text-sm"}`}>
          {formatPeso(product.price)}
        </span>
      )}
    </p>
  );
};

export default PriceTag;
