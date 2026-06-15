import React from 'react';
import { X, Crown, Sparkles, Check, Zap } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  remainingInvites: number;
}

const UpgradeModal = ({ isOpen, onClose, currentPlan, remainingInvites }: UpgradeModalProps) => {
  if (!isOpen) return null;

  const plans = [
    {
      name: 'Standard',
      price: '100$',
      period: '/mois',
      icon: Crown,
      features: [
        '200 invitations maximum',
        '1 mois de validité',
        'Tous les modèles premium',
        'Personnalisation avancée',
        'Statistiques détaillées',
        'Support prioritaire'
      ],
      popular: true,
      buttonText: 'Choisir Standard',
      buttonClass: 'bg-amber-500 text-slate-900 hover:bg-amber-600'
    },
    {
      name: 'Premium',
      price: '200$',
      period: '/mois',
      icon: Sparkles,
      features: [
        'Invitations illimitées',
        '1 mois de validité',
        'Tous les modèles premium',
        'Personnalisation avancée',
        'Statistiques détaillées',
        'Support prioritaire',
        'Design sur mesure'
      ],
      popular: false,
      buttonText: 'Choisir Premium',
      buttonClass: 'bg-slate-900 text-neutral-50 hover:bg-slate-800'
    }
  ];

  const handleUpgrade = (planName: string) => {
    // Rediriger vers la page de paiement Stripe
    alert(`Redirection vers le paiement pour le plan ${planName}...`);
    // Ici vous intégreriez Stripe
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-luxury max-w-xl w-full max-h-[90vh] overflow-y-auto animate-slide-up relative">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200/20 to-purple-200/20 rounded-full blur-xl"></div>
        
        {/* Header */}
        <div className="relative p-4 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-amber-50/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="relative mr-3">
                <Zap className="h-6 w-6 text-amber-500 animate-glow drop-shadow-lg" />
                <div className="absolute inset-0 animate-pulse">
                  <Zap className="h-6 w-6 text-amber-300 opacity-30" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Limite d'invitations atteinte
                </h2>
                <p className="text-slate-600 text-sm">
                  Vous avez utilisé {5 - remainingInvites}/5 invitations gratuites
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-4">
          <div className="text-center mb-4">
            <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-xl p-4 border border-amber-200/50 mb-4">
              <div className="flex items-center justify-center mb-4">
                <Crown className="h-8 w-8 text-amber-500 animate-glow" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Passez au niveau supérieur !
              </h3>
              <p className="text-slate-600 text-sm">
                Vous avez atteint la limite de 5 invitations gratuites
              </p>
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 gap-3">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative bg-gradient-to-br from-neutral-50 to-amber-50/30 rounded-xl shadow-lg hover:shadow-glow-amber transition-all duration-300 p-4 backdrop-blur-sm border ${
                    plan.popular 
                      ? 'border-2 border-amber-400 shadow-glow-amber' 
                      : 'border border-neutral-200/50 hover:border-amber-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-3 py-1 rounded-full text-xs font-semibold shadow-glow-amber">
                        Recommandé
                      </span>
                    </div>
                  )}

                  <div className="flex items-center mb-3">
                    <div className="flex justify-center">
                      <div className={`p-3 rounded-full ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-amber-100 to-amber-200 shadow-glow-amber' 
                          : 'bg-gradient-to-r from-neutral-100 to-slate-100'
                      }`}>
                        <IconComponent className={`h-6 w-6 ${
                          plan.popular 
                            ? 'text-amber-600 drop-shadow-lg' 
                            : 'text-slate-600'
                        }`} />
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-1">
                        {plan.name}
                      </h3>
                      
                      <div className="flex items-baseline">
                        <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-amber-700 to-slate-900 bg-clip-text text-transparent">
                          {plan.price}
                        </span>
                        <span className="text-slate-500 ml-1">{plan.period}</span>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-1 mb-3">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <div className="relative mr-3 flex-shrink-0">
                          <Check className="h-3 w-3 text-amber-500" />
                        </div>
                        <span className="text-slate-700 text-xs">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-slate-500 ml-6">
                        +{plan.features.length - 4} autres fonctionnalités
                      </li>
                    )}
                  </ul>

                  <button 
                    onClick={() => handleUpgrade(plan.name)}
                    className={`w-full py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-luxury relative overflow-hidden text-sm ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-600 hover:to-amber-700 shadow-glow-amber' 
                        : 'bg-gradient-to-r from-slate-900 to-slate-800 text-neutral-50 hover:from-slate-800 hover:to-slate-700'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-slate-500 text-xs">
              Vous pouvez annuler votre abonnement à tout moment. 
              Aucun engagement, facturation mensuelle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;