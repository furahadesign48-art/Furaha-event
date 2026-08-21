import React, { useEffect, useRef, useMemo, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  /* Environment Overlays */
  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.06; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
      background-size: 60px 60px;
      background-image:
          linear-gradient(to right, rgba(251,191,36,0.07) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(251,191,36,0.07) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at 50% 35%, black 0%, transparent 72%);
      -webkit-mask-image: radial-gradient(ellipse at 50% 35%, black 0%, transparent 72%);
  }

  /* -------------------------------------------------------------------
     THEME GOLD TEXTURES (3D matte / silver-matte / card-gold-matte)
  ---------------------------------------------------------------------- */

  .text-3d-matte {
      color: #ffffff;
      text-shadow:
          0 10px 30px rgba(251,191,36,0.18),
          0 2px 6px rgba(0,0,0,0.65);
  }

  .text-gold-matte {
      color: #fcd34d;
      transform: translateZ(0);
      filter:
          drop-shadow(0px 4px 10px rgba(0,0,0,0.55));
  }

  .text-card-gold-matte {
      background: linear-gradient(180deg, #fff7db 0%, #fcd34d 45%, #b45309 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter:
          drop-shadow(0px 14px 28px rgba(0,0,0,0.85))
          drop-shadow(0px 4px 8px rgba(251,191,36,0.45));
  }

  /* Deep Physical Premium Card — gold/dark theme */
  .premium-depth-card {
      background:
          radial-gradient(1200px ellipse at 20% -10%, rgba(251,191,36,0.18) 0%, transparent 55%),
          linear-gradient(145deg, #1a1305 0%, #0b0f17 60%, #06080d 100%);
      box-shadow:
          0 40px 100px -20px rgba(0,0,0,0.9),
          0 20px 40px -20px rgba(0,0,0,0.8),
          inset 0 1px 2px rgba(255,255,255,0.08),
          inset 0 -2px 4px rgba(0,0,0,0.9);
      border: 1px solid rgba(251,191,36,0.12);
      position: relative;
  }

  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(900px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.08) 0%, rgba(251,191,36,0.05) 22%, transparent 45%);
      mix-blend-mode: screen; transition: opacity 0.3s ease;
  }

  .widget-depth {
      background:
          linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
      box-shadow:
          0 10px 20px rgba(0,0,0,0.3),
          inset 0 1px 1px rgba(255,255,255,0.05),
          inset 0 -1px 1px rgba(0,0,0,0.5);
      border: 1px solid rgba(251,191,36,0.08);
  }

  .floating-ui-badge {
      background:
          linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      box-shadow:
          0 0 0 1px rgba(251,191,36,0.20),
          0 25px 50px -12px rgba(0,0,0,0.8),
          inset 0 1px 1px rgba(255,255,255,0.15),
          inset 0 -1px 1px rgba(0,0,0,0.5);
  }

  /* Physical Tactile Buttons — gold/dark theme */
  .btn-gold-light, .btn-charcoal-dark {
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .btn-gold-light {
      background: linear-gradient(180deg, #fde68a 0%, #f59e0b 100%);
      color: #1a1305;
      box-shadow:
          0 0 0 1px rgba(180,83,9,0.45),
          0 2px 4px rgba(0,0,0,0.35),
          0 12px 28px -8px rgba(251,191,36,0.55),
          inset 0 1px 1px rgba(255,255,255,0.55),
          inset 0 -3px 6px rgba(180,83,9,0.30);
  }
  .btn-gold-light:hover {
      transform: translateY(-3px);
      box-shadow:
          0 0 0 1px rgba(180,83,9,0.55),
          0 6px 14px -2px rgba(0,0,0,0.35),
          0 22px 38px -10px rgba(251,191,36,0.7),
          inset 0 1px 1px rgba(255,255,255,0.6),
          inset 0 -3px 6px rgba(180,83,9,0.28);
  }
  .btn-gold-light:active {
      transform: translateY(1px);
      background: linear-gradient(180deg, #fcd34d 0%, #d97706 100%);
      box-shadow:
          0 0 0 1px rgba(180,83,9,0.6),
          0 1px 2px rgba(0,0,0,0.3),
          inset 0 3px 8px rgba(180,83,9,0.4),
          inset 0 0 0 1px rgba(255,255,255,0.05);
  }
  .btn-charcoal-dark {
      background: linear-gradient(180deg, #1c2030 0%, #0b0f17 100%);
      color: #fff;
      box-shadow:
          0 0 0 1px rgba(255,255,255,0.1),
          0 2px 4px rgba(0,0,0,0.6),
          0 12px 24px -4px rgba(0,0,0,0.85),
          inset 0 1px 1px rgba(255,255,255,0.1),
          inset 0 -3px 6px rgba(0,0,0,0.9);
  }
  .btn-charcoal-dark:hover {
      transform: translateY(-3px);
      background: linear-gradient(180deg, #262b3d 0%, #141824 100%);
      box-shadow:
          0 0 0 1px rgba(251,191,36,0.22),
          0 6px 12px -2px rgba(0,0,0,0.75),
          0 20px 32px -6px rgba(0,0,0,1),
          inset 0 1px 1px rgba(255,255,255,0.14),
          inset 0 -3px 6px rgba(0,0,0,0.9);
  }
  .btn-charcoal-dark:active {
      transform: translateY(1px);
      background: #0b0f17;
      box-shadow:
          0 0 0 1px rgba(255,255,255,0.05),
          inset 0 3px 8px rgba(0,0,0,0.95),
          inset 0 0 0 1px rgba(0,0,0,0.6);
  }
`;

export interface CinematicHeroProps
  extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  tagline1?: string;
  tagline2?: string;
  taglineAccent?: string;
  description?: string;
  primaryCta?: { label: string; href: string; icon?: ReactNode };
  secondaryCta?: { label: string; href: string; icon?: ReactNode };
  trustItems?: { icon?: ReactNode; label: string }[];
  mockup?: ReactNode;
  badges?: ReactNode[];
}

export function CinematicHero({
  eyebrow = "From invite to I do · v2.0",
  tagline1 = "Des invitations",
  taglineAccent = "interactives",
  tagline2 = "pour vos plus beaux jours.",
  description = "Créez des invitations magnifiques pour mariages et événements. RSVP intelligent, galerie 3D, livre d'or interactif, jeux d'ambiance, check-in QR Code — le tout sans écrire une ligne de code.",
  primaryCta = { label: "Découvrir nos modèles", href: "#services" },
  secondaryCta = { label: "Voir les fonctionnalités", href: "#features" },
  trustItems = [
    { label: "Sans code — 100% visuel" },
    { label: "Invitations illimitées*" },
    { label: "Support personnalisé" },
  ],
  mockup,
  badges,
  className,
  ...props
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupWrapRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          mainCardRef.current.style.setProperty(
            "--mouse-x",
            `${mouseX}px`
          );
          mainCardRef.current.style.setProperty(
            "--mouse-y",
            `${mouseY}px`
          );
        }
        if (mockupWrapRef.current && window.innerWidth >= 1024) {
          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(mockupWrapRef.current, {
            rotationY: xVal * 8,
            rotationX: -yVal * 6,
            ease: "power3.out",
            duration: 1.2,
          });
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".gsap-reveal", { autoAlpha: 0 });
      gsap.set(".cinematic-eyebrow", {
        y: 20,
        scale: 0.92,
        filter: "blur(8px)",
      });
      gsap.set(".cinematic-tagline1", {
        y: 60,
        scale: 0.85,
        filter: "blur(20px)",
        rotationX: -18,
      });
      gsap.set(".cinematic-accent", {
        clipPath: "inset(0 100% 0 0)",
      });
      gsap.set(".cinematic-tagline2", {
        y: 60,
        scale: 0.85,
        filter: "blur(20px)",
        rotationX: -18,
      });
      gsap.set(".cinematic-desc", { y: 30, filter: "blur(10px)" });
      gsap.set(".cinematic-cta", { y: 30, filter: "blur(10px)" });
      gsap.set(".cinematic-trust", { y: 20, opacity: 0 });
      gsap.set(".cinematic-card", {
        y: 180,
        scale: 0.94,
        filter: "blur(18px)",
      });
      gsap.set(".cinematic-mockup", {
        z: -300,
        y: 60,
        rotationX: 20,
        rotationY: -18,
        autoAlpha: 0,
      });
      gsap.set(".cinematic-badge", {
        y: 60,
        autoAlpha: 0,
        scale: 0.7,
        rotationZ: -6,
      });

      const introTl = gsap.timeline({ delay: 0.25 });
      introTl
        .to(".cinematic-eyebrow", {
          duration: 0.9,
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          ease: "expo.out",
        })
        .to(
          ".cinematic-tagline1",
          {
            duration: 1.4,
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            rotationX: 0,
            ease: "expo.out",
          },
          "-=0.55"
        )
        .to(
          ".cinematic-accent",
          {
            duration: 1.1,
            clipPath: "inset(0 0% 0 0)",
            ease: "power4.inOut",
          },
          "-=0.95"
        )
        .to(
          ".cinematic-tagline2",
          {
            duration: 1.2,
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            rotationX: 0,
            ease: "expo.out",
          },
          "-=0.85"
        )
        .to(
          ".cinematic-desc",
          {
            duration: 1,
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            ease: "power3.out",
          },
          "-=0.75"
        )
        .to(
          ".cinematic-cta",
          {
            duration: 1,
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            ease: "power3.out",
            stagger: 0.08,
          },
          "-=0.65"
        )
        .to(
          ".cinematic-trust",
          {
            duration: 0.8,
            autoAlpha: 1,
            y: 0,
            ease: "power2.out",
            stagger: 0.06,
          },
          "-=0.5"
        )
        .to(
          ".cinematic-card",
          {
            duration: 1.6,
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            ease: "expo.out",
          },
          "-=1.2"
        )
        .fromTo(
          ".cinematic-mockup",
          { z: -200, y: 50, rotationX: 14, rotationY: -14, autoAlpha: 0 },
          {
            z: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            autoAlpha: 1,
            duration: 1.8,
            ease: "expo.out",
          },
          "-=0.95"
        )
        .to(
          ".cinematic-badge",
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            rotationZ: 0,
            ease: "back.out(1.6)",
            duration: 1.2,
            stagger: 0.15,
          },
          "-=1.0"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const uniqueTrust = useMemo(() => trustItems, [trustItems]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden flex items-start justify-center bg-[#0b0f17] text-white font-sans antialiased pt-28 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-white/5",
        className
      )}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div
        className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-70"
        aria-hidden="true"
      />

      <div
        aria-hidden="true"
        className="absolute -top-48 -left-40 w-[680px] h-[680px] rounded-full pointer-events-none z-0 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(251,191,36,0.38), rgba(251,191,36,0) 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-48 -right-40 w-[720px] h-[720px] rounded-full pointer-events-none z-0 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(236,72,153,0.22), rgba(236,72,153,0) 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 w-[520px] h-[520px] -translate-x-1/2 rounded-full pointer-events-none z-0 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(245,158,11,0.18), rgba(245,158,11,0) 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className={cn("grid gap-14 lg:gap-10 lg:items-center", mockup ? "lg:grid-cols-2" : "lg:grid-cols-1")}>
          {/* LEFT: Text content */}
          <div className={cn(mockup ? "text-left lg:max-w-2xl" : "text-center mx-auto lg:max-w-3xl")}>
            <div className="cinematic-eyebrow gsap-reveal inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/5 backdrop-blur-sm">
              <span className="font-mono text-[11px] tracking-wide text-amber-300/90 uppercase">
                {eyebrow}
              </span>
            </div>

            <h1
              className="cinematic-tagline1 gsap-reveal text-3d-matte text-4xl sm:text-5xl lg:text-6xl xl:text-[68px] font-extrabold tracking-tight leading-[1.05] mb-0"
              style={{ transformStyle: "preserve-3d" }}
            >
              {tagline1}{" "}
              <span className="cinematic-accent inline-block text-gold-matte align-baseline">
                {taglineAccent}
              </span>
            </h1>
            <h1
              className="cinematic-tagline2 gsap-reveal text-3d-matte text-4xl sm:text-5xl lg:text-6xl xl:text-[68px] font-extrabold tracking-tight leading-[1.05] mb-8"
              style={{ transformStyle: "preserve-3d" }}
            >
              {tagline2}
            </h1>

            <p className={cn("cinematic-desc gsap-reveal text-base sm:text-lg text-white/65 mb-10 leading-relaxed", mockup ? "max-w-xl text-left" : "max-w-2xl mx-auto text-center")}>
              {description}
            </p>

            <div className={cn("flex flex-col sm:flex-row gap-3 mb-4", mockup ? "" : "justify-center")}>
              <a
                href={primaryCta.href}
                aria-label={primaryCta.label}
                className="cinematic-cta gsap-reveal btn-gold-light group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[20px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/70 focus:ring-offset-2 focus:ring-offset-[#0b0f17]"
              >
                {primaryCta.label}
                {primaryCta.icon ?? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <path
                      d="M5 12H19M19 12L13 6M19 12L13 18"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </a>
              <a
                href={secondaryCta.href}
                aria-label={secondaryCta.label}
                className="cinematic-cta gsap-reveal btn-charcoal-dark inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[20px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#0b0f17]"
              >
                {secondaryCta.icon}
                {secondaryCta.label}
              </a>
            </div>
          </div>

          {/* RIGHT: Physical deep premium card + invitation mockup */}
          {mockup && (
            <div
              className="relative cinematic-card gsap-reveal"
              style={{ perspective: "1500px" }}
            >
              <div
                ref={mainCardRef}
                className="premium-depth-card relative overflow-hidden rounded-[28px] md:rounded-[34px] w-full p-3 sm:p-3.5"
              >
                <div className="card-sheen" aria-hidden="true" />

                <div
                  ref={mockupWrapRef}
                  className="cinematic-mockup relative w-full"
                  style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                >
                  {mockup}
                </div>
              </div>

              {badges && badges.length > 0 && (
                <div className="cinematic-badges pointer-events-none">
                  {badges.map((b, i) => (
                    <React.Fragment key={i}>{b}</React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CinematicHero;
