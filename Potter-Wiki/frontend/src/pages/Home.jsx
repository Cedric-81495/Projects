import { Link } from "react-router-dom";
import harrypotterbg from "../assets/harry-potter-bg.jpg";
import booksbg from "../assets/books-bg.jpeg";
import moviesbg from "../assets/bg-movies.jpg"

const Home = () => {
  return (
    <div className="text-[#f5e6c8] font-serif">
      {/* 🧙 Hero Section */}
      <section
        className="min-h-screen  flex items-center justify-center text-center bg-cover bg-center relative"
        style={{ backgroundImage: `url(${harrypotterbg})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className="relative z-10 max-w-3xl px-6">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 drop-shadow-lg">Welcome to Potter Wiki</h1>
          <p className="text-base sm:text-lg mb-6">
            Your gateway to the magical universe — explore characters, spells, lore, and rare tales.
          </p>
          <p className="text-base sm:text-lg mb-6">
            Access structured Magical Data data on characters, spells, students, and staff.
          </p>
      <   div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/characters"
              className="px-6 py-2 rounded-md border border-amber-400 text-amber-200 bg-gradient-to-r from-indigo-900 via-indigo-700 to-indigo-900 hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-lg transition-all duration-300 font-serif tracking-wide"
            >
              Characters
            </Link>
            <Link
              to="/spells"
              className="px-6 py-2 rounded-md border border-amber-400 text-amber-200 bg-gradient-to-r from-purple-900 via-purple-700 to-purple-900 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-300 font-serif tracking-wide"
            >
              Spells
            </Link>
            <Link
              to="/students"
              className="px-6 py-2 rounded-md border border-amber-400 text-amber-200 bg-gradient-to-r from-green-900 via-green-700 to-green-900 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-300 font-serif tracking-wide"
            >
              Students
            </Link>
            <Link
              to="/staff"
              className="px-6 py-2 rounded-md border border-amber-400 text-amber-200 bg-gradient-to-r from-red-900 via-red-700 to-red-900 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all duration-300 font-serif tracking-wide"
            >
              Staff
            </Link>
          </div>
        </div>
      </section>

      {/* Movies Section */}
      <section
        className="relative py-32 px-6 text-center text-white bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url(${moviesbg})` }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-wide drop-shadow-lg">
            Movies
          </h2>
          <p className="text-lg md:text-xl mb-8 text-gray-200 leading-relaxed">
            Immerse yourself in the wizarding world — uncover spellbinding stories and legendary adventures.
          </p>

       <Link
          to="/movies"
          className="px-6 py-2 rounded-md border border-blue-400 text-blue-100 bg-gradient-to-r from-[#0b1e3f] via-[#123a6d] to-[#0b1e3f] hover:from-[#154a8a] hover:to-[#1a5dab] shadow-md hover:shadow-blue-500/40 transition-all duration-300 font-serif tracking-wide"
        >
          🎬 Browse Movies
        </Link>
        </div>

        {/* Decorative Sparkles */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute w-2 h-2 bg-amber-400 rounded-full animate-pulse top-10 left-1/3 opacity-70" />
          <div className="absolute w-3 h-3 bg-amber-300 rounded-full animate-ping bottom-16 right-1/4 opacity-50" />
        </div>
      </section>


      {/* Books Section */}
      <section
        className="pt-[100px] pb-[100px] relative px-4 text-center bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${booksbg})` }}
      >
        <div className="bg-black/50 p-6 rounded-lg inline-block max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Books</h2>
          <p className="mb-6">
            Dive into magical literature — explore spellbooks, rare tomes, and wizarding lore.
          </p>
       <Link
          to="/books"
          className="px-6 py-2 rounded-md border border-amber-400 text-amber-200 bg-gradient-to-r from-[#5c3b00] via-[#8b5e00] to-[#5c3b00] hover:from-[#7a4a00] hover:to-[#a86f00] shadow-md hover:shadow-lg transition-all duration-300 font-serif tracking-wide"
        >
         Browse Books
        </Link>
        </div>
      </section>
    </div>
 
   );
};

export default Home;