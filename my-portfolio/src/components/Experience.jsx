export default function Experience() {
  return (
    <section
      id="experience"
      className="min-h-screen py-20 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-6 transition-colors duration-500"
    >
      <div className="max-w-4xl mx-auto pt-[50px]">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 animate-fade-in-down">
          Experience
        </h2>
        <div className="space-y-8">
            {/* Existing Experience */}
            <div className="bg-gray-200 dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
              <h3 className="text-xl font-semibold">Software Engineer – Straive</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <em>May 2022 – Present</em>
              </p>
              <p className="mt-2 text-gray-800 dark:text-gray-200">
                Maintained and developed publishing platforms with XML workflows and Perl tools.
                Automated data processes and enhanced data features for internal tools.
              </p>
            </div>

            {/* New Experience – Personal Projects */}
            <div className="bg-gray-200 dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
              <h3 className="text-xl font-semibold">Full-Stack Developer – Personal Projects</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <em>2024 – Present</em>
              </p>
              <p className="mt-2 text-gray-800 dark:text-gray-200">
                Built and deployed full-stack MERN applications focusing on authentication, REST API 
                development, responsive UI, and real-world interactive features. Applied modern best 
                practices in React, Node.js, MongoDB, Express.js, and Tailwind CSS.
              </p>

              <ul className="mt-3 list-disc list-inside text-gray-800 dark:text-gray-200 space-y-1">
                <li>
                  <strong>Potter Wiki</strong> – A modern character encyclopedia with authentication, 
                  search system, and interactive UI.  <br/>
                  <a
                    href="https://mern-potter-wiki.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline ml-1"
                  >
                    Live Demo
                  </a>
                  <span> | </span>
                  <a
                    href="https://github.com/Cedric-81495/Projects/tree/main/Potter-Wiki"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    GitHub
                  </a>
                </li>

                <li>
                  <strong>ToDo Board</strong> – A productivity task manager with drag-and-drop UI,
                  real-time updates, and responsive layout.  <br/>
                  <a
                    href="https://mern-todoboard.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline ml-1"
                  >
                    Live Demo
                  </a>
                  <span> | </span>
                  <a
                    href="https://github.com/Cedric-81495/Projects/tree/main/ToDoBoard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    GitHub
                  </a>
                </li>
                  <li>
                  <strong>GrayScale</strong> – A full-stack MERN e-commerce web application for fashion products
                  <br/>
                  <a
                    href="https://mern-grayscale.onrender.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline ml-1"
                  >
                    Live Demo
                  </a>
                  <span> | </span>
                  <a
                    href="https://github.com/Cedric-81495/Projects/tree/main/GrayScale"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
      </div>
    </section>
  );
}
