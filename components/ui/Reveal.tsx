"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Delay in seconds before the animation starts. */
  delay?: number;
  /** Initial vertical offset in px. */
  y?: number;
}

/** Reveals its content once it scrolls into view. */
export function Reveal({ children, className, style, delay = 0, y = 28 }: RevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Gap in seconds between each child's reveal. */
  stagger?: number;
}

/** Container whose direct <StaggerItem> children reveal one after another. */
export function Stagger({ children, className, style, stagger = 0.12 }: StaggerProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  y?: number;
}

/** A single item inside a <Stagger> container. */
export function StaggerItem({ children, className, style, y = 28 }: StaggerItemProps) {
  const reduce = useReducedMotion();

  const variants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: EASE },
    },
  };

  return (
    <motion.div className={className} style={style} variants={variants}>
      {children}
    </motion.div>
  );
}
