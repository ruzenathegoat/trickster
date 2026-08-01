import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  className?: string;
}

export default function AnimatedCounter({ value, decimals = 0, className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 40,
    stiffness: 200,
  });
  const isInView = useInView(ref, { once: true, margin: "-5%" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Number(latest).toFixed(decimals);
      }
    });
  }, [springValue, decimals]);

  return <span ref={ref} className={className}>{value.toFixed(decimals)}</span>;
}
