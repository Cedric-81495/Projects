// src/pages/Projects.jsx
import { useState, useEffect } from 'react';

const Projects = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  const projects = [
    {
      id: 1,
      title: "Spotify Analytics Dashboard",
      description: "A data visualization project that shows insights about your listening habits using the Spotify API.",
      image: "https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2076&q=80",
      tags: ["React", "D3.js", "Spotify API"],
      link: "#"
    },
    {
      id: 2,
      title: "Music Genre Classifier",
      description: "Machine learning model that classifies songs by genre based on audio features from Spotify.",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
      tags: ["Python", "TensorFlow", "Spotify API"],
      link: "#"
    },
    {
      id: 3,
      title: "Playlist Generator",
      description: "An application that generates playlists based on mood, activity, or similar artists using Spotify's recommendations.",
      image: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
      tags: ["Node.js", "Express", "React", "Spotify API"],
      link: "#"
    },
    {
      id: 4,
      title: "Music Taste Visualizer",
      description: "Interactive visualization of your music taste over time, showing how your preferences evolve.",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2074&q=80",
      tags: ["React", "Three.js", "Spotify API"],
      link: "#"
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-spotify-black to-spotify-gray">
      {/* Projects Header */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-900/30 to-transparent opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Projects
            </h1>
            
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300 leading-relaxed">
              Explore my portfolio of projects built with the Spotify API and other technologies.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <div 
                key={project.id} 
                className={`bg-spotify-light rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${200 + index * 100}ms` }}
              >
                <div className="h-60 overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
                  <p className="text-gray-400 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag, i) => (
                      <span key={i} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a 
                    href={project.link}
                    className="inline-flex items-center text-spotify-green hover:text-green-400 font-medium"
                  >
                    View Project
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Technologies Section */}
      <section className="py-16 bg-spotify-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl font-bold text-white">Technologies Used</h2>
            <div className="mt-2 w-16 h-1 bg-spotify-green mx-auto rounded-full"></div>
            <p className="mt-4 text-xl text-gray-400">The tools and frameworks that power these projects</p>
          </div>
          
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 transition-all duration-1000 delay-800 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {["React", "Node.js", "Python", "D3.js", "TensorFlow", "Spotify API"].map((tech, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-spotify-light rounded-full flex items-center justify-center mb-3">
                  <span className="text-spotify-green font-bold">{tech.charAt(0)}</span>
                </div>
                <span className="text-white font-medium">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Projects;