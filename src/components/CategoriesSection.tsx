import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Heart, Gift, GraduationCap, ArrowRight } from 'lucide-react';

const CategoriesSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const categories = [
    {
      id: 1,
      title: 'Mariage',
      image: 'https://static.vecteezy.com/system/resources/thumbnails/056/699/345/small_2x/a-young-couple-of-african-american-bride-and-groom-at-their-wedding-ceremony-photo.jpg?auto=compress&cs=tinysrgb&w=400',
      icon: Heart,
      description: 'Célébrez votre union avec élégance',
      color: 'from-rose-100 to-pink-100'
    },
    {
      id: 2,
      title: 'Anniversaire',
      image: 'https://static.vecteezy.com/system/resources/thumbnails/056/699/345/small_2x/a-young-couple-of-african-american-bride-and-groom-at-their-wedding-ceremony-photo.jpg?auto=compress&cs=tinysrgb&w=400',
      icon: Gift,
      description: 'Marquez cette journée spéciale',
      color: 'from-purple-100 to-indigo-100'
    },
    {
      id: 3,
      title: 'Collation de Grade',
      image: 'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=400',
      icon: GraduationCap,
      description: 'Célébrez vos accomplissements',
      color: 'from-blue-100 to-cyan-100'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % categories.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + categories.length) % categories.length);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-neutral-50 via-rose-50/30 to-amber-50/40 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-36 h-36 bg-gradient-to-r from-rose-200/20 to-amber-200/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-10 right-20 w-28 h-28 bg-gradient-to-r from-purple-200/20 to-emerald-200/20 rounded-full blur-2xl animate-bounce-slow"></div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-slate-900 via-rose-700 to-slate-900 bg-clip-text text-transparent">
            Catégories d'événements
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto backdrop-blur-sm bg-neutral-50/50 rounded-xl p-4 border border-rose-200/30">
            Découvrez nos modèles d'invitations adaptés à chaque type d'événement
          </p>
        </div>

        {/* Desktop Carousel */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.id}
                className="group cursor-pointer animate-slide-up transform hover:scale-105 transition-all duration-500"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="bg-gradient-to-br from-neutral-50 via-amber-50/30 to-rose-50/20 rounded-3xl shadow-luxury hover:shadow-glow-rose transition-all duration-500 overflow-hidden backdrop-blur-sm border border-neutral-200/50 hover:border-rose-300/50">
                  <div className="relative h-48 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-80`}></div>
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <IconComponent className="h-20 w-20 text-neutral-50 drop-shadow-2xl animate-glow" />
                        <div className="absolute inset-0 animate-pulse">
                          <IconComponent className="h-20 w-20 text-white/30" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">{category.title}</h3>
                    <p className="text-slate-600 mb-6 leading-relaxed">{category.description}</p>
                    
                    <button className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-slate-900 px-6 py-3 rounded-full hover:from-amber-500 hover:to-rose-500 transition-all duration-500 font-semibold flex items-center justify-center group shadow-glow-rose hover:shadow-luxury transform hover:scale-105 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <Eye className="mr-2 h-5 w-5" />
                      Prévisualiser
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative">
          <div className="overflow-hidden rounded-3xl shadow-xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <div key={category.id} className="w-full flex-shrink-0">
                    <div className="bg-neutral-50">
                      <div className="relative h-48 overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90`}></div>
                        <img
                          src={category.image}
                          alt={category.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <IconComponent className="h-16 w-16 text-neutral-50 drop-shadow-lg" />
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{category.title}</h3>
                        <p className="text-slate-600 mb-6">{category.description}</p>
                        
                        <button className="w-full bg-amber-500 text-slate-900 px-6 py-3 rounded-full hover:bg-amber-600 transition-all duration-300 font-semibold flex items-center justify-center">
                          <Eye className="mr-2 h-5 w-5" />
                          Prévisualiser
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-neutral-50/90 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ChevronLeft className="h-6 w-6 text-slate-900" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-neutral-50/90 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ChevronRight className="h-6 w-6 text-slate-900" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {categories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-amber-500' : 'bg-neutral-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;