import { useEffect, useState } from "react";
import Hero from "../components/Layout/Hero";
import FeaturedCollection from "../components/Products/FeaturedCollection";
import FeaturesSection from "../components/Products/FeaturesSection";
import GenderCollectionSection from "../components/Products/GenderCollectionSection";
import NewArrivals from "../components/Products/NewArrivals";
import ProductDetails from "../components/Products/ProductDetails";
import ProductGrid from "../components/Products/ProductGrid";
import { useDispatch, useSelector } from "react-redux"; 
import { fetchProductsByFilters } from "../../redux/slices/productsSlice";
import axiosInstance from "../utils/axiosInstance";

const Home = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [bestSellerProduct, setBestSellerProduct] = useState(null);

  useEffect(() => {
   // Fetch products for a specifc collection
   dispatch(
    fetchProductsByFilters({
      gender: "Women",
      category: "Bottom Wear",
      limit: 8,
    })
   );
   // Fetch best seller
   const fetchBestSeller = async () => {
    try {
      const response = await axiosInstance.get(
        `/api/products/best-seller`
      );
      console.log("Best Seller Response:", response.data);
      setBestSellerProduct(response.data);
    } catch (error) {
      console.log(error);
    }
   };
   fetchBestSeller();
  }, [dispatch]);

  return (
    <div>
      <Hero />
      <GenderCollectionSection />
      <NewArrivals />

      {/* Best Sellter */}
      <h2 className="text-3xl text-center font-bold mb-4">Best Seller</h2>
      {bestSellerProduct ? ( 
        <ProductDetails productId={bestSellerProduct._id} /> 
      ) : (
         <p className="text-center">No product found</p>
      )}
    
      {products.length > 0 ? (
        <div className="container mx-auto">
          <h2 className="text-3xl text-center font-bold mb-4">
            Top Wears for Women
          </h2>
          <ProductGrid products={products} loading={loading} error={error} />
        </div>
      ) : (
        !loading && !error && (
          <div className="container mx-auto">
            <p className="text-center">No product found</p>
          </div>
        )
      )}
      <FeaturedCollection />
      <FeaturesSection />
    </div>
  );
};

export default Home;