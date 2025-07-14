
"use client";

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  className?: string;
  size?: number;
}

export function StarRating({ rating, setRating, className, size = 4 }: StarRatingProps) {
  const isInteractive = !!setRating;

  const handleRating = (newRating: number) => {
    if (setRating) {
      // Allow un-rating by clicking the same star again
      setRating(rating === newRating ? 0 : newRating);
    }
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            `w-${size} h-${size}`,
            rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50',
            isInteractive && 'cursor-pointer'
          )}
          onClick={() => handleRating(star)}
        />
      ))}
    </div>
  );
}
