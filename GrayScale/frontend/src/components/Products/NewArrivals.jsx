import { useEffect, useRef, useState} from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

const NewArivals = () => {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    const fetchNewArrivals = async () => {
        try {
            const response = await axiosInstance.get(
                `/api/products/new-arrivals`
            );
            console.log("API response:", response.data);
            setNewArrivals(response.data);
        } catch (error) {
            console.log(error);
        }
    }
    fetchNewArrivals();
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if(!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startX;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleonMouseUporLeave = () => {
    setIsDragging(false);
  };    

  const handleonLeave = () => {
    setIsDragging(false);
  };

  const scroll = (direction) => {
    const scrollAmount = direction === "left" ? -300 : 300;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" }); 
  };
  // Update Scroll Buttons
  const updateScrollButtons = () => {
    const container = scrollRef.current;

    if(container) {
        const leftSCroll = container.scrollLeft;
        const rightSCrollable =
             leftSCroll + container.clientWidth < container.scrollWidth - 5;

        setCanScrollLeft(leftSCroll > 0);
        setCanScrollRight(rightSCrollable);
    }

    /* console.log({
            scrollLeft: container.scrollLeft,
            clientWidth: container.clientWidth,
            containerScrollWidth: container.scrollWidth,
            offsetLeft: scrollRef.current.scrollLeft,
    });*/
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
        container.addEventListener("scroll", updateScrollButtons);
        updateScrollButtons();

        return () => {
            container.removeEventListener("scroll", updateScrollButtons);
        }
    };
  }, [newArrivals]);
  return (
    <section className="py-12 px-4 lg:px-16">
        <div className="container mx-auto text-center mb-20 relative">
            <h2 className="text-3xl font-bold mb-4">Explore New Arrivals</h2>
            <p className="text-lg text-gray-600 mb-10">
                Discover the latest styles straight off the runway, 
                freshly added to keep your wardrobe on the cutting edege of fassion.
            </p>

            {/* Scroll Buttons */}
            <div className="absolute right-0 bottom-[-60px] flex space-x-2">
                <button 
                    onClick={() => scroll("left")} 
                    disabled={!canScrollLeft}
                    className={`p-2 rounded border ${
                        canScrollLeft 
                            ? "bg-white text-black" 
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    <FiChevronLeft className="text-2xl" />
                </button>
                <button 
                    onClick={() => scroll("right")} 
                    disabled={!canScrollRight}
                    className={`p-2 rounded border ${
                        canScrollRight 
                            ? "bg-white text-black" 
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    <FiChevronRight className="text-2xl" />
                </button>
            </div>
        </div>

        {/* Scrollable Contents */}
        <div 
            ref={scrollRef}
            className={`container mx-auto overflow-x-scroll flex space-x-6 relative 
                ${isDragging ? "cursor-grabbing" : "cursor-grab" }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleonMouseUporLeave}
            onMouseLeave={handleonLeave}
            >
            {newArrivals.map((product) => (
                <div key={product._id} className="min-w-[100%] sm:min-w-[50%] lg:min-w-[30%] relative">
                    <img
                        src={product.images[0]?.url}
                        alt={product.images[0]?.altText || product.name}
                        className="w-full h-[500px] object-cover rounded-lg"
                        draggable={false}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-opacity-50 backdrop-blur-md text-white p-4 rounded-b-lg">
                        <Link to={`/product/${product._id}`} className="block">
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="mt-1">₱{product.price.toLocaleString()}</p>
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    </section>
  );
};

export default NewArivals;