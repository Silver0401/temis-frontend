"use client";

import { useEffect } from "react";

export default function RevealObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("lp-in");
        });
      },
      { threshold: 0.07, rootMargin: "0px 0px -48px 0px" }
    );

    document.querySelectorAll(".lp-rv").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
