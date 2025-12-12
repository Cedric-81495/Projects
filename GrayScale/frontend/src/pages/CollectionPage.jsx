import { useEffect, useRef, useState } from "react";
import { FaFilter } from "react-icons/fa"
import FilterSideBar from "../components/Products/FilterSideBar";
import SortOptions from "../components/Products/SortOptions";
import ProductGrid from "../components/Products/ProductGrid";

const CollectionPage = () => {
  const [products, setProducts] = useState([]);
  const sidebarRef = useRef(null);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const buttonRef = useRef(null);

  const toggleSidebar = () => {
    setIsSideBarOpen(!isSideBarOpen);
  }

  const handleClickOutside = (e) => {
    // if the user clicked within the side bar don't close it
    if(sidebarRef.current && !sidebarRef.current.contains(e.target) &&
        buttonRef.current && 
        !buttonRef.current.contains(e.target)
    ) {
      setIsSideBarOpen(false);
    }
  };

  useEffect(() => {
    // Add Event listener for clicks
    document.addEventListener("mousedown", handleClickOutside);
    // Clean event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [])

  useEffect(() => {
    setTimeout(() => {
      const fetchProduct = [
        {
          _id: 1,
          name: "Product 1",
          price: 1800,
          images: [{ url: "https://picsum.photos/200/300?random=1" }],
        },
        {
           _id: 2,
            name: "Product 2",
            price: 1800,
            images: [{ url: "https://picsum.photos/200/300?random=2" }],
        },
        {
            _id: 3,
            name: "Product 3",
            price: 1800,
            images: [{ url: "https://picsum.photos/200/300?random=3" }],
        },
        {
            _id: 4,
            name: "Product 4",
            price: 1800,
            images: [{ url: "https://picsum.photos/200/300?random=4" }],
        },
        {
            _id: 5,
            name: "Product 5",
            price: 1800,
            images: [{ url: "https://picsum.photos/200/300?random=5" }],
        },
        {
            _id: 6,
            name: "Product 6",
            price: 1800,
            images: [{ url: "https://picsum.photos/200/300?random=6" }],
        }, 
        {
            _id: 7,
            name: "Product 7",
            price: 1800,
            images: [{ url: "https://picsum.photos/200/300?random=7" }],
        }, 
        {
            _id: 8,
            name: "Product 8",
            price: 1800,
            images: [{ url: "https://picsum.photos/200/300?random=8" }],
        },  
      ];
      setProducts(fetchProduct);
    }, 1000);
    
 
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
        className={`${isSideBarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 z-50 left-0 w-64 bg-white overflow-y-auto transition-transform duration-300
        lg:static lg:translate-x-0`}
      >
        <FilterSideBar />
      </div>
      <div className="flex-grow p-4">
        <h2 className="text-2xl uppercase mb-4">Mens Collection</h2>

        {/* Sort Options */}
        <SortOptions />

        {/* Product Grid */}
        <ProductGrid products={products}/>
      </div>
    </div>
  );
};

export default CollectionPage;