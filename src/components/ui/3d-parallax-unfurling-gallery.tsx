import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
  HTMLAttributes,
  forwardRef,
} from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

export interface ParallaxGalleryItem {
  src: string;
  alt?: string;
}

const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogg|ogv|avi|mkv|flv|wmv|3gp)(\?.*)?$/i;
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return VIDEO_EXT_RE.test(url.split('#')[0]);
}

interface ParallaxUnfurlingGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: ParallaxGalleryItem[];
  onImageClick?: (item: ParallaxGalleryItem, index: number) => void;
  themeBg?: string;
  themeAccent?: string;
}

interface ImageCardProps {
  src: string;
  alt?: string;
  onClick?: () => void;
  index: number;
  isHovered?: boolean;
}

const ImageCard = forwardRef<HTMLDivElement, ImageCardProps>(
  ({ src, alt, onClick, index }, ref) => {
    const isVideo = isVideoUrl(src);
    return (
      <div
        ref={ref}
        onClick={onClick}
        className="w-full h-full cursor-pointer relative will-change-transform backface-hidden overflow-hidden rounded-[2px] sm:rounded-sm group"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {isVideo ? (
          <video
            src={src}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.06] group-hover:brightness-110 opacity-95 group-hover:opacity-100"
            muted
            loop
            playsInline
            preload="metadata"
            draggable={false}
          />
        ) : (
          <img
            src={src}
            alt={alt || "Gallery Asset"}
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.06] group-hover:brightness-110 opacity-95 group-hover:opacity-100"
            draggable={false}
          />
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/55 backdrop-blur-md border border-white/25 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:bg-black/70">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="translate-x-[1px]"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/30 pointer-events-none transition-opacity duration-300 group-hover:from-black/20 group-hover:via-black/0 group-hover:to-black/10" />
        <div className="absolute inset-0 ring-1 ring-black/60 pointer-events-none" />
        <div className="absolute top-2 left-2 text-[9px] tracking-[0.2em] font-bold text-white/60 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          0{index + 1}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    );
  }
);
ImageCard.displayName = "ImageCard";

const ParallaxUnfurlingGallery = forwardRef<
  HTMLDivElement,
  ParallaxUnfurlingGalleryProps
>(
  (
    { items, onImageClick, className, themeBg = "#000000", themeAccent = "#1a1a2e", ...props },
    ref
  ) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < 768);
      check();
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }, []);

    const safeItems = useMemo(() => (items.length > 0 ? items : []), [items]);

    // Repeat to fill columns (like the reference does) so the grid is always dense
    const filledItems = useMemo(() => {
      if (safeItems.length === 0) return [];
      const needed = 14;
      const out: ParallaxGalleryItem[] = [];
      while (out.length < needed) out.push(...safeItems);
      return out.slice(0, Math.max(needed, safeItems.length));
    }, [safeItems]);

    // Build 4 columns (indexes match reference pattern)
    const columns = useMemo(() => {
      return {
        col1: filledItems.filter((_, i) => i % 4 === 0),
        col2: filledItems.filter((_, i) => i % 4 === 1),
        col3: filledItems.filter((_, i) => i % 4 === 2),
        col4: filledItems.filter((_, i) => i % 4 === 3),
      };
    }, [filledItems]);

    // Flat mapping for mobile (original ordering)
    const flatIndexed = useMemo(() => {
      return safeItems.map((it, i) => ({ ...it, originalIndex: i }));
    }, [safeItems]);

    // ================ DESKTOP: 3D mouse-parallax tilted grid ================
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const smoothMx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.6 });
    const smoothMy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.6 });

    // Main 3D transforms for the whole matrix
    const rotateX = useTransform(smoothMy, [-1, 1], [20, 8]);
    const rotateY = useTransform(smoothMx, [-1, 1], [-20, -8]);
    const rotateZ = useTransform(smoothMy, [-1, 1], [10, 5]);

    // Subtle column parallax offsets (vertical shift per column on mouse move)
    const colShift1 = useTransform(smoothMy, [-1, 1], ["-8%", "4%"]);
    const colShift2 = useTransform(smoothMy, [-1, 1], ["6%", "-10%"]);
    const colShift3 = useTransform(smoothMx, [-1, 1], ["-6%", "6%"]);
    const colShift4 = useTransform(smoothMx, [-1, 1], ["10%", "-4%"]);

    const handleMove = useCallback(
      (clientX: number, clientY: number) => {
        const el = wrapperRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
        mx.set(nx);
        my.set(ny);
      },
      [mx, my]
    );

    // ================ MOBILE: diagonal stacked swipe ================
    const scrollerRef = useRef<HTMLDivElement | null>(null);

    return (
      <div
        ref={(el) => {
          wrapperRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref)
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className={cn("w-full relative overflow-hidden", className)}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
        }}
        {...props}
      >
        {/* Glass effect subtle inner border + shading */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.15) 100%)",
          }}
        />
        {/* Soft darkened overlay to keep glass feel a bit muted */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-black/20"
        />

        {!isMobile ? (
          // ================ DESKTOP VIEW ================
          <div
            className="relative w-full h-[560px] sm:h-[620px] md:h-[720px] overflow-hidden cursor-crosshair select-none"
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseLeave={() => {
              mx.set(0);
              my.set(0);
            }}
            onTouchMove={(e) => {
              const t = e.touches[0];
              if (t) handleMove(t.clientX, t.clientY);
            }}
            onTouchEnd={() => {
              mx.set(0);
              my.set(0);
            }}
          >
            {/* Ambient inner mask (matches reference: dark vignette around) */}
            <div
              aria-hidden
              className="absolute inset-0 z-30 pointer-events-none"
              style={{
                boxShadow:
                  "inset 0 140px 240px -40px rgba(0,0,0,0.95), inset 0 -140px 240px -40px rgba(0,0,0,0.95), inset 220px 0 240px -60px rgba(0,0,0,0.95), inset -220px 0 240px -60px rgba(0,0,0,0.95)",
              }}
            />
            {/* Thin top + bottom decorative border */}
            <div aria-hidden className="absolute top-0 inset-x-0 h-[2px] z-30 pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
            <div aria-hidden className="absolute bottom-0 inset-x-0 h-[2px] z-30 pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />

            {/* Perspective wrapper */}
            <div
              className="absolute inset-0 flex justify-center items-center pointer-events-none"
              style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
            >
              <motion.div
                style={{
                  rotateX,
                  rotateY,
                  rotateZ,
                  transformStyle: "preserve-3d",
                }}
                className="flex gap-2 sm:gap-3 md:gap-5 justify-center items-center w-[120vw] h-[160vh] origin-center will-change-transform backface-hidden pointer-events-auto"
              >
                {/* Column 1 */}
                <motion.div
                  style={{ y: colShift1 }}
                  className="flex flex-col gap-2 sm:gap-3 md:gap-5 w-[21vw] min-w-[160px]"
                >
                  {columns.col1.map((it, k) => {
                    const originalIdx = filledItems.findIndex(
                      (f) => f === it && f.src === it.src
                    );
                    const orig = Math.max(0, originalIdx % Math.max(1, safeItems.length));
                    return (
                      <div
                        key={`c1-${k}`}
                        className="w-full h-[180px] sm:h-[210px] md:h-[260px]"
                      >
                        <ImageCard
                          src={it.src}
                          alt={it.alt}
                          index={orig}
                          onClick={() => onImageClick?.(safeItems[orig] || it, orig)}
                        />
                      </div>
                    );
                  })}
                </motion.div>

                {/* Column 2 */}
                <motion.div
                  style={{ y: colShift2 }}
                  className="flex flex-col gap-2 sm:gap-3 md:gap-5 w-[21vw] min-w-[160px] md:mt-[-130px]"
                >
                  {columns.col2.map((it, k) => {
                    const originalIdx =
                      (filledItems.findIndex((f) => f === it) + 1) %
                      Math.max(1, safeItems.length);
                    const orig = Math.max(0, originalIdx);
                    return (
                      <div
                        key={`c2-${k}`}
                        className="w-full h-[180px] sm:h-[210px] md:h-[260px]"
                      >
                        <ImageCard
                          src={it.src}
                          alt={it.alt}
                          index={orig}
                          onClick={() => onImageClick?.(safeItems[orig] || it, orig)}
                        />
                      </div>
                    );
                  })}
                </motion.div>

                {/* Column 3 */}
                <motion.div
                  style={{ y: colShift3 }}
                  className="flex flex-col gap-2 sm:gap-3 md:gap-5 w-[21vw] min-w-[160px] md:mt-[-60px]"
                >
                  {columns.col3.map((it, k) => {
                    const originalIdx =
                      (filledItems.findIndex((f) => f === it) + 2) %
                      Math.max(1, safeItems.length);
                    const orig = Math.max(0, originalIdx);
                    return (
                      <div
                        key={`c3-${k}`}
                        className="w-full h-[180px] sm:h-[210px] md:h-[260px]"
                      >
                        <ImageCard
                          src={it.src}
                          alt={it.alt}
                          index={orig}
                          onClick={() => onImageClick?.(safeItems[orig] || it, orig)}
                        />
                      </div>
                    );
                  })}
                </motion.div>

                {/* Column 4 */}
                <motion.div
                  style={{ y: colShift4 }}
                  className="flex flex-col gap-2 sm:gap-3 md:gap-5 w-[21vw] min-w-[160px] md:mt-[-180px]"
                >
                  {columns.col4.map((it, k) => {
                    const originalIdx =
                      (filledItems.findIndex((f) => f === it) + 3) %
                      Math.max(1, safeItems.length);
                    const orig = Math.max(0, originalIdx);
                    return (
                      <div
                        key={`c4-${k}`}
                        className="w-full h-[180px] sm:h-[210px] md:h-[260px]"
                      >
                        <ImageCard
                          src={it.src}
                          alt={it.alt}
                          index={orig}
                          onClick={() => onImageClick?.(safeItems[orig] || it, orig)}
                        />
                      </div>
                    );
                  })}
                </motion.div>
              </motion.div>
            </div>
          </div>
        ) : (
          // ================ MOBILE VIEW: Diagonal stacked tilt swipe ================
          <div className="relative w-full py-4 px-3 sm:px-4">
            <div
              ref={scrollerRef}
              className="w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar -mx-3 px-3 sm:-mx-4 sm:px-4"
              style={{
                scrollbarWidth: "none",
                perspective: "1100px",
                perspectiveOrigin: "50% 50%",
              }}
            >
              <div
                className="flex gap-4 sm:gap-6 py-6 px-1"
                style={{ transformStyle: "preserve-3d" }}
              >
                {flatIndexed.map((it, i) => {
                  // Alternate rotation for stacked look
                  const rot = i % 2 === 0 ? -4 : 4;
                  const yShift = i % 2 === 0 ? -12 : 14;
                  return (
                    <motion.div
                      key={`m-${i}`}
                      initial={{ opacity: 0, rotateY: -20, x: -20 }}
                      whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.5, delay: Math.min(i * 0.08, 0.5) }}
                      className="snap-center shrink-0 w-[74%] sm:w-[60%]"
                      style={{
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <div
                        onClick={() => onImageClick?.(safeItems[i] || it, it.originalIndex)}
                        className="relative w-full h-[380px] sm:h-[460px] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10 group transition-transform duration-300 active:scale-95"
                        style={{
                          transform: `rotate(${rot}deg) translateY(${yShift}px)`,
                        }}
                      >
                        {isVideoUrl(it.src) ? (
                          <video
                            src={it.src}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            draggable={false}
                          />
                        ) : (
                          <img
                            src={it.src}
                            alt={it.alt || `Photo ${i + 1}`}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            draggable={false}
                          />
                        )}
                        {isVideoUrl(it.src) && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/25 text-white shadow-lg">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="translate-x-[2px]"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                        )}
                        {/* Dark overlay same tone as desktop */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/30 pointer-events-none" />
                        <div className="absolute inset-0 rounded-xl sm:rounded-2xl ring-1 ring-black/60 pointer-events-none" />
                        {/* Index badge */}
                        <div className="absolute top-4 left-4 px-3 py-1 rounded-full backdrop-blur-md bg-black/30 border border-white/15 text-[10px] tracking-[0.25em] uppercase font-black text-white/90">
                          0{i + 1}
                        </div>
                        {/* Bottom reveal hint */}
                        <div className="absolute bottom-0 inset-x-0 p-4 flex justify-between items-end">
                          <div className="h-[2px] w-16 bg-gradient-to-r from-white/70 to-transparent rounded-full" />
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white/80"
                          >
                            <path d="M15 3h6v6" />
                            <path d="M10 14 21 3" />
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          </svg>
                        </div>
                        {/* Shimmer */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 pointer-events-none" />
                      </div>
                    </motion.div>
                  );
                })}
                {/* End padding */}
                <div className="shrink-0 w-[12%] sm:w-[20%]" aria-hidden />
              </div>
            </div>
            {/* Scroll hint indicator */}
            <div className="mt-4 flex items-center justify-center gap-3 text-white/50 text-[10px] tracking-[0.3em] uppercase font-semibold">
              <span className="h-[1px] w-8 bg-white/20" />
              Swipe
              <span className="h-[1px] w-8 bg-white/20" />
            </div>
          </div>
        )}
      </div>
    );
  }
);

ParallaxUnfurlingGallery.displayName = "ParallaxUnfurlingGallery";
export default ParallaxUnfurlingGallery;
