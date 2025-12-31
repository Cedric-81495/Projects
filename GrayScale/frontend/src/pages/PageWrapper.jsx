// frontend/src/components/PageWrapper.jsx
const PageWrapper = ({ children, loading = false, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="relative inset-0 z-10 min-h-[1300px] ">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center -translate-y-[350px]">
            <div className="flex flex-col items-center">
              <div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-gray-500 rounded-full mb-4" />
              <span className="text-lg font-medium text-gray-600">
                GrayScale...
              </span>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default PageWrapper;