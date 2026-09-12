import React, { useEffect, useState, useRef } from 'react';
import { Star, Quote, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import {
  testimonialService,
  EVENT_CATEGORIES,
  type Testimonial,
} from '../services/testimonialService';

const SAMPLE_FALLBACK: Testimonial[] = [
  {
    id: 'fallback-1',
    userId: null,
    firstName: 'Naomi',
    lastName: 'K.',
    rating: 5,
    comment:
      "En 60 secondes j'avais une invitation de mariage plus belle que celles d'un graphiste. On a économisé temps et argent.",
    eventType: 'mariage',
    approved: true,
    createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 24 * 20) },
  },
  {
    id: 'fallback-2',
    userId: null,
    firstName: 'David',
    lastName: 'M.',
    rating: 5,
    comment:
      "Le suivi des RSVP en temps réel m'a évité des centaines d'allers-retours WhatsApp. Un vrai gain de temps pour notre mariage.",
    eventType: 'mariage',
    approved: true,
    createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 24 * 12) },
  },
  {
    id: 'fallback-3',
    userId: null,
    firstName: 'Chancelle',
    lastName: 'N.',
    rating: 5,
    comment:
      "Le partage WhatsApp direct a changé la donne. Toute la famille a reçu l'invitation de mariage en 1 clic, aucun perdu.",
    eventType: 'mariage',
    approved: true,
    createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
  },
  {
    id: 'fallback-4',
    userId: null,
    firstName: 'Jonathan',
    lastName: 'K.',
    rating: 5,
    comment:
      "Le check-in par QR Code le jour J a été impeccable. On a pu suivre les arrivées des invités en temps réel.",
    eventType: 'mariage',
    approved: true,
    createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 24 * 35) },
  },
  {
    id: 'fallback-5',
    userId: null,
    firstName: 'Esther',
    lastName: 'M.',
    rating: 5,
    comment:
      "La galerie photo 3D immersive est incroyable. Les invités en parlent encore 1 mois après le mariage !",
    eventType: 'mariage',
    approved: true,
    createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 24 * 8) },
  },
  {
    id: 'fallback-6',
    userId: null,
    firstName: 'Emmanuel',
    lastName: 'T.',
    rating: 5,
    comment:
      "On a pu gérer les tables et les menus boissons directement dans le dashboard. Plus de casse-tête Excel pour le mariage !",
    eventType: 'mariage',
    approved: true,
    createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 24 * 28) },
  },
  {
    id: 'fallback-7',
    userId: null,
    firstName: 'Gloria',
    lastName: 'B.',
    rating: 5,
    comment:
      "Le Love Quiz et le Memory Match pendant la cérémonie ont rendu notre mariage unique et inoubliable.",
    eventType: 'mariage',
    approved: true,
    createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 24 * 18) },
  },
  {
    id: 'fallback-8',
    userId: null,
    firstName: 'Patrice',
    lastName: 'L.',
    rating: 5,
    comment:
      "Le compte à rebours et les animations premium ont créé une vraie attente. Tout le monde avait hâte d'être au grand jour.",
    eventType: 'mariage',
    approved: true,
    createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 24 * 50) },
  },
];

const getEventLabel = (value: string) =>
  EVENT_CATEGORIES.find((c) => c.value === value)?.label || value;

const getInitials = (first: string, last: string) =>
  (first?.[0] || '').toUpperCase() + (last?.[0] || '').toUpperCase();

const AVATAR_COLORS = [
  ['#f59e0b', '#d97706'],
  ['#ec4899', '#be185d'],
  ['#8b5cf6', '#6d28d9'],
  ['#10b981', '#047857'],
  ['#3b82f6', '#1d4ed8'],
  ['#f97316', '#c2410c'],
  ['#ef4444', '#b91c1c'],
  ['#14b8a6', '#0f766e'],
];

const colorForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const CITIES = [
  'Kinshasa',
  'Lubumbashi',
  'Matadi',
  'Mbuji-Mayi',
  'Kisangani',
  'Kolwezi',
  'Goma',
  'Bukavu',
  'Paris',
  'Bruxelles',
  'Londres',
  'Washington',
  'New York',
];
const cityForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return CITIES[Math.abs(hash) % CITIES.length];
};

interface TestimonialsSectionProps {}

