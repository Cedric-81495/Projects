export default function Projects() {
  return (
    <section
      id="projects"
      className="min-h-screen py-20 bg-gray-200 dark:bg-gray-950 text-gray-900 dark:text-white px-6"
    >
      <div className="max-w-4xl mx-auto text-center pt-24 md:pt-32">
        <h2 className="text-3xl md:text-4xl font-bold mb-10">Projects</h2>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Project Card */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>

            <div className="relative z-10 p-6 flex flex-col h-full">
              <h3 className="text-2xl font-bold text-white mb-2">Potter Wiki</h3>
              <p className="text-sm text-gray-100 mb-6">
                A full-stack MERN web app for exploring Harry Potter data with 
                authentication, admin CRUD, and a Tailwind-styled UI.
              </p>

              {/* Push button to bottom */}
              <div className="mt-auto pt-6">
                <a
                  href="https://mern-potter-wiki.onrender.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-medium transition"
                >
                  View Project
                </a>
              </div>
            </div>
          </div>

          {/* Todo Board */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>

            <div className="relative z-10 p-6 flex flex-col h-full">
              <h3 className="text-2xl font-bold text-white mb-2">Todo Board</h3>
              <p className="text-sm text-gray-100 mb-6">
                A task management tool built for productivity and organization. 
              </p>

              <div className="mt-auto pt-6">
                <a
                  href="https://mern-todoboard.onrender.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-medium transition"
                >
                  View Project
                </a>
              </div>
            </div>
          </div>

                    {/* GrayScale */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>

            <div className="relative z-10 p-6 flex flex-col h-full">
              <h3 className="text-2xl font-bold text-white mb-2">GrayScale</h3>
              <p className="text-sm text-gray-100 mb-6">
                A full-stack MERN e-commerce web application for fashion products with real-world user and admin workflows.
              </p>

              <div className="mt-auto pt-6">
                <a
                  href="https://mern-grayscale.onrender.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-medium transition"
                >
                  View Project
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
