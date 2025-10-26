import { Link } from "react-router-dom";
import harrypotterbg from "../assets/harry-potter-bg.jpg";
import booksbg from "../assets/books-bg.jpeg";

const Home = () => {
  return (
    <div className="text-[#f5e6c8] font-serif bg-[#0b0b0b]">
      {/* 🧙 Hero Section */}
      <section
        className="min-h-screen flex items-center justify-center text-center bg-cover bg-center relative"
        style={{ backgroundImage: `url(${harrypotterbg})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className="relative z-10 max-w-3xl px-6">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 drop-shadow-lg">Welcome to Potter Wiki</h1>
          <p className="text-base sm:text-lg mb-6">
            Your gateway to the magical universe — explore characters, spells, lore, and rare tales.
          </p>
        <div className="text-center mt-8">
       <Link
          to="/discover"
          className="inline-block px-6 py-3 rounded-md border border-amber-400 text-amber-200 bg-gradient-to-r from-[#5c3b00] via-[#8b5e00] to-[#5c3b00] hover:from-[#7a4a00] hover:to-[#a86f00] shadow-md hover:shadow-lg transition-all duration-300 font-serif tracking-wide"
        >
        Discover the Magic
        </Link>
      </div>
        </div>
      </section>

        {/* 📊 Magical Data */}
      <section className="bg-gradient-to-b text-center from-[#1a1a1a] via-[#0B0B0B] to-[#000000] text-amber-100 py-8 shadow-inner font-serif">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl text-white font-bold mb-4">Magical Data</h2>
          <p className="mb-6 text-white">
            Access structured data on characters, spells, students, and staff.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
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

      {/* 📚 Books */}
      <section
        className="pt-[80px] px-4 text-center bg-cover bg-center text-white"
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