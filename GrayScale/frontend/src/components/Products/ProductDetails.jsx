import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import ProductGrid from "./ProductGrid";
import {
  fetchProductDetails,
  fetchSimilarProducts,
} from "../../../redux/slices/productsSlice";
import { addToCart } from "../../../redux/slices/cartSlice";
import PageWrapper from "../../pages/PageWrapper";


const ProductDetails = ({ productId }) => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { selectedProduct, similarProducts, loading, error } = useSelector(
    (state) => state.products
  );
  const { user, guestId } = useSelector((state) => state.auth);
  const [mainImage, setMainImage] = useState(null);
  const resolvedMainImage = mainImage ?? selectedProduct?.images?.[0]?.url;  
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const productFetchId = productId || id;

  const COLOR_MAP = {
    Black: "#000000",
    "Navy Blue": "#1f2a44",
    Burgundy: "#800020",
    Gray: "#808080",
    White: "#ffffff",
    "Light Blue": "#add8e6",
     "Dark Wash": "#2c3e50",
    "Tropical Print": "#00c9a7",
    "Navy Palms": "#1f4f82",
     
  };

  // Fetch product details & similar products
  useEffect(() => {
    if (productFetchId) {
      dispatch(fetchProductDetails(productFetchId));
      dispatch(fetchSimilarProducts(productFetchId));
      
    }
  }, [dispatch, productFetchId]);
 
  const handleQuantityChange = (action) => {
    if (action === "plus") setQuantity((prev) => prev + 1);
    if (action === "minus" && quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error("Please select size and color before adding to cart.", {
        duration: 1000,
      });
      return;
    }
    setIsButtonDisabled(true);

    dispatch(
      addToCart({
        productId: productFetchId,
        quantity,
        size: selectedSize,
        color: selectedColor,
        guestId,
        userId: user?._id,
      })
    )
      .unwrap()
      .then(() => toast.success("Product added to cart!", { duration: 1000 }))
      .catch(() => toast.error("Failed to add product to cart.", { duration: 1000 }))
      .finally(() => setIsButtonDisabled(false));
  };

  if (loading) return <p className="text-center pt-[20px]">Loading...</p>;
  if (error) return <p className="text-center pt-[20px]">Error: {error}</p>;

  return (
    <PageWrapper loading={loading}>
        <div className="p-6">
            {selectedProduct ? (
            <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg">
                <div className="flex flex-col md:flex-row">
                    {/* Left Thumbnail */}
                    {selectedProduct?.images?.length > 0 && (
                    <div className="hidden md:flex flex-col space-y-4 mr-6">
                        {selectedProduct.images.map((image, index) => (
                        <img
                            key={index}
                            src={image.url}
                            alt={image.altText || `Thumbnail ${index}`}
                            className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${
                            resolvedMainImage === image.url ? "border-black" : "border-gray-300"
                            }`}
                            onClick={() => setMainImage(resolvedMainImage)}
                        />
                        ))}
                    </div>
                    )}
                    {/* Main Image */}
                    <div className="md:w-1/2">
                        <div className="mb-4">
                            <img 
                                src={resolvedMainImage}
                                alt="Main Product"
                                className="w-[700px]] h-[600px] object-cover rounded-lg"
                            />
                        </div>
                    </div>
                    {/* Mobile Thumbnail */}
                    {selectedProduct?.images?.length > 0 && (
                    <div className="md:hidden flex overscroll-x-scroll space-x-4 mb-4">
                        {selectedProduct.images.map((image, index) => (
                        <img
                            key={index}
                            src={image.url}
                            alt={image.altText || `Thumbnail ${index}`}
                            className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${
                            resolvedMainImage === image.url ? "border-black" : "border-gray-300"
                            }`}
                            onClick={() => setMainImage(image.url)}
                        />
                        ))}
                    </div>
                    )}
                    {/* Right Side */}
                <div className="md:w-1/2 md:ml-10">
                    {/* Product Name */}
                    <h1 className='text-2xl md:text-3xl font-semibold mb-2'>
                        {selectedProduct.name}
                    </h1>
                     {/* Price */}
                    <p className='text-sm text-gray-600 mb-1 line-through'>
                        ₱{selectedProduct.price && `${selectedProduct.price.toLocaleString()}`}
                    </p>
                  
                    <p className='text-lg text-gray-500 mb-2'>
                      ₱{selectedProduct.discountPrice && `${selectedProduct.discountPrice.toLocaleString()}`}
                    </p>
                    <p className='text-lg text-gray-600 mb-1'>{selectedProduct.description}</p>
                   {/* Colors */}
               <div className="mb-4">
                <p className="text-gray-700 font-medium">Color:</p>
                    <div className="flex gap-2 mt-2">
                        {selectedProduct.colors.map((color) => {
                        const isSelected = selectedColor === color;

                        return (
                            <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            title={color}
                            className={`w-8 h-8 rounded-full transition-all duration-200
                                ${isSelected
                                ? "ring-2 ring-black ring-offset-2 scale-110"
                                : "border border-gray-400 hover:scale-105 hover:ring-1 hover:ring-black"
                                }
                            `}
                            style={{
                                backgroundColor: COLOR_MAP[color] || color.toLowerCase(),
                            }}
                            />
                        );
                        })}
                    </div>
                </div>


                    {/* Sizes */}
                    <div className='mb-4'>
                        <p className='text-gray-700'>Size:</p>
                        <div className='flex gap-2 mt-2'>
                                 {selectedProduct.sizes.map((size) => (
                            <button 
                                key={size} 
                                onClick={() => setSelectedSize(size)}
                                className={`px-4 py-2 rounded border ${
                                    selectedSize === size 
                                    ? "bg-black text-white border-black" 
                                    : "border-gray-300"
                                }`}>
                                {size}
                            </button>
                            ))}
                        </div>
                    </div>
                    {/* Quantity */}
                    <div className='mb-6'>
                        <p className='text-gray-700'>Quantity:</p>
                        <div className='flex items-center space-x-4 mt-2'>
                            <button 
                                onClick={() => handleQuantityChange("minus")}
                                className='px-2 p-1 bg-gray-200 rounded text-lg'>
                                -
                            </button>
                            <span className='text-lg'>{quantity}</span>
                             <button 
                                onClick={() => handleQuantityChange("plus")}
                                className='px-2 p-1 bg-gray-200 rounded text-lg'>
                                +
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={handleAddToCart}
                        className={`bg-black text-white rounded  py-2 px-6 w-full ${
                            isButtonDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-900"
                        }`}>
                          {isButtonDisabled ? "ADDING..." : "ADD TO CART"}
                    </button>

                    <div className='mt-10 text-gray-700'>
                        <h3 className='text-xl font-bold mb-4'>Chracteristics:</h3>
                        <table className='w-full text-left text-sm text-gray-600'>
                            <tbody>
                                <tr>
                                    <td className='py-1'>Brand</td>
                                    <td className='py-1'>{selectedProduct.brand}</td>
                                </tr>
                                   <tr>
                                    <td className='py-1'>Material</td>
                                    <td className='py-1'>{selectedProduct.material}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

                {/* You May Also Like Section */}
                <div className="mt-20">
                    <h2 className="text-2xl text-center font-medium mb-4">
                        You May Also Like
                    </h2>  
                    <ProductGrid  
                    
                    products={similarProducts}/>
                </div>
            </div>
            ) : (
                <p className="text-center">Loading product details...</p>
            )}
        </div>
    </PageWrapper>
  );
};

export default ProductDetails;