import { Link } from "react-router-dom";
import HeroImg from "../../assets/grayscale-hero.webp";

const Hero = () => {
  return (
    <section className="relative">
        <img 
            src={HeroImg}
            alt="GrayScale"
            className="w-full h-[400px] md:h-[600px] lg:h-[750px] object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-5 flex items-center justify-center">
            <div className="text-center text-white p-6">
                <h1 className="text-4xl md:text-9xl font-bold tracking-tighter uppercase mb-4 text-white drop-shadow-[2px_2px_0px_black]">
                    Vacation <br/> Ready
                    </h1>

                <p className="text-sm tracking-tighter md:text-lg mb-6 drop-shadow-[2px_2px_0px_black]">
                    Explore our vacation-ready outfits with fast and worldwide shipping.
                </p>
                <Link to="#" className="bg-white text-gray-950 px-6 py-2 rounded-sm text-lg">Shop Now</Link>
            </div>
        </div>
    </section>
  );
};

export default Hero;