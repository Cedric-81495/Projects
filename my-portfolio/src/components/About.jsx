// src/components/About.jsx
export default function About() {
  return (
    <section
      id="about"
      className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6"
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
        <div className="bg-gray-190 dark:bg-gray-800 rounded-xl p-6 md:p-10 shadow-xl">
          <p className="text-lg leading-relaxed">
            I’m Cedric, an AI engineer based in the Philippines with a focus on
            web development. I build full-stack web applications with React,
            Tailwind CSS, Node.js, Express, and MongoDB, and I use AI tools at
            every stage of the process, from planning and prototyping to writing,
            testing, and refining code.
          </p>

          <p className="text-lg mt-5 leading-relaxed">
            AI helps me move from idea to working product much faster, while my
            engineering background keeps that work reliable. I review and
            understand everything I ship, so speed never comes at the cost of
            clean, maintainable code.
          </p>

          <p className="text-lg mt-5 leading-relaxed">
            Since 2022, I’ve worked as a software engineer at Straive, where I
            maintain and improve publishing platforms and automate internal data
            processes. That professional experience shapes how I approach every
            project: with care for structure, performance, and the people who
            will use it.
          </p>
        </div>
      </div>
    </section>
  );
}
