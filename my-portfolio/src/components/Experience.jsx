export default function Experience() {
  return (
    <section
      id="experience"
      className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6"
    >
      <div className="max-w-5xl mx-auto pt-24 md:pt-32">
        {/* Section label */}
        <p className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
          Background
        </p>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Experience
        </h2>

        <div className="space-y-10">
          {/* Professional Experience */}
          <ExperienceCard
            title="Software Engineer"
            company="Straive"
            period="May 2022 – Present"
            description="Maintained and enhanced publishing platforms using XML-based workflows and Perl tooling. Automated internal data processes and improved data reliability across editorial systems."
          />

          {/* Personal Projects */}
          <ExperienceCard
            title="Full-Stack Developer"
            company="Personal Projects"
            period="2024 – Present"
            description="Designed and deployed full-stack MERN applications with a focus on authentication, RESTful APIs, responsive UI, and real-world workflows. Applied modern best practices using React, Node.js, Express, MongoDB, and Tailwind CSS."
          >
            <ul className="mt-4 space-y-3 text-sm">
              <ProjectItem
                name="Potter Wiki"
                description="Character encyclopedia with authentication, search functionality, and interactive UI."
                live="https://mern-potter-wiki.onrender.com"
                github="https://github.com/Cedric-81495/Projects/tree/main/Potter-Wiki"
              />

              <ProjectItem
                name="Todo Board"
                description="Productivity-focused task manager with responsive layout."
                live="https://mern-todoboard.onrender.com"
                github="https://github.com/Cedric-81495/Projects/tree/main/ToDoBoard"
              />

              <ProjectItem
                name="GrayScale"
                description="Full-stack MERN e-commerce platform for fashion products with real-world user and admin workflows."
                live="https://mern-grayscale.onrender.com"
                github="https://github.com/Cedric-81495/Projects/tree/main/GrayScale"
              />
            </ul>
          </ExperienceCard>
        </div>
      </div>
    </section>
  );
}

function ExperienceCard({ title, company, period, description, children }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
      <h3 className="text-xl font-semibold">
        {title} <span className="text-gray-500 dark:text-gray-400">— {company}</span>
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {period}
      </p>

      <p className="mt-4 leading-relaxed text-gray-700 dark:text-gray-300">
        {description}
      </p>

      {children}
    </div>
  );
}

function ProjectItem({ name, description, live, github }) {
  return (
    <li>
      <p className="font-medium">
        {name}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>

      <div className="mt-1 flex gap-3">
        <a
          href={live}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:underline"
        >
          Live Demo
        </a>
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:underline"
        >
          GitHub
        </a>
      </div>
    </li>
  );
}
