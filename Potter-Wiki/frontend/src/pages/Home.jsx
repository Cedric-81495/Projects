import { Link } from "react-router-dom";
//import voyeglq from "../assets/voyeglq.jpg";
import harrypotterbg from "../assets/harry-potter-bg.jpg";

const Home = () => {
  return (
    <div className="text-gray-800 font-serif">
      {/* Hero Section */}
     <section
        className="min-h-screen flex flex-col items-center justify-center text-center bg-cover bg-center relative pt-24 sm:pt-28"
        style={{ backgroundImage: `url(${harrypotterbg})` }}
      >
      {/* Overlay */}
      <div className="relative inset-0 bg-black/50 z-0"></div>
        {/* Content */}
        <div className="relative z-10 max-w-3xl text-white">
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">Welcome to Potter Wiki</h1>
          <p className="text-lg mb-6">
            Your gateway to the magical universe — explore characters, spells, lore, and rare tales.
          </p>
          <Link
            to="/discover"
            className="inline-block bg-amber-500 text-black px-6 py-3 rounded-lg shadow hover:bg-amber-600 transition font-semibold"
          >
            Discover the Magic
          </Link>
        </div>
    </section>

      {/* News & Features – Gradient */}
      <section className="py-20 px-6 text-center bg-gradient-to-r from-[#fef9c3] to-[#fde68a]">
        <h2 className="text-3xl font-bold text-yellow-700 mb-4">📰 News & Features</h2>
        <p className="max-w-2xl mx-auto text-gray-700 mb-6">
          Stay updated with magical headlines, fan theories, and behind-the-scenes insights.
        </p>
        <Link to="/news" className="inline-block bg-yellow-600 text-white px-5 py-2 rounded hover:bg-yellow-700 transition">Read News</Link>
      </section>

      {/* Quizzes & Puzzles – Image Background */}
      <section
        className="py-20 px-6 text-center bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/images/quizzes-bg.jpg')" }}
      >
        <div className="bg-black/50 p-6 rounded-lg inline-block">
          <h2 className="text-3xl font-bold mb-4">🧩 Quizzes & Puzzles</h2>
          <p className="max-w-2xl mx-auto mb-6">
            Test your magical knowledge with trivia, logic puzzles, and house challenges.
          </p>
          <Link to="/quizzes" className="inline-block bg-yellow-500 text-black px-5 py-2 rounded hover:bg-yellow-600 transition">Take a Quiz</Link>
        </div>
      </section>

      {/* J.K. Rowling Archive – Gradient */}
      <section className="py-20 px-6 text-center bg-gradient-to-r from-[#e2e8f0] to-[#cbd5e1]">
        <h2 className="text-3xl font-bold text-gray-700 mb-4">📚 J.K. Rowling Archive</h2>
        <p className="max-w-2xl mx-auto text-gray-600 mb-6">
          Explore original writings, lore, and unpublished notes from the creator herself.
        </p>
        <Link to="/jk-rowling" className="inline-block bg-gray-700 text-white px-5 py-2 rounded hover:bg-gray-800 transition">View Archive</Link>
      </section>

      {/* Discover – Image Background */}
      <section
        className="py-20 px-6 text-center bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/images/discover-bg.jpg')" }}
      >
        <div className="bg-black/50 p-6 rounded-lg inline-block">
          <h2 className="text-3xl font-bold mb-4">🔍 Discover</h2>
          <p className="max-w-2xl mx-auto mb-6">
            Uncover hidden facts, magical locations, and character connections.
          </p>
          <Link to="/discover" className="inline-block bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 transition">Start Discovering</Link>
        </div>
      </section>

      {/* Hogwarts Sorting – Gradient */}
      <section className="py-20 px-6 text-center bg-gradient-to-r from-[#c7d2fe] to-[#a5b4fc]">
        <h2 className="text-3xl font-bold text-indigo-700 mb-4">🏰 Hogwarts Sorting</h2>
        <p className="max-w-2xl mx-auto text-gray-700 mb-6">
          Take the Sorting Hat quiz and find your true Hogwarts house.
        </p>
        <Link to="/hogwarts-sorting" className="inline-block bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 transition">Get Sorted</Link>
      </section>

      {/* Patronus Discovery – Image Background */}
      <section
        className="py-20 px-6 text-center bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/images/patronus-bg.jpg')" }}
      >
        <div className="bg-black/50 p-6 rounded-lg inline-block">
          <h2 className="text-3xl font-bold mb-4">🦌 Patronus Discovery</h2>
          <p className="max-w-2xl mx-auto mb-6">
            Discover your Patronus — the magical guardian that reflects your inner spirit.
          </p>
          <Link to="/patronus" className="inline-block bg-teal-500 text-white px-5 py-2 rounded hover:bg-teal-600 transition">Find Your Patronus</Link>
        </div>
      </section>

      {/* Rare Tales – Gradient */}
      <section className="py-20 px-6 text-center bg-gradient-to-r from-[#fbcfe8] to-[#f9a8d4]">
        <h2 className="text-3xl font-bold text-pink-700 mb-4">📖 Rare Tales</h2>
        <p className="max-w-2xl mx-auto text-gray-700 mb-6">
          Read lesser-known stories, magical myths, and enchanted folklore.
        </p>
        <Link to="/rare-tales" className="inline-block bg-pink-500 text-white px-5 py-2 rounded hover:bg-pink-600 transition">Read Tales</Link>
      </section>

      {/* Shop – Image Background */}
      <section
        className="py-20 px-6 text-center bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/images/shop-bg.jpg')" }}
      >
        <div className="bg-black/50 p-6 rounded-lg inline-block">
          <h2 className="text-3xl font-bold mb-4">🛍️ Shop</h2>
          <p className="max-w-2xl mx-auto mb-6">
            Browse magical merchandise, wands, robes, and collectibles.
          </p>
          <Link to="/shop" className="inline-block bg-orange-500 text-white px-5 py-2 rounded hover:bg-orange-600 transition">Visit Shop</Link>
        </div>
      </section>

      {/* Magical Data – Gradient */}
      <section className="py-20 px-6 text-center bg-gradient-to-r from-[#ede9fe] to-[#ddd6fe]">
        <h2 className="text-3xl font-bold text-purple-700 mb-4">📊 Magical Data</h2>
        <p className="max-w-2xl mx-auto text-gray-700 mb-6">
          Access structured data on characters, spells, students, and staff.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/characters" className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 transition">Characters</Link>
          <Link to="/spells" className="bg-purple-600 text-white px-5 py-2 rounded hover:bg-purple-700 transition">Spells</Link>
          <Link to="/students" className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition">Students</Link>
          <Link to="/staff" className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 transition">Staff</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;