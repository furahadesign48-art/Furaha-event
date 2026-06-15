"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { Feather } from 'lucide-react';

interface TypewriterWithPenProps {
  htmlContent: string;
  speed?: number;
  className?: string;
  penColor?: string;
  penImage?: string;
}

/**
 * TypewriterWithPen - A component that types out HTML content character by character
 * while preserving layout, alignment, and line breaks.
 */
export const TypewriterWithPen = React.memo(({ 
  htmlContent, 
  speed = 30, 
  className = "", 
  penColor = "#000",
  penImage
}: TypewriterWithPenProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const [visibleChars, setVisibleChars] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [penPosition, setPenPosition] = useState({ x: 0, y: 0 });
  
  // Extract all text nodes and their positions to count characters
  const totalChars = useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent?.length || 0;
  }, [htmlContent]);

  useEffect(() => {
    if (isInView && !isDone) {
      let current = 0;
      const interval = setInterval(() => {
        if (current <= totalChars) {
          setVisibleChars(current);
          current++;
        } else {
          setIsDone(true);
          clearInterval(interval);
        }
      }, speed);
      
      return () => clearInterval(interval);
    }
  }, [isInView, totalChars, speed, isDone]);

  // Track the position of the last visible character to move the pen
  useEffect(() => {
    if (activeCharRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const charRect = activeCharRef.current.getBoundingClientRect();
      
      setPenPosition({
        x: charRect.left - containerRect.left + charRect.width,
        y: charRect.top - containerRect.top
      });
    }
  }, [visibleChars, isDone]);

  // Animation variants for the pen movement
  const penVariants = {
    writing: {
      rotate: [-15, -10, -20, -15], // Position plus "debout"
      x: [0, 1, -1, 0],
      y: [0, -0.5, 0.5, 0],
      transition: {
        duration: 0.4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Helper to render HTML with character-level visibility control
  const renderContent = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    let charCounter = 0;

    const traverse = (node: Node): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        return Array.from(text).map((char, i) => {
          charCounter++;
          const isVisible = charCounter <= visibleChars;
          const isCurrent = charCounter === visibleChars;

          return (
            <span 
              key={`${charCounter}-${i}`} 
              ref={isCurrent ? activeCharRef : null}
              className="relative inline"
              style={{ 
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.2s ease-in'
              }}
            >
              {char}
            </span>
          );
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const Tag = element.tagName.toLowerCase() as any;
        const style: React.CSSProperties = {};
        
        if (element.style.color) style.color = element.style.color;
        if (element.tagName === 'STRONG' || element.tagName === 'B') style.fontWeight = 'bold';
        
        return (
          <Tag key={`node-${charCounter}`} style={style}>
            {Array.from(element.childNodes).map((child, i) => traverse(child))}
          </Tag>
        );
      }
      return null;
    };

    return Array.from(tempDiv.childNodes).map((node, i) => traverse(node));
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full text-center whitespace-pre-wrap ${className}`}
    >
      <div className="inline-block w-full text-center relative">
        {renderContent()}

        {/* Persistent Pen that moves smoothly */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: (isInView && visibleChars > 0) ? 1 : 0,
            x: penPosition.x,
            y: penPosition.y,
          }}
          transition={{ 
            x: { type: "spring", stiffness: 150, damping: 20, mass: 0.5 },
            y: { type: "spring", stiffness: 150, damping: 20, mass: 0.5 },
            opacity: { duration: 0.3 }
          }}
          className="absolute pointer-events-none z-[100]"
          style={{ 
            left: 0,
            top: 0,
            width: '40px',
            height: '40px'
          }}
        >
          <motion.div
            variants={!isDone ? penVariants : {}}
            animate={!isDone ? "writing" : ""}
            initial={{ rotate: -15 }}
            className="w-full h-full"
          >
            {penImage ? (
              <img 
                src={penImage} 
                alt="" 
                className="w-full h-full object-contain transform -translate-y-11 -translate-x-3 rotate-[-30deg]" 
              />
            ) : (
              <Feather 
                size={24} 
                style={{ color: penColor }} 
                className="transform rotate-12 -translate-y-4"
              />
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
});
