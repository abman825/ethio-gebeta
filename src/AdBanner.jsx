import React, { useEffect, useRef, useState } from 'react';

export default function AdBanner() {
  const adRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible || !adRef.current) return;
    adRef.current.innerHTML = ''; 

    const containerDiv = document.createElement('div');
    containerDiv.id = 'container-d9c95bb7e605081de3e961cccc14a6a6';

    const script = document.createElement('script');
    script.src = 'https://pl29525689.effectivecpmnetwork.com/d9c95bb7e605081de3e961cccc14a6a6/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    adRef.current.appendChild(containerDiv);
    adRef.current.appendChild(script);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    // touch-auto እና overflow-x-auto በስልክ ላይ Scroll እንዲያደርግ ይረዱታል
    <div className="z-40 my-6 flex flex-col items-center w-full max-w-4xl bg-neutral-900/90 p-3 rounded-2xl border border-neutral-700/60 shadow-2xl touch-auto">
      
      {/* የደብቅ በተን */}
      <div className="w-full flex justify-end mb-2">
        <button 
          onClick={() => setIsVisible(false)}
          className="cursor-pointer bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-lg transition active:scale-95"
        >
          ✕ ማስታወቂያውን ደብቅ (Hide)
        </button>
      </div>

      {/* የማስታወቂያው ቦታ - touch-auto ገጹን Scroll ለማድረግ ይረዳል */}
      <div 
        ref={adRef} 
        className="w-full flex justify-center min-h-[90px] overflow-x-auto touch-auto" 
      />
    </div>
  );
}