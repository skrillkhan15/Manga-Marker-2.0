
"use client";

import React, { useRef } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Star, Trash2 } from 'lucide-react';

interface SwipeAreaProps {
  children: React.ReactNode;
  onFavorite: () => void;
  onDelete: () => void;
  isFavorite: boolean;
}

const SWIPE_THRESHOLD = -80; // How far to swipe for action
const ACTION_WIDTH = 80; // Width of one action button

export function SwipeArea({ children, onFavorite, onDelete, isFavorite }: SwipeAreaProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const constraintsRef = useRef(null);

  const handleDragEnd = (event: any, info: any) => {
    const { offset, velocity } = info;
    if (offset.x < SWIPE_THRESHOLD) {
      // Swiped far enough left
      controls.start({ x: -ACTION_WIDTH * 2 });
    } else if (offset.x > -SWIPE_THRESHOLD && offset.x < 0) {
        // Didn't swipe far enough, snap back
        controls.start({ x: 0 });
    } else {
        // Swiped right or not at all
        controls.start({ x: 0 });
    }
  };

  const handleActionClick = (action: 'favorite' | 'delete') => {
    if (action === 'favorite') {
      onFavorite();
    } else {
      onDelete();
    }
    controls.start({ x: 0 });
  };
  
  const background = useTransform(
    x,
    [-ACTION_WIDTH * 2, 0],
    ['hsl(var(--primary))', 'hsl(var(--destructive))']
  );

  return (
    <div ref={constraintsRef} className="relative w-full overflow-hidden">
        <motion.div
            className="absolute top-0 right-0 h-full flex items-center justify-end"
            style={{ x: useTransform(x, (val) => `${val}px`) }}
        >
            <div className="flex h-full">
                <button
                    onClick={() => handleActionClick('favorite')}
                    className="w-20 h-full flex items-center justify-center bg-primary text-primary-foreground"
                >
                    <Star className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                    onClick={() => handleActionClick('delete')}
                    className="w-20 h-full flex items-center justify-center bg-destructive text-destructive-foreground"
                >
                    <Trash2 className="w-6 h-6" />
                </button>
            </div>
        </motion.div>
        <motion.div
            drag="x"
            dragConstraints={{ left: -ACTION_WIDTH * 2, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            animate={controls}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            style={{ x }}
            className="relative bg-background z-10"
        >
            {children}
        </motion.div>
    </div>
  );
}
