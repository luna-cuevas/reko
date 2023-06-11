import React, { useState, useEffect } from "react";

const BREAKPOINTS: { [key: string]: string } = {
  "(max-width: 767px)": "mobile",
  "(min-width: 768px) and (max-width: 1024px)": "tablet",
  "(min-width: 1025px) and (max-width: 1366px)": "laptop",
  "(min-width: 1367px) and (max-width: 1920px)": "desktop",
  "(min-width: 1921px)": "wideScreen",
};

export default function useMatchMedia() {
  const [mediaMatch, setMediaMatch] = useState<string | undefined>();

  const handleResize = (event: MediaQueryListEvent) => {
    if (event.media in BREAKPOINTS && event.matches) {
      setMediaMatch(BREAKPOINTS[event.media]);
    }
  };

  useEffect(() => {
    const initialMatch = Object.entries(BREAKPOINTS).find(
      ([query, mediaMatch]) => {
        if (window.matchMedia(query).matches) {
          setMediaMatch(mediaMatch);
          return true;
        }
        return false;
      }
    );

    if (!initialMatch) {
      setMediaMatch(undefined);
    }

    Object.keys(BREAKPOINTS).forEach((query) =>
      window.matchMedia(query).addEventListener("change", handleResize)
    );

    return () =>
      Object.keys(BREAKPOINTS).forEach((query) =>
        window.matchMedia(query).removeEventListener("change", handleResize)
      );
  }, []);

  return {
    isMobile: mediaMatch === "mobile",
    isTablet: mediaMatch === "tablet",
    isLaptop: mediaMatch === "laptop",
    isDesktop: mediaMatch === "desktop",
    isWideScreen: mediaMatch === "wideScreen",
    mediaMatch: mediaMatch,
  };
}
