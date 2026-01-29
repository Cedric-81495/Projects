import { Link } from "react-router-dom";

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
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
  {products.map((product) => (
    <Link key={product._id} to={`/product/${product._id}`}>
      <div className="bg-white p-4 rounded-lg">
        <div className="w-full h-96 md:h-[300px] lg:h-[290px] mb-4">
          <img
            src={product.images[0].url}
            alt={product.images[0].altText || product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <h3 className="text-sm mb-2">{product.name}</h3>
        <p className="text-gray-500 font-medium text-sm tracking-tighter">
          ₱{product.price.toLocaleString()}
        </p>
      </div>
    </Link>
  ))}
</div>

  );
};

export default ProductGrid;