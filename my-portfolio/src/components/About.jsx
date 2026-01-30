// src/components/About.jsx
export default function About() {
  return (
    <section
      id="about"
      className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-6"
    >
      <div className="max-w-5xl mx-auto pt-24 md:pt-32">
        {/* Section label */}
        <p className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
          About
        </p>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold mb-8">
          About Me
        </h2>

        {/* Content card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 md:p-10 shadow-sm">
          <p className="text-lg leading-relaxed">
            I’m Cedric, a full-stack web developer based in the Philippines,
            focused on building modern, scalable, and user-centric web
            applications. I primarily work with React, Tailwind CSS, and
            Node.js to create clean and maintainable solutions.
          </p>

          <p className="text-lg mt-5 leading-relaxed">
            I value thoughtful design, performance, and clarity in both code
            and user experience. I continuously learn and adapt to new
            technologies to stay effective in a fast-moving development
            landscape.
          </p>
        </div>
      </div>
    </section>
  );
}
