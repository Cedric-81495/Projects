// frontend/src/pages/Home.jsx
const Home = () => {
  return (
    <div className="h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-extrabold text-indigo-700 mb-4">Welcome to Potter Wiki</h1>
      <p className="text-lg text-gray-700 mb-6 max-w-xl text-center">
        Explore magical characters, spells, students, and find the one true wizarding world.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <a href="/characters" className="bg-indigo-500 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-600 transition">
          Characters
        </a>
        <a href="/spells" className="bg-purple-500 text-white px-6 py-3 rounded-lg shadow hover:bg-purple-600 transition">
          Spells
        </a>
        <a href="/students" className="bg-green-500 text-white px-6 py-3 rounded-lg shadow hover:bg-green-600 transition">
          Students
        </a>
        <a href="/staff" className="bg-red-500 text-white px-6 py-3 rounded-lg shadow hover:bg-red-600 transition">
          Staff
        </a>
      </div>
    </div>
  );
};

export default Home;