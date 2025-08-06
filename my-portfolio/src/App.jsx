import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Contact from './components/Contact';

function App() {
  useEffect(() => {
    // Check localStorage or system preference
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-500">
      <Navbar />
      <Hero />
      <About />
      <Projects />
      <Experience />
      <Contact />
    </div>
  );
}

export default App;
