'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  duration = 0.72,
  once = true,
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FloatingPanel({
  children,
  className,
  delay = 0,
}: Omit<RevealProps, 'y' | 'duration' | 'once'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.01 }}
      className={clsx(className)}
    >
      {children}
    </motion.div>
  );
}
