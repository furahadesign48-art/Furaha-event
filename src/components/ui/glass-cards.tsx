import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { LucideIcon } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export interface GlassCardProps {
  id: number;
  title: string;
  description: string;
  color: string;
  gradient: string;
  icon: LucideIcon;
  bullets: string[];
}

interface CardInnerProps extends GlassCardProps {
  index: number;
  total: number;
}

const rgbFromColor = (c: string) =>
  c.replace(/rgba?\(([^,]+),([^,]+),([^,]+),?[^)]*\)/, "rgb($1,$2,$3)");

const CardContent: React.FC<CardInnerProps> = ({
  title,
  description,
  index,
  total,
  color,
  gradient,
  icon: IconComponent,
  bullets,
}) => {
  const solidColor = rgbFromColor(color);
  const depth = total - 1 - index;

  return (
    <div
      data-card-index={index}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 1rem",
        zIndex: total - index,
      }}
      className="card-layer"
    >
      <div
        style={{
          position: "relative",
          width: "min(92%, 900px)",
          height: "min(68vh, 520px)",
          borderRadius: "28px",
          transformOrigin: "center bottom",
        }}
        className="card-item"
      >
        <div
          style={{
            position: "absolute",
            inset: "-3px",
            borderRadius: "31px",
            padding: "3px",
            background: `conic-gradient(
              from 0deg,
              transparent 0deg,
              ${color} 60deg,
              ${color.replace(/[\d.]+\)$/, "0.55)")} 120deg,
              transparent 180deg,
              ${color.replace(/[\d.]+\)$/, "0.3)")} 240deg,
              transparent 360deg
            )`,
            zIndex: -1,
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            opacity: 1 - depth * 0.15,
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: "28px",
            background: gradient,
            border: `1px solid ${color.replace(/[\d.]+\)$/, "0.45)")}`,
            boxShadow: `
              0 ${14 - depth * 1.8}px ${56 - depth * 6}px rgba(0, 0, 0, ${0.48 - depth * 0.06}),
              0 ${4 - depth * 0.4}px ${16 - depth * 1.5}px rgba(0, 0, 0, ${0.35 - depth * 0.04}),
              inset 0 1px 0 rgba(255, 255, 255, 0.22),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2)
            `,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "50%",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 100%)",
              pointerEvents: "none",
              borderRadius: "28px 28px 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "16px",
              right: "16px",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
              borderRadius: "1px",
              pointerEvents: "none",
            }}
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-[85%] h-[60%] pointer-events-none blur-3xl opacity-80"
            style={{
              background: `radial-gradient(ellipse at center, ${color.replace(/[\d.]+\)$/, "0.35)")} 0%, ${color.replace(/[\d.]+\)$/, "0.1)")} 45%, transparent 72%)`,
            }}
          />

          <div className="relative z-10 flex flex-col h-full p-7 md:p-10 lg:p-12">
            <div className="flex items-start gap-5 mb-5">
              <div
                className="relative p-3.5 md:p-4 rounded-2xl shrink-0"
                style={{
                  background: `linear-gradient(145deg, ${color.replace(/[\d.]+\)$/, "0.28)")}, ${color.replace(/[\d.]+\)$/, "0.08)")})`,
                  border: `1px solid ${color.replace(/[\d.]+\)$/, "0.5)")}`,
                  boxShadow: `0 8px 28px -10px ${solidColor}`,
                }}
              >
                <IconComponent
                  className="w-6 h-6 md:w-7 md:h-7"
                  style={{ color: solidColor }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="inline-flex items-center gap-2 mb-2 px-2.5 py-1 rounded-full text-[10px] md:text-[11px] font-mono tracking-wider uppercase"
                  style={{
                    background: `${color.replace(/[\d.]+\)$/, "0.18)")}`,
                    color: solidColor,
                    border: `1px solid ${color.replace(/[\d.]+\)$/, "0.35)")}`,
                  }}
                >
                  Fonction 0{index + 1}
                </div>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                  {title}
                </h3>
              </div>
            </div>

            <p
              className="leading-relaxed text-sm md:text-base lg:text-[15px] mb-6 md:mb-8 max-w-2xl"
              style={{ color: "rgba(255,255,255,0.82)" }}
            >
              {description}
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-3 mt-auto">
              {bullets.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: `linear-gradient(145deg, ${solidColor}, ${color.replace(/[\d.]+\)$/, "0.7)")})`,
                      boxShadow: `0 0 0 3px ${color.replace(/[\d.]+\)$/, "0.18)")}`,
                    }}
                  />
                  <span
                    className="text-xs md:text-sm font-medium leading-snug"
                    style={{ color: "rgba(255,255,255,0.88)" }}
                  >
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StackedCardsProps {
  cards: GlassCardProps[];
}

export const StackedCards: React.FC<StackedCardsProps> = ({ cards }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const stage = stageRef.current;
    if (!wrapper || !stage) return;

    const cardItems = gsap.utils.toArray<HTMLElement>(".card-item", stage);
    if (!cardItems.length) return;

    const N = cardItems.length;
    const STACK_OFFSET_TOP = -4;
    const STACK_SCALE_STEP = 0.01;

    const ctx = gsap.context(() => {
      cardItems.forEach((el, i) => {
        const depth = N - 1 - i;
        gsap.set(el, {
          yPercent: depth * STACK_OFFSET_TOP,
          scale: 1 - depth * STACK_SCALE_STEP,
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          pin: stage,
          anticipatePin: 1,
        },
      });

      const stepDur = N > 1 ? 1 / N : 1;

      cardItems.forEach((el, i) => {
        if (i === N - 1) return;
        const start = i * stepDur;

        tl.to(
          el,
          {
            yPercent: 160,
            opacity: 0,
            scale: 1.015,
            ease: "power2.inOut",
            duration: stepDur,
          },
          start
        );

        cardItems.forEach((behind, j) => {
          if (j > i) {
            const newDepth = N - 1 - j - 1;
            tl.to(
              behind,
              {
                yPercent: Math.max(0, newDepth) * STACK_OFFSET_TOP,
                scale: 1 - Math.max(0, newDepth) * STACK_SCALE_STEP,
                ease: "power2.inOut",
                duration: stepDur,
              },
              start
            );
          }
        });
      });
    }, wrapper);

    return () => ctx.revert();
  }, [cards.length]);

  const totalHeight = `calc(100vh + ${Math.max(cards.length - 1, 1)} * 35vh)`;

  return (
    <div
      ref={wrapperRef}
      style={{ width: "100%", height: totalHeight, position: "relative" }}
    >
      <div
        ref={stageRef}
        style={{
          top: 0,
          width: "100%",
          height: "100vh",
          position: "absolute",
          inset: 0,
        }}
      >
        {cards.map((card, index) => (
          <CardContent
            key={card.id}
            {...card}
            index={index}
            total={cards.length}
          />
        ))}
      </div>
    </div>
  );
};

export default StackedCards;
