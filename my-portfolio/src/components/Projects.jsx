export default function Projects() {
  return (
    <section id="projects" className="py-20 bg-gray-200 dark:bg-gray-950 text-gray-900 dark:text-white px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-10">Projects</h2>
        
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Project Card 3 */}
            <div
                className="relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden"
                style={{
                  backgroundImage: "url('/src/assets/harry-potter-bg.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Overlay for readability */}
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl"></div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-2">Potter Wiki</h3>
                  <p className="text-sm text-gray-100 mb-4">
                    A full-stack MERN web app for exploring and managing magical data from the Harry Potter universe. Features include public browsing, admin-only CRUD, JWT-based role auth, and Tailwind-styled cards for Characters, Spells, Students, and Staff.
                  </p>
                  <a
                    href="https://potter-wiki-pedia.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition"
                  >
                    View Project
                  </a>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
}
