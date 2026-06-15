import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Dictionnaire des traductions
const translations = {
  fr: {
    // Navigation principale
    'home': 'Accueil',
    'pricing': 'Prix',
    'login': 'Connexion',
    
    // Navigation
    'dashboard': 'Tableau de bord',
    'templates': 'Modèles',
    'guests': 'Invités',
    'tables': 'Tables',
    'analytics': 'Statistiques',
    'profile': 'Profil',
    'settings': 'Paramètres',
    'logout': 'Déconnexion',
    
    // Actions
    'create': 'Créer',
    'edit': 'Modifier',
    'delete': 'Supprimer',
    'save': 'Sauvegarder',
    'cancel': 'Annuler',
    'confirm': 'Confirmer',
    'back': 'Retour',
    'next': 'Suivant',
    'previous': 'Précédent',
    'close': 'Fermer',
    'view': 'Voir',
    'download': 'Télécharger',
    'upload': 'Télécharger',
    'send': 'Envoyer',
    'add': 'Ajouter',
    'remove': 'Supprimer',
    
    // Statuts
    'confirmed': 'Confirmé',
    'pending': 'En attente',
    'declined': 'Décliné',
    'active': 'Actif',
    'inactive': 'Inactif',
    'completed': 'Terminé',
    'draft': 'Brouillon',
    
    // Messages
    'welcome': 'Bienvenue',
    'loading': 'Chargement...',
    'error': 'Erreur',
    'success': 'Succès',
    'warning': 'Attention',
    'info': 'Information',
    'no_data': 'Aucune donnée disponible',
    'search': 'Rechercher',
    'filter': 'Filtrer',
    'sort': 'Trier',
    
    // Dashboard
    'total_invitations': 'Total invitations',
    'confirmed_guests': 'Invités confirmés',
    'pending_responses': 'Réponses en attente',
    'total_tables': 'Total tables',
    'recent_activity': 'Activité récente',
    'quick_actions': 'Actions rapides',
    'create_invitation': 'Créer une invitation',
    'manage_guests': 'Gérer les invités',
    'view_analytics': 'Voir les statistiques',
    
    // Invités
    'guest_name': 'Nom de l\'invité',
    'table_number': 'Numéro de table',
    'guest_type': 'Type d\'invité',
    'single': 'Simple',
    'couple': 'Couple',
    'confirmation_status': 'Statut de confirmation',
    'drink_choice': 'Choix de boisson',
    'message': 'Message',
    
    // Tables
    'table_name': 'Nom de la table',
    'seats': 'Places',
    'assigned_guests': 'Invités assignés',
    'available_seats': 'Places disponibles',
    'table_status': 'Statut de la table',
    'full': 'Complète',
    'partial': 'Partielle',
    'empty': 'Vide',
    
    // Paramètres
    'language': 'Langue',
    'theme': 'Thème',
    'light_mode': 'Mode clair',
    'dark_mode': 'Mode sombre',
    'notifications': 'Notifications',
    'privacy': 'Confidentialité',
    'account': 'Compte',
    
    // Profil
    'personal_info': 'Informations personnelles',
    'first_name': 'Prénom',
    'last_name': 'Nom',
    'email': 'Email',
    'phone': 'Téléphone',
    'address': 'Adresse',
    'member_since': 'Membre depuis',
    'subscription': 'Abonnement',
    
    // Erreurs
    'required_field': 'Ce champ est requis',
    'invalid_email': 'Email invalide',
    'password_too_short': 'Mot de passe trop court',
    'passwords_dont_match': 'Les mots de passe ne correspondent pas',
    'network_error': 'Erreur de connexion',
    'server_error': 'Erreur serveur',
    'not_found': 'Non trouvé',
    'unauthorized': 'Non autorisé',
    'forbidden': 'Accès interdit',
    
    // Nouvelles traductions pour les composants
    'hero_description': 'Créez des invitations magnifiques et interactives pour tous vos événements spéciaux',
    'discover_templates': 'Découvrir nos modèles',
    'view_pricing': 'Voir les tarifs',
    'our_services': 'Nos Services',
    'services_description': 'Découvrez notre gamme complète d\'invitations pour tous vos événements importants',
    'wedding_invitations': 'Invitations de Mariage',
    'wedding_description': 'Créez des invitations romantiques et élégantes pour votre jour spécial',
    'birthday_invitations': 'Invitations d\'Anniversaire',
    'birthday_description': 'Célébrez chaque année avec style et originalité',
    'graduation_invitations': 'Invitations de Collation',
    'graduation_description': 'Marquez votre réussite académique avec fierté',
    'view_templates': 'Voir les modèles',
    'why_choose_us': 'Pourquoi Choisir Furaha-Event ?',
    'why_choose_desc': 'Des fonctionnalités exceptionnelles pour des événements mémorables',
    'premium_templates': 'Templates Premium',
    'premium_templates_desc': 'Des modèles exceptionnels avec toutes les fonctionnalités avancées',
    'custom_design': 'Design Personnalisé',
    'custom_design_desc': 'Personnalisez complètement vos invitations selon vos goûts',
    'complete_management': 'Gestion Complète',
    'complete_management_desc': 'Dashboard admin pour gérer tous vos événements en un seul endroit',
    'choose_your_plan': 'Choisissez votre plan',
    'pricing_description': 'Des solutions adaptées à tous vos besoins d\'événements, du plus simple au plus sophistiqué',
    'free_plan': 'Gratuit',
    'per_month': '/mois',
    'max_5_invitations': '5 invitations maximum',
    'basic_templates': 'Modèles de base',
    'email_support': 'Support par email',
    'pdf_export': 'Export PDF',
    'get_started': 'Commencer',
    'max_200_invitations': '200 invitations maximum',
    '1_month_validity': '1 mois de validité',
    'all_premium_templates': 'Tous les modèles premium',
    'advanced_customization': 'Personnalisation avancée',
    'detailed_statistics': 'Statistiques détaillées',
    'priority_support': 'Support prioritaire',
    'choose_standard': 'Choisir Standard',
    'unlimited_invitations': 'Invitations illimitées',
    'choose_premium': 'Choisir Premium',
    'most_popular': 'Plus populaire',
    'limited': 'Limité',
    'footer_description': 'Créez des invitations digitales exceptionnelles qui marquent les esprits. Votre événement mérite une invitation à la hauteur de son importance.',
    'quick_links': 'Liens rapides',
    'about': 'À propos',
    'contact': 'Contact',
    'privacy_policy': 'Politique de confidentialité',
    'terms_of_service': 'Conditions d\'utilisation',
    'support': 'Support',
    'help_center': 'Centre d\'aide',
    'guides': 'Guides',
    'tutorials': 'Tutoriels',
    'copyright': '© 2025 Furaha-Event. Tous droits réservés.',
    'legal_notice': 'Mentions légales',
    'cookies': 'Cookies',
    'accessibility': 'Accessibilité'
  },
  
  en: {
    // Navigation principale
    'home': 'Home',
    'pricing': 'Pricing',
    'login': 'Login',
    
    // Navigation
    'dashboard': 'Dashboard',
    'templates': 'Templates',
    'guests': 'Guests',
    'tables': 'Tables',
    'analytics': 'Analytics',
    'profile': 'Profile',
    'settings': 'Settings',
    'logout': 'Logout',
    
    // Actions
    'create': 'Create',
    'edit': 'Edit',
    'delete': 'Delete',
    'save': 'Save',
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    'back': 'Back',
    'next': 'Next',
    'previous': 'Previous',
    'close': 'Close',
    'view': 'View',
    'download': 'Download',
    'upload': 'Upload',
    'send': 'Send',
    'add': 'Add',
    'remove': 'Remove',
    
    // Statuts
    'confirmed': 'Confirmed',
    'pending': 'Pending',
    'declined': 'Declined',
    'active': 'Active',
    'inactive': 'Inactive',
    'completed': 'Completed',
    'draft': 'Draft',
    
    // Messages
    'welcome': 'Welcome',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'warning': 'Warning',
    'info': 'Information',
    'no_data': 'No data available',
    'search': 'Search',
    'filter': 'Filter',
    'sort': 'Sort',
    
    // Dashboard
    'total_invitations': 'Total invitations',
    'confirmed_guests': 'Confirmed guests',
    'pending_responses': 'Pending responses',
    'total_tables': 'Total tables',
    'recent_activity': 'Recent activity',
    'quick_actions': 'Quick actions',
    'create_invitation': 'Create invitation',
    'manage_guests': 'Manage guests',
    'view_analytics': 'View analytics',
    
    // Invités
    'guest_name': 'Guest name',
    'table_number': 'Table number',
    'guest_type': 'Guest type',
    'single': 'Single',
    'couple': 'Couple',
    'confirmation_status': 'Confirmation status',
    'drink_choice': 'Drink choice',
    'message': 'Message',
    
    // Tables
    'table_name': 'Table name',
    'seats': 'Seats',
    'assigned_guests': 'Assigned guests',
    'available_seats': 'Available seats',
    'table_status': 'Table status',
    'full': 'Full',
    'partial': 'Partial',
    'empty': 'Empty',
    
    // Paramètres
    'language': 'Language',
    'theme': 'Theme',
    'light_mode': 'Light mode',
    'dark_mode': 'Dark mode',
    'notifications': 'Notifications',
    'privacy': 'Privacy',
    'account': 'Account',
    
    // Profil
    'personal_info': 'Personal information',
    'first_name': 'First name',
    'last_name': 'Last name',
    'email': 'Email',
    'phone': 'Phone',
    'address': 'Address',
    'member_since': 'Member since',
    'subscription': 'Subscription',
    
    // Erreurs
    'required_field': 'This field is required',
    'invalid_email': 'Invalid email',
    'password_too_short': 'Password too short',
    'passwords_dont_match': 'Passwords don\'t match',
    'network_error': 'Network error',
    'server_error': 'Server error',
    'not_found': 'Not found',
    'unauthorized': 'Unauthorized',
    'forbidden': 'Access forbidden',
    
    // New translations for components
    'hero_description': 'Create beautiful and interactive invitations for all your special events',
    'discover_templates': 'Discover our templates',
    'view_pricing': 'View pricing',
    'our_services': 'Our Services',
    'services_description': 'Discover our complete range of invitations for all your important events',
    'wedding_invitations': 'Wedding Invitations',
    'wedding_description': 'Create romantic and elegant invitations for your special day',
    'birthday_invitations': 'Birthday Invitations',
    'birthday_description': 'Celebrate each year with style and originality',
    'graduation_invitations': 'Graduation Invitations',
    'graduation_description': 'Mark your academic success with pride',
    'view_templates': 'View templates',
    'why_choose_us': 'Why Choose Furaha-Event?',
    'why_choose_desc': 'Exceptional features for memorable events',
    'premium_templates': 'Premium Templates',
    'premium_templates_desc': 'Exceptional templates with all advanced features',
    'custom_design': 'Custom Design',
    'custom_design_desc': 'Completely customize your invitations to your taste',
    'complete_management': 'Complete Management',
    'complete_management_desc': 'Admin dashboard to manage all your events in one place',
    'choose_your_plan': 'Choose Your Plan',
    'pricing_description': 'Solutions adapted to all your event needs, from simple to sophisticated',
    'free_plan': 'Free',
    'per_month': '/month',
    'max_5_invitations': '5 invitations maximum',
    'basic_templates': 'Basic templates',
    'email_support': 'Email support',
    'pdf_export': 'PDF export',
    'get_started': 'Get started',
    'max_200_invitations': '200 invitations maximum',
    '1_month_validity': '1 month validity',
    'all_premium_templates': 'All premium templates',
    'advanced_customization': 'Advanced customization',
    'detailed_statistics': 'Detailed statistics',
    'priority_support': 'Priority support',
    'choose_standard': 'Choose Standard',
    'unlimited_invitations': 'Unlimited invitations',
    'choose_premium': 'Choose Premium',
    'most_popular': 'Most popular',
    'limited': 'Limited',
    'footer_description': 'Create exceptional digital invitations that make an impression. Your event deserves an invitation worthy of its importance.',
    'quick_links': 'Quick links',
    'about': 'About',
    'contact': 'Contact',
    'privacy_policy': 'Privacy policy',
    'terms_of_service': 'Terms of service',
    'support': 'Support',
    'help_center': 'Help center',
    'guides': 'Guides',
    'tutorials': 'Tutorials',
    'copyright': '© 2025 Furaha-Event. All rights reserved.',
    'legal_notice': 'Legal notice',
    'cookies': 'Cookies',
    'accessibility': 'Accessibility'
  },
  
  es: {
    // Navigation principale
    'home': 'Inicio',
    'pricing': 'Precios',
    'login': 'Iniciar sesión',
    
    // Navigation
    'dashboard': 'Panel de control',
    'templates': 'Plantillas',
    'guests': 'Invitados',
    'tables': 'Mesas',
    'analytics': 'Estadísticas',
    'profile': 'Perfil',
    'settings': 'Configuración',
    'logout': 'Cerrar sesión',
    
    // Actions
    'create': 'Crear',
    'edit': 'Editar',
    'delete': 'Eliminar',
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'confirm': 'Confirmar',
    'back': 'Atrás',
    'next': 'Siguiente',
    'previous': 'Anterior',
    'close': 'Cerrar',
    'view': 'Ver',
    'download': 'Descargar',
    'upload': 'Subir',
    'send': 'Enviar',
    'add': 'Añadir',
    'remove': 'Quitar',
    
    // Statuts
    'confirmed': 'Confirmado',
    'pending': 'Pendiente',
    'declined': 'Rechazado',
    'active': 'Activo',
    'inactive': 'Inactivo',
    'completed': 'Completado',
    'draft': 'Borrador',
    
    // Messages
    'welcome': 'Bienvenido',
    'loading': 'Cargando...',
    'error': 'Error',
    'success': 'Éxito',
    'warning': 'Advertencia',
    'info': 'Información',
    'no_data': 'No hay datos disponibles',
    'search': 'Buscar',
    'filter': 'Filtrar',
    'sort': 'Ordenar',
    
    // Dashboard
    'total_invitations': 'Total invitaciones',
    'confirmed_guests': 'Invitados confirmados',
    'pending_responses': 'Respuestas pendientes',
    'total_tables': 'Total mesas',
    'recent_activity': 'Actividad reciente',
    'quick_actions': 'Acciones rápidas',
    'create_invitation': 'Crear invitación',
    'manage_guests': 'Gestionar invitados',
    'view_analytics': 'Ver estadísticas',
    
    // Invités
    'guest_name': 'Nombre del invitado',
    'table_number': 'Número de mesa',
    'guest_type': 'Tipo de invitado',
    'single': 'Individual',
    'couple': 'Pareja',
    'confirmation_status': 'Estado de confirmación',
    'drink_choice': 'Elección de bebida',
    'message': 'Mensaje',
    
    // Tables
    'table_name': 'Nombre de la mesa',
    'seats': 'Asientos',
    'assigned_guests': 'Invitados asignados',
    'available_seats': 'Asientos disponibles',
    'table_status': 'Estado de la mesa',
    'full': 'Completa',
    'partial': 'Parcial',
    'empty': 'Vacía',
    
    // Paramètres
    'language': 'Idioma',
    'theme': 'Tema',
    'light_mode': 'Modo claro',
    'dark_mode': 'Modo oscuro',
    'notifications': 'Notificaciones',
    'privacy': 'Privacidad',
    'account': 'Cuenta',
    
    // Profil
    'personal_info': 'Información personal',
    'first_name': 'Nombre',
    'last_name': 'Apellido',
    'email': 'Correo electrónico',
    'phone': 'Teléfono',
    'address': 'Dirección',
    'member_since': 'Miembro desde',
    'subscription': 'Suscripción',
    
    // Erreurs
    'required_field': 'Este campo es obligatorio',
    'invalid_email': 'Correo electrónico inválido',
    'password_too_short': 'Contraseña demasiado corta',
    'passwords_dont_match': 'Las contraseñas no coinciden',
    'network_error': 'Error de conexión',
    'server_error': 'Error del servidor',
    'not_found': 'No encontrado',
    'unauthorized': 'No autorizado',
    'forbidden': 'Acceso prohibido',
    
    // Nuevas traducciones para componentes
    'hero_description': 'Crea invitaciones hermosas e interactivas para todos tus eventos especiales',
    'discover_templates': 'Descubrir nuestras plantillas',
    'view_pricing': 'Ver precios',
    'our_services': 'Nuestros Servicios',
    'services_description': 'Descubre nuestra gama completa de invitaciones para todos tus eventos importantes',
    'wedding_invitations': 'Invitaciones de Boda',
    'wedding_description': 'Crea invitaciones románticas y elegantes para tu día especial',
    'birthday_invitations': 'Invitaciones de Cumpleaños',
    'birthday_description': 'Celebra cada año con estilo y originalidad',
    'graduation_invitations': 'Invitaciones de Graduación',
    'graduation_description': 'Marca tu éxito académico con orgullo',
    'view_templates': 'Ver plantillas',
    'why_choose_us': '¿Por qué elegir Furaha-Event?',
    'why_choose_desc': 'Características excepcionales para eventos memorables',
    'premium_templates': 'Plantillas Premium',
    'premium_templates_desc': 'Plantillas excepcionales con todas las características avanzadas',
    'custom_design': 'Diseño Personalizado',
    'custom_design_desc': 'Personaliza completamente tus invitaciones a tu gusto',
    'complete_management': 'Gestión Completa',
    'complete_management_desc': 'Panel de administración para gestionar todos tus eventos en un lugar',
    'choose_your_plan': 'Elige tu plan',
    'pricing_description': 'Soluciones adaptadas a todas tus necesidades de eventos, desde simples hasta sofisticados',
    'free_plan': 'Gratis',
    'per_month': '/mes',
    'max_5_invitations': '5 invitaciones máximo',
    'basic_templates': 'Plantillas básicas',
    'email_support': 'Soporte por email',
    'pdf_export': 'Exportar PDF',
    'get_started': 'Comenzar',
    'max_200_invitations': '200 invitaciones máximo',
    '1_month_validity': '1 mes de validez',
    'all_premium_templates': 'Todas las plantillas premium',
    'advanced_customization': 'Personalización avanzada',
    'detailed_statistics': 'Estadísticas detalladas',
    'priority_support': 'Soporte prioritario',
    'choose_standard': 'Elegir Estándar',
    'unlimited_invitations': 'Invitaciones ilimitadas',
    'choose_premium': 'Elegir Premium',
    'most_popular': 'Más popular',
    'limited': 'Limitado',
    'footer_description': 'Crea invitaciones digitales excepcionales que causan impresión. Tu evento merece una invitación digna de su importancia.',
    'quick_links': 'Enlaces rápidos',
    'about': 'Acerca de',
    'contact': 'Contacto',
    'privacy_policy': 'Política de privacidad',
    'terms_of_service': 'Términos de servicio',
    'support': 'Soporte',
    'help_center': 'Centro de ayuda',
    'guides': 'Guías',
    'tutorials': 'Tutoriales',
    'copyright': '© 2025 Furaha-Event. Todos los derechos reservados.',
    'legal_notice': 'Aviso legal',
    'cookies': 'Cookies',
    'accessibility': 'Accesibilidad'
  }
};

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Récupérer la langue sauvegardée ou utiliser la langue du navigateur
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['fr', 'en', 'es'].includes(savedLanguage)) {
      return savedLanguage;
    }
    
    // Détecter la langue du navigateur
    const browserLanguage = navigator.language.split('-')[0];
    if (['fr', 'en', 'es'].includes(browserLanguage)) {
      return browserLanguage as Language;
    }
    
    return 'fr'; // Langue par défaut
  });

  useEffect(() => {
    // Sauvegarder la langue sélectionnée
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};