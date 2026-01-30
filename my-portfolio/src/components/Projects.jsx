export default function Projects() {
  return (
    <section
      id="projects"
      className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6"
    >
      <div className="max-w-6xl mx-auto pt-24 md:pt-32">
        {/* Section label */}
        <p className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
          Work
        </p>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Projects
        </h2>

        {/* Projects Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Project Card */}
          <ProjectCard
            title="Potter Wiki"
            description="A full-stack MERN application for exploring Harry Potter data, featuring authentication, admin CRUD functionality, and a clean Tailwind-based UI."
            link="https://mern-potter-wiki.onrender.com"
          />

          <ProjectCard
            title="Todo Board"
            description="A task management application designed to improve productivity through organized workflows and a simple, intuitive interface."
            link="https://mern-todoboard.onrender.com"
          />

          <ProjectCard
            title="GrayScale"
            description="A full-stack MERN e-commerce platform for fashion products, supporting real-world user flows, admin management, and secure transactions."
            link="https://mern-grayscale.onrender.com"
          />
        </div>
      </div>
    </section>
  );
}


function ProjectCard({ title, description, link }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition flex flex-col">
      <h3 className="text-xl font-semibold mb-3">
        {title}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        {description}
      </p>

      <div className="mt-auto pt-6">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full text-center rounded-md
                     bg-gray-900 dark:bg-white
                     text-white dark:text-gray-900
                     py-2 font-medium
                     hover:opacity-90 transition"
        >
          View Project
        </a>
      </div>
    </div>
  );
}
