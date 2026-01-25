import { Link } from "react-router-dom";
import mensCollection from "../../assets/mens-collection.jpg";
import womensCollection from "../../assets/homepage7.jpg";


const GenderCollectionSection = () => {
  return (
    <section className="py-12 px-4 lg:px-12">
        <div className="container mx-auto flex flex-col md:flex-row gap-12">
            {/* Women's Collection */}
            <div className="relative flex-1">
                <img 
                    src={womensCollection}
                    alt="Women's Collection"
                    className="w-full h-[590px] object-cover"
                />
                <div className=" absolute bottom-8 left-8 bg-white bg-opacity-90 p-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Women's Collection
                    </h2>
                    <Link to="/collections/all?gender=Women" className="underline">
                       Shop Now
                    </Link>
                </div>
            </div>
            {/* Men's Collection */}
            <div className="relative flex-1">
                <img 
                    src={mensCollection}
                    alt="Men's Collection"
                    className="w-full h-[590px] object-cover"
                />
                <div className="absolute bottom-8 left-8 bg-white bg-opacity-90 p-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Men's Collection
                    </h2>
                    <Link to="/collections/all?gender=Men" className="underline">
                       Shop Now
                    </Link>
                </div>
            </div>
        </div>
    </section>
  );
};

export default GenderCollectionSection;