import { useEffect, useRef, useState, useMemo } from "react";
import { FaFilter } from "react-icons/fa";
import FilterSideBar from "../components/Products/FilterSideBar";
import SortOptions from "../components/Products/SortOptions";
import ProductGrid from "../components/Products/ProductGrid";
import { useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../../redux/slices/productsSlice";

const CollectionPage = () => {
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);

  // Use stringified searchParams as stable dependency
  const queryParams = useMemo(
    () => Object.fromEntries([...searchParams]),
    [searchParams]
  );

  const sidebarRef = useRef(null);
  const buttonRef = useRef(null);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(fetchProductsByFilters({ collection, ...queryParams }));
    }, 200); // debounce to smooth out rapid changes

    return () => clearTimeout(timeout);
  }, [dispatch, collection, queryParams]);

  const toggleSidebar = () => setIsSideBarOpen((prev) => !prev);

  const handleClickOutside = (e) => {
    if (
      sidebarRef.current &&
      !sidebarRef.current.contains(e.target) &&
      buttonRef.current &&
      !buttonRef.current.contains(e.target)
    ) {
      setIsSideBarOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

return (
    <div className="flex flex-col lg:flex-row">
      {/*Mobile Filter button  */}
      <button 
        ref={buttonRef}
        onClick={toggleSidebar}
        className="lg:hidden border p-2 flex justify-center items-center">
        <FaFilter className="mr-2"/>Filters
      </button>

      {/* Filter Side Bar*/}
      <div 
        ref={sidebarRef}
        className={`${isSideBarOpen ? "translate-x-0" : "-translate-x-full"}
          fixed inset-y-0 z-50 left-0
          w-[200px] flex-shrink-0
          bg-gray-200 overflow-y-auto
          transition-transform duration-300
          lg:static lg:translate-x-0`}
      >
        <FilterSideBar />
      </div>

      <div className="flex-grow p-4">
        <h2 className="text-2xl uppercase">Mens Collection</h2>

        {/* Sort Options */}
        <SortOptions />

        {/*{loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}*/}
        {!loading && !error && products.length === 0 && (
          <p className="text-center text-gray-500">
            No products found for the selected filters.
          </p>
        )}

        {products.length > 0 && (
          <ProductGrid products={products} loading={loading} error={error} />
        )}
      </div>
    </div>
  );
};

export default CollectionPage;