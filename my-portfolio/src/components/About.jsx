// src/components/About.jsx
export default function About() {
  return (
    <section id="about" className="min-h-screen  py-20 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-6">
      <div className="max-w-4xl mx-auto text-center pt-[120px] md:pt-[170px] lg:pt-[170px] xl:pt-[170px]">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">About Me</h2>
        <p className="text-lg leading-relaxed">
          I'm Cedric, a self-taught full-stack web developer based in the Philippines. 
          I specialize in building full-stack applications with React, Tailwind CSS, and Node.js. 
          I'm passionate about creating intuitive and dynamic user experiences.
        </p>
        <p className="text-lg mt-4 leading-relaxed">
          In my free time, I enjoy learning new technologies, contributing to open-source projects, 
          and continuously improving my development skills.
        </p>
      </div>
    </section>
  );
}
