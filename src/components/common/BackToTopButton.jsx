import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const BackToTopButton = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      // Find the scrollable container (main element with overflow-y-auto)
      const scrollContainer = document.querySelector(
        'main[class*="overflow-y-auto"]'
      );
      const scrollY = scrollContainer
        ? scrollContainer.scrollTop
        : window.pageYOffset || document.documentElement.scrollTop;

      if (scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Check initial scroll position
    toggleVisibility();

    // Listen to scroll on the main container
    const scrollContainer = document.querySelector(
      'main[class*="overflow-y-auto"]'
    );

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", toggleVisibility);
      return () => {
        scrollContainer.removeEventListener("scroll", toggleVisibility);
      };
    } else {
      // Fallback to window scroll
      window.addEventListener("scroll", toggleVisibility);
      return () => {
        window.removeEventListener("scroll", toggleVisibility);
      };
    }
  }, []);

  // Scroll to top smoothly
  const scrollToTop = () => {
    const scrollContainer = document.querySelector(
      'main[class*="overflow-y-auto"]'
    );
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 z-50 bg-primary-500 hover:bg-primary-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label={t("common.backToTop")}
          title={t("common.backToTop")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="transition-transform duration-200"
          >
            <path d="M7 14l5-5 5 5z" />
          </svg>
        </button>
      )}
    </>
  );
};

export default BackToTopButton;
