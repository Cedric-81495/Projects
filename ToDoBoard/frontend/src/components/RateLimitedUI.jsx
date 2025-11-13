import { ZapIcon } from "lucide-react";

const RateLimitedUI = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center bg-primary/10 border border-primary/30 rounded-lg shadow-md p-6">
        <div className="flex-shrink-0 bg-primary/20 p-4 rounded-full mb-4 md:mb-0 md:mr-6">
          <ZapIcon className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold mb-2">Rate Limit Exceeded</h3>
          <p className="text-base-content mb-1">
            You have exceeded the allowed number of requests. Please wait a moment before trying again.
          </p>
          <p className="text-sm text-base-content/70">
            Try again in a few seconds for the best experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RateLimitedUI;
