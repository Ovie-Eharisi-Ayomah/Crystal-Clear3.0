import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  editable = false,
  onChange,
  className
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  // Define star size based on the size prop
  const getStarSize = () => {
    switch(size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-6 h-6';
      default: return 'w-5 h-5';
    }
  };

  const handleClick = (index: number) => {
    if (editable && onChange) {
      onChange(index + 1);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (editable) {
      setHoverRating(index + 1);
    }
  };

  const handleMouseLeave = () => {
    if (editable) {
      setHoverRating(null);
    }
  };

  const renderStar = (index: number) => {
    const displayRating = hoverRating !== null ? hoverRating : rating;
    const isFilled = index < displayRating;
    const starClass = cn(
      getStarSize(),
      'transition-colors',
      isFilled ? 'text-amber-400 fill-amber-400' : 'text-gray-300',
      editable && 'cursor-pointer hover:scale-110'
    );

    return (
      <Star
        key={index}
        className={starClass}
        onClick={() => handleClick(index)}
        onMouseEnter={() => handleMouseEnter(index)}
        onMouseLeave={handleMouseLeave}
      />
    );
  };

  return (
    <div className={cn('flex', className)}>
      {Array.from({ length: maxRating }).map((_, index) => renderStar(index))}
    </div>
  );
};