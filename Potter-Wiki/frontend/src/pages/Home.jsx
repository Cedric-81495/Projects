import { Link } from "react-router-dom";
import harrypotterbg from "../assets/harry-potter-bg.jpg";

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
          <Link
            to="/discover"
            className="inline-block bg-[#cfae6d] text-black px-6 py-3 rounded-lg shadow hover:bg-[#e0c98c] transition font-semibold"
          >
            Discover the Magic
          </Link>
        </div>
      </section>

      {/* 📰 News & Features */}
      <section className="py-20 px-4 text-center bg-gradient-to-r from-[#fef9c3] to-[#fde68a] text-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">📰 News & Features</h2>
          <p className="mb-6">Stay updated with magical headlines, fan theories, and behind-the-scenes insights.</p>
          <Link to="/news" className="bg-yellow-600 text-white px-5 py-2 rounded hover:bg-yellow-700 transition">Read News</Link>
        </div>
      </section>

      {/* 🧩 Quizzes & Puzzles */}
      <section
        className="py-20 px-4 text-center bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/images/quizzes-bg.jpg')" }}
      >
        <div className="bg-black/50 p-6 rounded-lg inline-block max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">🧩 Quizzes & Puzzles</h2>
          <p className="mb-6">Test your magical knowledge with trivia, logic puzzles, and house challenges.</p>
          <Link to="/quizzes" className="bg-yellow-500 text-black px-5 py-2 rounded hover:bg-yellow-600 transition">Take a Quiz</Link>
        </div>
      </section>

      {/* 📚 J.K. Rowling Archive */}
      <section className="py-20 px-4 text-center bg-gradient-to-r from-[#e2e8f0] to-[#cbd5e1] text-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">📚 J.K. Rowling Archive</h2>
          <p className="mb-6">Explore original writings, lore, and unpublished notes from the creator herself.</p>
          <Link to="/jk-rowling" className="bg-gray-700 text-white px-5 py-2 rounded hover:bg-gray-800 transition">View Archive</Link>
        </div>
      </section>

      {/* 🔍 Discover */}
      <section
        className="py-20 px-4 text-center bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/images/discover-bg.jpg')" }}
      >
        <div className="bg-black/50 p-6 rounded-lg inline-block max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">🔍 Discover</h2>
          <p className="mb-6">Uncover hidden facts, magical locations, and character connections.</p>
          <Link to="/discover" className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 transition">Start Discovering</Link>
        </div>
      </section>

      {/* 🏰 Hogwarts Sorting */}
      <section className="py-20 px-4 text-center bg-gradient-to-r from-[#c7d2fe] to-[#a5b4fc] text-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">🏰 Hogwarts Sorting</h2>
          <p className="mb-6">Take the Sorting Hat quiz and find your true Hogwarts house.</p>
          <Link to="/hogwarts-sorting" className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 transition">Get Sorted</Link>
        </div>
      </section>

      {/* 🦌 Patronus Discovery */}
      <section
        className="py-20 px-4 text-center bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/images/patronus-bg.jpg')" }}
      >
        <div className="bg-black/50 p-6 rounded-lg inline-block max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">🦌 Patronus Discovery</h2>
          <p className="mb-6">Discover your Patronus — the magical guardian that reflects your inner spirit.</p>
          <Link to="/patronus" className="bg-teal-500 text-white px-5 py-2 rounded hover:bg-teal-600 transition">Find Your Patronus</Link>
        </div>
      </section>

      {/* 📖 Rare Tales */}
      <section className="py-20 px-4 text-center bg-gradient-to-r from-[#fbcfe8] to-[#f9a8d4] text-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">📖 Rare Tales</h2>
          <p className="mb-6">Read lesser-known stories, magical myths, and enchanted folklore.</p>
          <Link to="/rare-tales" className="bg-pink-500 text-white px-5 py-2 rounded hover:bg-pink-600 transition">Read Tales</Link>
        </div>
      </section>

      {/* 🛍️ Shop */}
      <section
        className="py-20 px-4 text-center bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/images/shop-bg.jpg')" }}
      >
        <div className="bg-black/50 p-6 rounded-lg inline-block max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">🛍️ Shop</h2>
          <p className="mb-6">Browse magical merchandise, wands, robes, and collectibles.</p>
          <Link to="/shop" className="bg-orange-500 text-white px-5 py-2 rounded hover:bg-orange-600 transition">Visit Shop</Link>
        </div>
      </section>

      {/* 📊 Magical Data */}
      <section className="py-20 px-4 text-center bg-gradient-to-r from-[#ede9fe] to-[#ddd6fe] text-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">📊 Magical Data</h2>
          <p className="mb-6">Access structured data on characters, spells, students, and staff.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/characters" className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 transition">Characters</Link>
            <Link to="/spells" className="bg-purple-600 text-white px-5 py-2 rounded hover:bg-purple-700 transition">Spells</Link>
            <Link to="/students" className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition">Students</Link>
            <Link to="/staff" className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 transition">Staff</Link>
          </div>
        </div>
      </section>
    </div>
 
   );
};

export default Home;