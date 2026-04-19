'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function AnimatedBackdrop() {
  const reduced = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute left-[-5%] top-16 h-[16rem] w-[16rem] rounded-full bg-cyan-400/[0.16] blur-[90px] sm:h-[22rem] sm:w-[22rem] sm:blur-[110px] lg:h-[28rem] lg:w-[28rem] lg:blur-[120px]"
        animate={reduced ? false : { x: [0, 90, -20, 0], y: [0, 50, -25, 0], scale: [1, 1.15, 0.96, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-3%] top-[20%] h-[14rem] w-[14rem] rounded-full bg-sky-500/[0.14] blur-[80px] sm:h-[20rem] sm:w-[20rem] sm:blur-[100px] lg:h-[24rem] lg:w-[24rem] lg:blur-[110px]"
        animate={reduced ? false : { x: [0, -70, 30, 0], y: [0, 70, -30, 0], scale: [1, 0.92, 1.08, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
      />
      <motion.div
        className="absolute bottom-[-5%] left-[30%] h-[12rem] w-[12rem] rounded-full bg-emerald-400/10 blur-[75px] sm:h-[16rem] sm:w-[16rem] sm:blur-[95px] lg:h-[20rem] lg:w-[20rem] lg:blur-[105px]"
        animate={reduced ? false : { x: [0, 50, -40, 0], y: [0, -60, 30, 0], scale: [1, 1.12, 0.94, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 2.4 }}
      />
    </div>
  );
}
