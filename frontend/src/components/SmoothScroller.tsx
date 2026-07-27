import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ReactLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollerProps {
  children: ReactNode;
}

export default function SmoothScroller({ children }: SmoothScrollerProps) {
  useEffect(() => {
    // Keep GSAP ScrollTrigger in sync with Lenis
    ScrollTrigger.refresh();
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
