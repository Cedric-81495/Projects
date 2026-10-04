import { useEffect, useState } from "react";
import PriceTag from "./PriceTag";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import ProductGrid from "./ProductGrid";
import {
  fetchProductDetails,
  fetchSimilarProducts,
} from "../../../redux/slices/productsSlice";
import { addToCart } from "../../../redux/slices/cartSlice";
import noImg from "../../assets/no-image.jpg";


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
    // Don't let the selector go past what's in stock (server enforces this too)
    const maxQty = Math.max(Number(selectedProduct?.countInStock) || 0, 1);
    if (action === "plus") setQuantity((prev) => Math.min(prev + 1, maxQty));
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
      // Show the server's reason (e.g. "Only 2 more available", "This item is out of stock")
      .catch((err) => toast.error(err?.message || "Failed to add product to cart.", { duration: 2500 }))
      .finally(() => setIsButtonDisabled(false));
  };
    
if (loading)
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
    </div>
  );

if (error)
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <p className="text-center text-lg text-red-600">Error: {error}</p>
    </div>
  );

  if (!selectedProduct) {
    return <p className="text-center py-12">No product found</p>;
  }

  const images = selectedProduct.images || [];

  const thumbnail = (image, index) => (
    <button
      key={index}
      type="button"
      onClick={() => setMainImage(image.url)}
      className={`shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 bg-gray-100 transition ${
        resolvedMainImage === image.url
          ? "border-black"
          : "border-transparent hover:border-gray-300"
      }`}
    >
      <img
        src={image.url || noImg}
        alt={image.altText || `Thumbnail ${index + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = noImg;
        }}
      />
    </button>
  );

  return (
    <section className="px-4 lg:px-12 py-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Gallery */}
          <div className="flex flex-col md:flex-row-reverse gap-4">
            {/* Main Image */}
            <div className="w-full md:flex-1 md:min-w-0">
              <div className="w-full aspect-square md:aspect-[4/5] md:max-h-[640px] rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={resolvedMainImage || noImg}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.src = noImg;
                  }}
                />
              </div>
            </div>

            {/* Thumbnails: row under the image on mobile, column on the left from md up */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                {images.map(thumbnail)}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-semibold mb-2">
              {selectedProduct.name}
            </h1>

            {/* Same rule the cart & checkout charge (utils/price.js) */}
            <PriceTag product={selectedProduct} large className="mb-3 text-gray-800" />

            <p className="text-base md:text-lg text-gray-600 mb-6 leading-relaxed">
              {selectedProduct.description}
            </p>

            {/* Colors */}
            <div className="mb-5">
              <p className="text-gray-700 font-medium">
                Color:{" "}
                {selectedColor && <span className="font-normal text-gray-500">{selectedColor}</span>}
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                {selectedProduct.colors.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      title={color}
                      aria-label={color}
                      className={`w-8 h-8 rounded-full transition-all duration-200 ${
                        isSelected
                          ? "ring-2 ring-black ring-offset-2 scale-110"
                          : "border border-gray-400 hover:scale-105 hover:ring-1 hover:ring-black"
                      }`}
                      style={{
                        backgroundColor: COLOR_MAP[color] || color.toLowerCase(),
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Sizes */}
            <div className="mb-5">
              <p className="text-gray-700 font-medium">Size:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedProduct.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[3rem] px-4 py-2 rounded border transition ${
                      selectedSize === size
                        ? "bg-black text-white border-black"
                        : "border-gray-300 hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-gray-700 font-medium">Quantity:</p>
              <div className="inline-flex items-center mt-2 border border-gray-300 rounded">
                <button
                  type="button"
                  onClick={() => handleQuantityChange("minus")}
                  className="w-10 h-10 text-lg hover:bg-gray-100"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-10 text-center text-lg">{quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange("plus")}
                  className="w-10 h-10 text-lg hover:bg-gray-100"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {selectedProduct.countInStock > 0 && selectedProduct.countInStock <= 5 && (
              <p className="text-sm text-red-600 mb-2">Only {selectedProduct.countInStock} left</p>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isButtonDisabled || selectedProduct.countInStock === 0}
              className={`bg-black text-white rounded py-3 px-6 w-full font-medium tracking-wide ${
                isButtonDisabled || selectedProduct.countInStock === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-900"
              }`}
            >
              {selectedProduct.countInStock === 0
                ? "OUT OF STOCK"
                : isButtonDisabled ? "ADDING..." : "ADD TO CART"}
            </button>

            {/* Characteristics */}
            <div className="mt-10 text-gray-700">
              <h3 className="text-xl font-bold mb-4">Characteristics</h3>
              <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
                <dt className="text-gray-500">Brand</dt>
                <dd className="text-gray-800">{selectedProduct.brand || "-"}</dd>
                <dt className="text-gray-500">Material</dt>
                <dd className="text-gray-800">{selectedProduct.material || "-"}</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* You May Also Like Section */}
        {similarProducts?.length > 0 && (
          <div className="mt-16 md:mt-20 pt-12 border-t border-gray-200">
            <h2 className="text-2xl md:text-3xl text-center font-bold mb-8 md:mb-10">You May Also Like</h2>
            <ProductGrid products={similarProducts.slice(0, 4)} loading={loading} error={error} />
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductDetails;