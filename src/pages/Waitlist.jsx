import React, { useEffect } from "react";

const Waitlist = () => {
  useEffect(() => {
    // Dynamically load Tally embed script
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount to prevent duplicate scripts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl">
        <iframe
          data-tally-src="https://tally.so/embed/441vPk?alignLeft=1&hideTitle=0&transparentBackground=1&dynamicHeight=1"
          loading="lazy"
          width="100%"
          height="800"
          frameBorder="0"
          marginHeight="0"
          marginWidth="0"
          title="Join the PrimuxCare Dental Waitlist"
        ></iframe>
      </div>
    </div>
  );
};

export default Waitlist;
