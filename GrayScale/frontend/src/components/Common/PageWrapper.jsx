import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const PageWrapper = ({ children, loading = false, minDisplay = 1000 }) => {
  const [showLoading, setShowLoading] = useState(false);
  
  // Listen to auth state
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    let timer;

    // Show spinner if either normal loading or logout
    if (loading || !user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowLoading(true);
      timer = setTimeout(() => setShowLoading(false), minDisplay);
    } else {
      timer = setTimeout(() => setShowLoading(false), minDisplay);
    }

    return () => clearTimeout(timer);
  }, [loading, minDisplay, user]);


  return (
    <>
      {showLoading && (
        <div className="fixed inset-0 z-10 bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-black rounded-full mb-4" />
            <span className="text-lg font-medium text-black">GrayScale...</span>
          </div>
        </div>
      )}

      <div className={`${showLoading ? "pointer-events-none select-none" : ""}`}>
        {children}
      </div>
    </>
  );
};

export default PageWrapper;
