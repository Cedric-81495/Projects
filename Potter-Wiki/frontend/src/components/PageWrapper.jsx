// frontend/src/components/PageWrapper.jsx
const PageWrapper = ({ children, loading = false }) => {
  return (
    <div className="flex flex-col flex-grow bg-gradient-to-b from-[#0B0B0B] via-[#111111] to-[#1a1a1a] text-white font-serif px-4 pt-20 relative">
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