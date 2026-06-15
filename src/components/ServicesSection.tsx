import React from 'react';
import { Heart, Gift, GraduationCap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ServicesSectionProps {
  onViewWeddingTemplate?: () => void;
  onViewBirthdayTemplate?: () => void;
  onViewGraduationTemplate?: () => void;
}

const ServicesSection = ({ onViewWeddingTemplate, onViewBirthdayTemplate, onViewGraduationTemplate }: ServicesSectionProps) => {
  const { t } = useLanguage();

  const services = [
    {
      id: 1,
      title: t('wedding_invitations') || 'Invitations de Mariage',
      description: t('wedding_description') || 'Créez des invitations romantiques et élégantes pour votre jour spécial',
      image: 'https://static.vecteezy.com/system/resources/thumbnails/056/699/345/small_2x/a-young-couple-of-african-american-bride-and-groom-at-their-wedding-ceremony-photo.jpg',
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      bgColor: 'from-rose-50 to-pink-50',
      features: [
        'Photos & Galerie',
        'Texte de mariage',
        'Confirmation RSVP',
        'Choix de boissons',
        'QR Code',
        'Livre d\'or'
      ]
    },
    {
      id: 2,
      title: t('birthday_invitations') || 'Invitations d\'Anniversaire',
      description: t('birthday_description') || 'Célébrez chaque année avec style et originalité',
      image: 'https://www.shutterstock.com/image-photo/man-blowing-candles-birthday-cake-600nw-2510173133.jpg',
      icon: Gift,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'from-purple-50 to-indigo-50',
      features: [
        'Photos personnalisées',
        'Texte d\'invitation',
        'Confirmation',
        'QR Code',
        'Galerie de souvenirs',
        'Vœux des invités'
      ]
    },
    {
      id: 3,
      title: t('graduation_invitations') || 'Invitations de Collation',
      description: t('graduation_description') || 'Marquez votre réussite académique avec fierté',
      image: 'https://twk-media-offload.s3.eu-west-1.amazonaws.com/bruford.ac.uk/wp-uploads/2025/03/240912_rb_grads_2138.jpg',
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
      features: [
        'Photos de diplôme',
        'Texte de félicitations',
        'Confirmation',
        'QR Code',
        'Galerie',
        'Messages de félicitations'
      ]
    }
  ];

  return (
    <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-neutral-50 via-amber-50/20 to-neutral-100 dark:from-slate-800 dark:via-slate-700/20 dark:to-slate-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-40 h-40 bg-gradient-to-r from-amber-200/15 to-purple-200/15 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-gradient-to-r from-rose-200/15 to-amber-200/15 rounded-full blur-2xl animate-bounce-slow"></div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-slate-100 dark:via-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
              {t('our_services') || 'Nos Services'}
            </span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            {t('services_description') || 'Découvrez notre gamme complète d\'invitations pour tous vos événements importants'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div
                key={service.id}
                className="group cursor-pointer animate-slide-up transform hover:scale-105 transition-all duration-500"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={`bg-gradient-to-br ${service.bgColor} dark:from-slate-700 dark:to-slate-600 rounded-3xl shadow-luxury hover:shadow-glow-amber transition-all duration-500 overflow-hidden backdrop-blur-sm border border-neutral-200/50 dark:border-slate-600/50 hover:border-amber-300/50 relative`}>
                  {/* Heart icon overlay for wedding */}
                  {service.id === 1 && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-rose-500 rounded-full p-2 shadow-lg">
                        <Heart className="h-5 w-5 text-white fill-current" />
                      </div>
                    </div>
                  )}
                  
                  {/* Gift icon overlay for anniversary */}
                  {service.id === 2 && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-purple-500 rounded-full p-2 shadow-lg">
                        <Gift className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Graduation cap icon overlay for graduation */}
                  {service.id === 3 && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-emerald-500 rounded-full p-2 shadow-lg">
                        <GraduationCap className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}

                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-3">
                      {service.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm leading-relaxed">
                      {service.description}
                    </p>
                    
                    {/* Features list */}
                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-3 flex-shrink-0"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <button className={`w-full bg-gradient-to-r ${service.color} text-white px-6 py-3 rounded-full hover:shadow-luxury transition-all duration-500 font-semibold flex items-center justify-center group shadow-lg transform hover:scale-105 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <span 
                        onClick={
                          service.id === 1 ? onViewWeddingTemplate :
                          service.id === 2 ? onViewBirthdayTemplate :
                          service.id === 3 ? onViewGraduationTemplate :
                          undefined
                        }
                        className="cursor-pointer"
                      >
                        {t('view_templates') || 'Voir les modèles'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;