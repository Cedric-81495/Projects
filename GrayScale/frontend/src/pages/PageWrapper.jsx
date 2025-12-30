// frontend/src/components/PageWrapper.jsx
const PageWrapper = ({ children, loading = false }) => {
  return (
    <div className="flex flex-col min-h-screen w-full relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center pointer-events-auto">
            <div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-gray-500 rounded-full mb-4"></div>
            <span className="text-lg font-medium text-red">GrayScale...</span>
          </div>
        </div>
      )}

      {/* 📦 Content Area */}
      <div className="flex-grow">{children}</div>
    </div>
  );
};

export default PageWrapper;
