// src/components/PageWrapper.jsx
const PageWrapper = ({ children, loading = false }) => {
  return (
    <div className="min-h-screen flex flex-col pt-10 px-4 relative">
      {/* Loader overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20">
          <span className="text-xl font-semibold italic tracking-wide mb-4">
            Loading...
          </span>
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
        </div>
      )}

      {/* Content area (still reserves space even if empty) */}
      <div className="flex-grow min-h-[400px]">{children}</div>
    </div>
  );
};

export default PageWrapper;
