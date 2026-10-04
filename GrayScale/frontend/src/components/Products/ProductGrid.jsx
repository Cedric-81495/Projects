import { Link } from "react-router-dom";
import PriceTag from "./PriceTag";
import noImg from "../../assets/no-image.jpg";

const ProductGrid = ({ products, loading, error }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  if (products.length === 0) {
    return <p className="text-center text-gray-500">No products found</p>;
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => {
        const image = product.images?.[0];
        return (
          <Link key={product._id} to={`/product/${product._id}`} className="group block">
            <div className="w-full aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={image?.url || noImg}
                alt={image?.altText || product.name}
                loading="lazy"
                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = noImg;
                }}
              />
            </div>
            <h3 className="text-sm mb-1 line-clamp-2">{product.name}</h3>
            <PriceTag product={product} className="text-gray-500 text-sm tracking-tighter" />
          </Link>
        );
      })}
    </div>
  );
};

export default ProductGrid;