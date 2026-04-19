'use client';

import { motion } from 'framer-motion';

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function ReasonList({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <div className="space-y-4">
      <p className="app-label mb-0">Risk Factors</p>
      <motion.ul variants={listVariants} initial="hidden" animate="show" className="space-y-3">
        {reasons.map((r, i) => (
          <motion.li
            key={i}
            variants={itemVariants}
            className="flex items-start gap-3 rounded-[20px] border border-rose-400/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 backdrop-blur-md"
          >
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="leading-7">{r}</span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
