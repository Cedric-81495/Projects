// src/components/Hero.jsx
export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center text-center px-6 bg-gray-200 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
      <div className="max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 opacity-0 animate-fade-in-down">
          Hi, I'm Cedric
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-xl mx-auto opacity-0 animate-fade-in-up delay-100">
          A passionate full-stack developer creating modern, responsive, and scalable web applications.
        </p>
        <div className="mt-6 opacity-0 animate-fade-in-up delay-200">
          <a
            href="#projects"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
          >
            View My Work
          </a>
        </div>
      </div>
    </section>
  );
}
