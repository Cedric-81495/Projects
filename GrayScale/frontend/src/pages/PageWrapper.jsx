// frontend/src/pages/PageWrapper.jsx
const PageWrapper = ({ children, loading = false, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="relative min-h-[1300px]">

        {/* BLUR + OVERLAY */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-black/30 backdrop-blur-sm transition-all duration-300" />
        )}

        {/* LOADING SPINNER */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center -translate-y-[350px]">
            <div className="flex flex-col items-center">
              <div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-gray-200 rounded-full mb-4" />
              <span className="text-lg font-medium text-black">
                GrayScale...
              </span>
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <div className={`${loading ? "pointer-events-none select-none" : ""}`}>
          {children}
        </div>

      </div>
    </div>
  );
};

export default PageWrapper;
