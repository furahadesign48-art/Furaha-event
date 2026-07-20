import React, { useState, useEffect, useRef, HTMLAttributes, useCallback } from 'react';

// A simple utility for conditional class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Define the type for a single gallery item
export interface GalleryItem {
  common: string;
  binomial: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by: string;
  };
}

// Define the props for the CircularGallery component
interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Controls how far the items are from the center. */
  radius?: number;
  /** Controls the speed of auto-rotation when not scrolling. */
  autoRotateSpeed?: number;
  onImageClick?: (item: GalleryItem) => void;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius: propRadius = 600, autoRotateSpeed = 0.02, onImageClick, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [lastX, setLastX] = useState(0);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const animationFrameRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const radius = windowWidth < 768 ? 280 : windowWidth < 1024 ? 380 : propRadius;

    // Handle drag start
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      setLastX(clientX);
    };

    // Handle drag move
    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const clientX = 'touches' in e 
        ? (e as TouchEvent).touches[0].clientX 
        : (e as MouseEvent).clientX;
      
      const deltaX = clientX - lastX;
      setLastX(clientX);
      setRotation(prev => prev + deltaX * 0.3);
    }, [isDragging, lastX]);

    // Handle drag end
    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    // Add global event listeners for drag
    useEffect(() => {
      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleMouseMove);
        window.addEventListener('touchend', handleMouseUp);
      } else {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      }
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Auto rotation when not dragging
    useEffect(() => {
      const autoRotate = () => {
        if (!isDragging) {
          setRotation(prev => prev + autoRotateSpeed);
        }
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isDragging, autoRotateSpeed]);

    const anglePerItem = 360 / items.length;
    
    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn(
          "relative w-full h-full flex items-center justify-center overflow-hidden",
          className
        )}
        style={{ perspective: '2000px' }}
        {...props}
      >
        <div
          className="relative w-full h-full cursor-grab active:cursor-grabbing"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.3, 1 - (normalizedAngle / 180));
            const scale = Math.max(0.7, 1 - (normalizedAngle / 360));
            const zIndex = Math.round(1000 - normalizedAngle);

            return (
              <div
                key={item.photo.url}
                role="group"
                aria-label={item.common}
                className="absolute w-[240px] h-[336px] md:w-[360px] md:h-[504px] lg:w-[390px] lg:h-[520px] transition-all duration-300"
                style={{
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px) scale(${scale})`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-120px',
                  marginTop: '-168px',
                  opacity: opacity,
                  zIndex: zIndex
                }}
                onClick={() => onImageClick && onImageClick(item)}
              >
                <div className="relative w-full h-full rounded-[20px] shadow-2xl overflow-hidden group border border-white/20 bg-black/20 backdrop-blur-lg">
                  <img
                    src={item.photo.url}
                    alt={item.photo.text}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    style={{ objectPosition: item.photo.pos || 'center' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-full p-4 text-white">
              <h2 className="text-base font-bold mb-1">{item.common}</h2>
              <em className="text-xs italic opacity-80 block mb-1">{item.binomial}</em>
              <p className="text-[10px] opacity-70">Nos mémoires</p>
            </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
