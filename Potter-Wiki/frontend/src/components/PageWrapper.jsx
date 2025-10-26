// frontend/src/components/PageWrapper.jsx
const PageWrapper = ({ children, loading = false }) => {
  return (
    <div className="flex flex-col flex-grow w-full min-h-screen text-white font-serif relative">
      {/* 🌀 Loader Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <span className="text-xl font-semibold italic tracking-wide text-amber-200 mb-4">
            Loading...
          </span>
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-500"></div>
        </div>
      )}

      {/* 📦 Content Area */}
      <div className="flex-grow min-h-[400px]">{children}</div>
    </div>
  );
};

export default PageWrapper;