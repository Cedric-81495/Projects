export default function Contact() {
  return (
    <section
      id="contact"
      className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-6"
    >
      <div className="max-w-5xl mx-auto pt-24 md:pt-32">
        {/* Section label */}
        <p className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 text-center">
          Contact
        </p>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Get in Touch
        </h2>

        {/* Contact Card */}
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <form
            action="https://formspree.io/f/xanjaagb"
            method="POST"
            className="space-y-6"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                           bg-white dark:bg-gray-900
                           focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                           bg-white dark:bg-gray-900
                           focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="4"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                           bg-white dark:bg-gray-900
                           focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg py-3 font-medium
                         bg-gray-900 dark:bg-white
                         text-white dark:text-gray-900
                         hover:opacity-90 transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