const TestimonialsSection = ({}: TestimonialsSectionProps) => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();

  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await testimonialService.getApprovedTestimonials(20);
        if (!active) return;
        setItems(data.length > 0 ? data : SAMPLE_FALLBACK);
      } catch {
        if (active) setItems(SAMPLE_FALLBACK);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    const onScroll = () => updateArrows();
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [items.length, loading]);

  const scroll = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.8) * dir;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const pausedRef = useRef(false);
  const userScrollRef = useRef(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length < 3 || loading) return;

    const advance = () => {
      const node = scrollRef.current;
      if (!node || pausedRef.current || userScrollRef.current) return;
      const cardWidth = node.scrollWidth / Math.max(1, items.length);
      const atEnd =
        node.scrollLeft + node.clientWidth >= node.scrollWidth - Math.max(16, cardWidth * 0.4);
      if (atEnd) {
        node.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        node.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    };

    const id = window.setInterval(advance, 2800);
    const pause = () => (pausedRef.current = true);
    const resume = () => (pausedRef.current = false);

    const onUserScroll = () => {
      userScrollRef.current = true;
      clearTimeout((onUserScroll as any)._t);
      (onUserScroll as any)._t = window.setTimeout(() => {
        userScrollRef.current = false;
      }, 1200);
    };

    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('touchend', resume);
    el.addEventListener('pointerdown', pause);
    el.addEventListener('pointerup', resume);
    el.addEventListener('wheel', onUserScroll, { passive: true });
    el.addEventListener('scroll', onUserScroll, { passive: true });

    return () => {
      clearInterval(id);
      clearTimeout((onUserScroll as any)._t);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend', resume);
      el.removeEventListener('pointerdown', pause);
      el.removeEventListener('pointerup', resume);
      el.removeEventListener('wheel', onUserScroll);
      el.removeEventListener('scroll', onUserScroll);
    };
  }, [items.length, loading]);

  const totalEvents = 512;
  const avgRating =
    items.length > 0
      ? (
          items.reduce((s, it) => s + (it.rating || 0), 0) / Math.min(items.length, 8)
        ).toFixed(1)
      : '4.8';
  const starAvg = Math.round(parseFloat(avgRating));

  return (
    <section
      id="testimonials"
      className={cn(
        'relative py-10 sm:py-14 md:py-20 border-t overflow-hidden transition-colors duration-500',
        isDarkMode ? 'bg-[#0b0f17] border-white/5' : 'bg-white border-amber-900/10'
      )}
    >
      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12 animate-fade-in">
          <div
            className="text-[10px] sm:text-[11px] md:text-xs font-extrabold tracking-[0.18em] sm:tracking-[0.22em] uppercase mb-2 sm:mb-3 md:mb-4"
            style={{ color: '#ef4444' }}
          >
            Ils nous font confiance
          </div>
          <h2
            className={cn(
              'text-[22px] sm:text-2xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4 md:mb-6 leading-[1.1] sm:leading-[1.08] transition-colors duration-500',
              isDarkMode ? 'text-white' : '#0f0f0f'
            )}
          >
            Ce que disent les<br className="hidden sm:block" /> organisateurs
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:gap-3">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn(
                    'w-[14px] h-[14px] sm:w-4 sm:h-4 md:w-5 md:h-5',
                    n <= starAvg
                      ? 'fill-amber-400 text-amber-400'
                      : isDarkMode
                      ? 'text-white/15'
                      : 'text-amber-900/10'
                  )}
                />
              ))}
            </div>
            <span
              className={cn(
                'text-[13px] sm:text-sm md:text-base font-extrabold tabular-nums transition-colors duration-500',
                isDarkMode ? 'text-white' : '#0f0f0f'
              )}
            >
              {avgRating}/5
            </span>
            <span
              className={cn(
                'text-[12px] sm:text-sm md:text-base transition-colors duration-500',
                isDarkMode ? 'text-white/50' : 'text-neutral-500'
              )}
            >
              — +{totalEvents} événements
            </span>
          </div>
        </div>

        {/* Loader */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className={cn(
                'w-8 h-8 animate-spin',
                isDarkMode ? 'text-amber-400' : 'text-amber-600'
              )}
            />
          </div>
        )}

        {/* Carousel row */}
        {!loading && items.length > 0 && (
          <div className="relative">
            {/* Arrows - masquées en mobile, scroll au doigt */}
            <button
              onClick={() => scroll(-1)}
              aria-label="Avis précédents"
              className={cn(
                'hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full items-center justify-center transition-all',
                canLeft
                  ? isDarkMode
                    ? 'bg-[#141a2c]/90 text-white/90 border border-white/10 hover:bg-[#141a2c] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]'
                    : 'bg-white/95 text-neutral-700 border border-neutral-200 hover:bg-white shadow-[0_10px_30px_-10px_rgba(180,83,9,0.25)]'
                  : 'opacity-0 pointer-events-none'
              )}
              style={{ transform: 'translate(-40%, -50%)' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Avis suivants"
              className={cn(
                'hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full items-center justify-center transition-all',
                canRight
                  ? isDarkMode
                    ? 'bg-[#141a2c]/90 text-white/90 border border-white/10 hover:bg-[#141a2c] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]'
                    : 'bg-white/95 text-neutral-700 border border-neutral-200 hover:bg-white shadow-[0_10px_30px_-10px_rgba(180,83,9,0.25)]'
                  : 'opacity-0 pointer-events-none'
              )}
              style={{ transform: 'translate(40%, -50%)' }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Scroll container */}
            <div
              ref={scrollRef}
              className={cn(
                'overflow-x-auto scroll-smooth pb-3 sm:pb-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8',
                'snap-x snap-mandatory',
                '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              )}
            >
              <div className="flex gap-2.5 sm:gap-3 md:gap-5 items-stretch w-max min-w-full pr-4 sm:pr-8">
                {items.map((item, i) => {
                  const [c1, c2] = colorForName(item.firstName + item.lastName);
                  const location = cityForName(item.firstName + item.lastName);
                  return (
                    <article
                      key={item.id}
                      className={cn(
                        'relative snap-start shrink-0 w-[calc(100vw-2.5rem)] sm:w-[340px] md:w-[400px] lg:w-[440px] rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-7 flex flex-col transition-all',
                        isDarkMode
                          ? 'bg-gradient-to-b from-[#141a2c] to-[#0d1220] border border-white/10'
                          : 'bg-white border border-neutral-200/80'
                      )}
                      style={{
                        boxShadow: isDarkMode
                          ? '0 20px 50px -24px rgba(0,0,0,0.7), 0 6px 18px rgba(0,0,0,0.25)'
                          : '0 20px 50px -28px rgba(180,83,9,0.18), 0 6px 18px rgba(180,83,9,0.06)',
                      }}
                    >
                      {/* Stars top-left */}
                      <div className="flex items-center gap-0.5 mb-2.5 sm:mb-3 md:mb-4">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={cn(
                              'w-[15px] h-[15px] sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]',
                              n <= item.rating
                                ? 'fill-amber-400 text-amber-400'
                                : isDarkMode
                                ? 'text-white/15'
                                : 'text-amber-900/10'
                            )}
                          />
                        ))}
                      </div>

                      {/* Quote + avatar hook */}
                      <div className="relative mb-3.5 sm:mb-4 md:mb-5 flex-shrink-0">
                        <div
                          aria-hidden="true"
                          className={cn(
                            'absolute -top-1.5 sm:-top-2 -left-1 w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center pointer-events-none',
                            isDarkMode ? 'bg-white/5' : 'bg-neutral-50'
                          )}
                        >
                          <Quote
                            className={cn(
                              'w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5',
                              isDarkMode ? 'text-white/18' : 'text-neutral-300'
                            )}
                          />
                        </div>
                        <p
                          className={cn(
                            'text-[13.5px] sm:text-sm md:text-base lg:text-[17px] leading-relaxed transition-colors duration-500 ml-5 sm:ml-6',
                            isDarkMode ? 'text-white/85' : 'text-neutral-800'
                          )}
                        >
                          "{item.comment}"
                        </p>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Author row bottom */}
                      <div className="flex items-center gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 mt-auto">
                        <div
                          className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-extrabold text-white text-[13px] sm:text-sm ring-2"
                          style={{
                            background: item.avatarUrl
                              ? undefined
                              : `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
                            boxShadow: item.avatarUrl
                              ? undefined
                              : `0 6px 18px -6px ${c1}`,
                            // @ts-ignore
                            '--tw-ring-color': isDarkMode
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.04)',
                          }}
                        >
                          {item.avatarUrl ? (
                            <img
                              src={item.avatarUrl}
                              alt={item.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitials(item.firstName, item.lastName)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              'font-bold text-[13.5px] sm:text-sm truncate transition-colors duration-500',
                              isDarkMode ? 'text-white' : 'text-neutral-900'
                            )}
                          >
                            {item.firstName} {item.lastName}
                          </div>
                          <div
                            className={cn(
                              'text-[11px] sm:text-xs md:text-sm truncate flex items-center gap-1 transition-colors duration-500',
                              isDarkMode ? 'text-white/45' : 'text-neutral-500'
                            )}
                          >
                            <span>{getEventLabel(item.eventType)}</span>
                            <span>—</span>
                            <span>{location}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
