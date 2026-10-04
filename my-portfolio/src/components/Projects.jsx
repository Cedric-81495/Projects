import potterWiki from "../assets/potterWiki.jpg";
import grayScale from "../assets/grayScale.jpg";

export default function Projects() {
  return (
    <section
      id="projects"
      className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6"
    >
      <div className="max-w-6xl mx-auto pt-24 md:pt-32">
        {/* Section label */}
        <p className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
          Work
        </p>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Projects
        </h2>

        {/* Projects Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Project Card */}
          <ProjectCard
            title="Potter Wiki"
            description="A full-stack MERN application for exploring Harry Potter data, featuring authentication, admin CRUD functionality, and a clean Tailwind-based UI."
            link="https://mern-potter-wiki.onrender.com"
            imgSrc={potterWiki}
          />

          {/* Client project: the PDF lives in /public, so it is served at /GWOP-Funnel-Page.pdf */}
          <ProjectCard
            title="GWOP Funnel Page"
            badge="Client Project"
            description="A sales funnel page built for GWOP that guides visitors from first impression to sign-up, with clear messaging, strong calls to action, and a mobile-responsive layout."
            link="/GWOP-Funnel-Page.pdf"
            linkLabel="View Case Study (PDF)"
            cover={<FunnelCover />}
          />

          <ProjectCard
            title="GrayScale"
            description="A full-stack MERN e-commerce platform for fashion products, supporting real-world user flows, admin management, and secure transactions."
            link="https://mern-grayscale.onrender.com"
            imgSrc={grayScale}
          />
        </div>
      </div>
    </section>
  );
}


function ProjectCard({
  title,
  description,
  link,
  imgSrc,
  cover,
  badge,
  linkLabel = "View Project",
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-lg transition flex flex-col overflow-hidden">
      
      {/* Project Image (or a custom cover when there is no screenshot) */}
      {(imgSrc || cover) && (
        <div className="w-full h-48 md:h-56 overflow-hidden">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            cover
          )}
        </div>
      )}

      {/* Card Content */}
      <div className="p-6 flex flex-col flex-1">
        {badge && (
          <span className="self-start mb-3 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
            {badge}
          </span>
        )}

        <h3 className="text-xl font-semibold mb-3">
          {title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-1">
          {description}
        </p>

        <div className="mt-6">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center rounded-md
                       bg-gray-900 dark:bg-white
                       text-white dark:text-gray-900
                       py-2 font-medium
                       hover:opacity-90 transition"
          >
            {linkLabel}
          </a>
        </div>
      </div>
    </div>
  );
}


/* Simple funnel illustration used until a real screenshot is added.
   To use a screenshot instead: import it at the top and pass imgSrc={...} to the card. */
function FunnelCover() {
  const steps = [
    { label: "Landing Page", width: "100%" },
    { label: "Opt-in Form", width: "78%" },
    { label: "Offer", width: "56%" },
    { label: "Thank You", width: "36%" },
  ];

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center gap-2 px-8 transition-transform duration-300 hover:scale-105">
      {steps.map((step, i) => (
        <div
          key={step.label}
          style={{ width: step.width, opacity: 1 - i * 0.18 }}
          className="rounded-md bg-white text-gray-900 text-xs font-semibold text-center py-2"
        >
          {step.label}
        </div>
      ))}
    </div>
  );
}
