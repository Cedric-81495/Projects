export default function Experience() {
  return (
    <section
      id="experience"
      className="py-20 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-6 transition-colors duration-500"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 animate-fade-in-down">
          Experience
        </h2>

        <div className="space-y-8">
          <div className="bg-gray-200 dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
            <h3 className="text-xl font-semibold">Software Engineer – Straive</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <em>May 2022 – Present</em>
            </p>
            <p className="mt-2 text-gray-800 dark:text-gray-200">
              Maintained and developed publishing platforms with XML workflows and Perl tools.
              Automated data processes and enhanced data features for internal tools.
            </p>
          </div>

          {/* You can add more experience blocks here as needed */}
        </div>
      </div>
    </section>
  );
}
