import React, { useEffect } from 'react';

// Get tracking ID from environment variable
const TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || "";

function GoogleAnalytics() {
  useEffect(() => {
    // Only load Google Analytics if TRACKING_ID is available
    if (!TRACKING_ID) {
      console.warn('Google Analytics tracking ID not found');
      return;
    }
    
    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${TRACKING_ID}`;
    
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${TRACKING_ID}');
    `;
    
    document.head.appendChild(script1);
    document.head.appendChild(script2);
    
    return () => {
      // Clean up
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);
  
  return null; // This component doesn't render anything
}

export default GoogleAnalytics;