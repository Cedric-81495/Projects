// src/components/Hero.jsx
import ProfileImg from "../assets/profile.jpg"; // <-- replace with your image path

export default function Hero() {
  return (
    <section
      id="hero"
      className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white px-6 transition-colors duration-500 p-6"
    >
      <div className="max-w-5xl mx-auto pt-24 md:pt-32">
        {/* Section label */}
        <p className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
          Introduction
        </p>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          Hi, I’m Cedric
        </h1>

        {/* Hero card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8">
            
            {/* Text */}
             <div className="flex-1 text-center md:text-left">
                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                  A full-stack web developer based in the Philippines, building modern, 
                  responsive, and scalable web applications with React, Tailwind CSS, 
                  and Node.js. I leverage AI tools and technologies to enhance 
                  development efficiency, improve user experience, and stay at the 
                  forefront of industry trends.
                </p>


              <div className="pt-6">
                  <a
                    href="#projects"
                    className="inline-block w-[200px] text-center rounded-md
                              bg-gray-900 dark:bg-white
                              text-white dark:text-gray-900
                              py-2 font-medium
                              hover:opacity-90 transition"
                  >
                    View my Projects
                  </a>
                </div>
            </div>

            {/* Profile image */}
            <div className="flex-shrink-0">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-blue-600/20 shadow-md">
                <img
                  src={ProfileImg}
                  alt="Cedric profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
