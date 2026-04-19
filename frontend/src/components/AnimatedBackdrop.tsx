'use client';

import { motion } from 'framer-motion';

export default function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute left-[-10%] top-16 h-[28rem] w-[28rem] rounded-full bg-cyan-400/[0.16] blur-[120px]"
        animate={{ x: [0, 90, -20, 0], y: [0, 50, -25, 0], scale: [1, 1.15, 0.96, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-6%] top-[20%] h-[24rem] w-[24rem] rounded-full bg-sky-500/[0.14] blur-[110px]"
        animate={{ x: [0, -70, 30, 0], y: [0, 70, -30, 0], scale: [1, 0.92, 1.08, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[30%] h-[20rem] w-[20rem] rounded-full bg-emerald-400/10 blur-[105px]"
        animate={{ x: [0, 50, -40, 0], y: [0, -60, 30, 0], scale: [1, 1.12, 0.94, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 2.4 }}
      />
    </div>
  );
}
