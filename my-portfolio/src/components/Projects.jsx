export default function Projects() {
  return (
    <section id="projects" className="py-20 bg-gray-200 dark:bg-gray-950 text-gray-900 dark:text-white px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-10">Projects</h2>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Project Card 1 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transition duration-300">
            <h3 className="text-xl font-semibold mb-2">Spotify Portfolio</h3>
            <p className="text-sm mb-4">
              A personal portfolio powered by Spotify’s API to display playlists, profile info, and top tracks.
            </p>
            <a href="https://spotify-projects-frontend.vercel.app" className="text-blue-500 dark:text-blue-400 font-medium hover:underline">View Project</a>
          </div>

          {/* Project Card 2 */}
          <div className="bg-white  dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transition duration-300">
            <h3 className="text-xl font-semibold mb-2">Harry Potter DB</h3>
            <p className="text-sm mb-4">
              A full-stack app using a public Harry Potter API + MariaDB + React to showcase spellbook features.
            </p>
            <a href="https://hpotter-books-4pummym3a-cedrics-projects-188a68e7.vercel.app/" className="text-blue-500 dark:text-blue-400 font-medium hover:underline">View Project</a>
          </div>

          {/* Project Card 3 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transition duration-300">
            <h3 className="text-xl font-semibold mb-2">Books Collection</h3>
            <p className="text-sm mb-4">
              A web app to manage and showcase a digital library of books using React + Express + MongoDB.
            </p>
            <a href="https://books-collection-eiqzurk30-cedrics-projects-188a68e7.vercel.app/" className="text-blue-500 dark:text-blue-400 font-medium hover:underline">View Project</a>
          </div>
        </div>
      </div>
    </section>
  );
}
