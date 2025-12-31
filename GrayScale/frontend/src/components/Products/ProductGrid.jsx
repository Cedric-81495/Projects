import { Link } from "react-router-dom";

const ProductGrid = ({ products, loading, error }) => {
    if (loading) {
        return <p className="text-center">Loading..</p>
    }

    if (error) {
        return <p className="text-center">Error: {error} </p>
    }
  return (
    <div className="grid  grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-5">
        {products.map((product, index) => (
            <Link key={index} to={`/product/${product._id}`} >
                <div className="bg-white p-4 rounded-lg">
                    <div className="w-full h-96 md:w-[250px] md:h-[300px] lg:w-[300px] lg:h-[290px] mb-4">
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