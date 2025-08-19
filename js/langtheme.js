// A single object to hold all translations
const translations = {
  // Service-specific data, including content for the dynamic cards on index.html
  services: {
    ops: {
      icon: '<i class="fa-thin fa-briefcase"></i>',
      learn: "index.html", // Updated to point to the correct page
      img: "https://placehold.co/96x96?text=OPS",
      en: {
        title: "BUSINESS OPERATIONS",
        desc: "Streamline your processes, maximize efficiency, ensure compliance, and scale your business with precision.",
        modal: {
          title: "BUSINESS OPERATIONS",
          imgAlt: "Business Operations",
          content: "Detailed content about our Business Operations services. We help optimize your processes, boost efficiency, and drive growth through strategic operational support. Key areas: process optimization, supply chain management, quality assurance.",
          features: [
            "Workflow digitization & automation",
            "Logistics & inventory efficiency",
            "Risk & compliance frameworks (NIST, ISO, CISA)",
            "Performance metric dashboards & analytics",
            "Remote training & Lean operations",
          ],
        },
      },
      es: {
        title: "GESTIÓN",
        desc: "Optimice procesos, mejore la eficiencia, asegure cumplimiento y escale su empresa con precisión.",
        modal: {
          title: "SOBRE GESTIÓN",
          imgAlt: "Gestion",
          content: "Contenido detallado sobre nuestros servicios de Gestion. Ayudamos a optimizar sus procesos, mejorar la eficiencia e impulsar el crecimiento mediante el apoyo operativo estratégico. Las áreas clave incluyen la optimización de procesos, la gestión de la cadena de suministro y el aseguramiento de la calidad.",
          features: [
            "Digitalización y automatización del flujo de trabajo",
            "Estrategias de eficiencia logística e inventario",
            "Marcos de riesgo y cumplimiento (alineados a NIST, ISO, CISA)",
            "Cuadros de métricas de rendimiento y análisis",
            "Capacitación remota y operaciones Lean",
          ],
        },
      },
    },
    cc: {
      icon: '<i class="fa-thin fa-headset"></i>',
      learn: "contact-center.html",
      img: "https://placehold.co/96x96?text=CC",
      en: {
        title: "CONTACT CENTER",
        desc: "Enhance customer engagement with multilingual, multichannel support—24/7, data-driven, and empathetic.",
        modal: {
          title: "CONTACT CENTER",
          imgAlt: "Contact Center",
          content: "Explore our comprehensive Contact Center solutions to elevate customer satisfaction and engagement at every touchpoint. We offer inbound/outbound calls, multichannel support (email, chat, social), and advanced analytics.",
          features: [
            "24/7 inbound/outbound call management",
            "Multilingual chat/email support",
            "CRM integration (e.g., HubSpot, Salesforce)",
            "Social media engagement & sentiment tracking",
            "Customer experience analytics & quality monitoring",
          ],
        },
      },
      es: {
        title: "CENTRO DE CONTACTO",
        desc: "Mejore la experiencia del cliente con soporte multicanal y multilingüe—24/7, datos y empatía.",
        modal: {
          title: "SOBRE EL CENTRO DE CONTACTO",
          imgAlt: "Centro de Contacto",
          content: "Explore nuestras soluciones integrales de Centro de Contacto diseñadas para mejorar la satisfacción y el compromiso del cliente en todos los puntos de contacto. Ofrecemos servicios de llamadas entrantes y salientes, soporte multicanal (correo electrónico, chat, redes sociales) y análisis avanzados.",
          features: [
            "Gestión de llamadas entrantes y salientes 24/7",
            "Soporte por chat y correo electrónico en varios idiomas",
            "Integración con plataformas CRM (por ejemplo, HubSpot, Salesforce)",
            "Interacción en redes sociales y seguimiento de sentimiento",
            "Análisis de experiencia del cliente y monitoreo de calidad",
          ],
        },
      },
    },
    it: {
      icon: '<i class="fa-thin fa-laptop-code"></i>',
      learn: "it-support.html",
      img: "https://placehold.co/96x96?text=IT",
      en: {
        title: "IT SUPPORT",
        desc: "Proactive, secure, real-time tech help, cloud management, and cyber defense for every business size.",
        modal: {
          title: "IT SUPPORT",
          imgAlt: "IT Support",
          content: "Our IT Support services deliver reliable, timely assistance to keep your systems running smoothly and securely: help desk, network monitoring, cybersecurity, and cloud infrastructure management.",
          features: [
            "24/7 tech support & remote troubleshooting",
            "Real-time network & system monitoring",
            "Cybersecurity audits, patching, threat detection",
            "Cloud infrastructure setup & maintenance",
            "NIST, CISA, OPS Core CyberSec compliance",
          ],
        },
      },
      es: {
        title: "SOPORTE IT",
        desc: "Asistencia técnica proactiva y segura en tiempo real, gestión en la nube y ciberdefensa para cualquier tamaño de empresa.",
        modal: {
          title: "SOBRE SOPORTE IT",
          imgAlt: "Soporte IT",
          content: "Nuestros servicios de Soporte de TI brindan asistencia confiable y oportuna para mantener sus sistemas funcionando sin problemas y de forma segura. Los servicios incluyen soporte de mesa de ayuda, monitoreo de red, servicios de ciberseguridad y gestión de infraestructura en la nube.",
          features: [
            "Soporte técnico 24/7 y solución remota de problemas",
            "Monitoreo en tiempo real de red y sistemas",
            "Auditorías de ciberseguridad, parches y detección de amenazas",
            "Configuración y mantenimiento de infraestructura en la nube",
            "Cumplimiento con NIST, CISA y políticas OPS Core CyberSec",
          ],
        },
      },
    },
    pro: {
      icon: '<i class="fa-thin fa-user-tie"></i>',
      learn: "professional-services.html",
      img: "https://placehold.co/96x96?text=PRO",
      en: {
        title: "PROFESSIONALS",
        desc: "OPS-vetted talent for IT, HR, projects, finance—contract or full-time, ready when you are.",
        modal: {
          title: "PROFESSIONALS",
          imgAlt: "Professionals",
          content: "Access our network of highly qualified and experienced professionals for your project or long-term staffing. Experts in IT, project management, finance, HR. OPS-vetted, NDA, compliance trained.",
          features: [
            "Remote IT professionals (SysAdmins, DevOps, Analysts)",
            "Project managers & agile consultants",
            "Finance and accounting professionals",
            "HR and recruitment experts",
            "OPS-vetted talent with NDA, compliance and role-specific training",
            "Ask AI",
          ],
        },
      },
      es: {
        title: "PROFESIONALES",
        desc: "Talento validado por OPS para TI, RRHH, proyectos y finanzas—contrato o tiempo completo, listo para usted.",
        modal: {
          title: "SOBRE PROFESIONALES",
          imgAlt: "Profesionales",
          content: "Acceda a nuestra red de profesionales altamente cualificados y experimentados para satisfacer sus necesidades específicas de proyectos o de personal a largo plazo. Proporcionamos expertos en diversos campos, incluyendo TI, gestión de proyectos, finanzas y recursos humanos, asegurando que obtenga el talento adecuado para su negocio.",
          features: [
            "Profesionales IT remotos (SysAdmins, DevOps, Analistas)",
            "Gerentes de proyecto y consultores ágiles",
            "Profesionales de finanzas y contabilidad",
            "Expertos en recursos humanos y reclutamiento",
            "Talento validado por OPS con NDA, capacitación en cumplimiento y capacitación específica para el rol",
            "Preguntar AI",
          ],
        },
      },
    },
  },
  // All other generic translatable content from the HTML pages
  en: {
    'title-business-ops': "Business Operations | Ops Online Support",
    'title-contact-center': "Contact Center | Ops Online Support",
    'title-it-support': "IT Support | Ops Online Support",
    'title-professionals': "Professional Services | Ops Online Support",
    'nav-business-ops': "Business Operations",
    'nav-contact-center': "Contact Center",
    'nav-it-support': "IT Support",
    'nav-professionals': "Professionals",
    'header-heading': "Empower Your Business. Simplify Your Life.",
    'header-subheading': "From operational efficiency to expert staffing, we've got your back.",
    'cta-explore': "Explore Services",
    'cta-contact': "Contact Us",
    'services-heading': "Our Contact Center Services",
    'service-1': "24/7 inbound/outbound call management",
    'service-2': "Multilingual chat/email support",
    'service-3': "CRM integration (e.g., HubSpot, Salesforce)",
    'service-4': "Social media engagement & sentiment tracking",
    'service-5': "Customer experience analytics & quality monitoring",
    'client-story-heading': "Real Client Impact",
    'client-quote': "“Their team felt like an extension of our own. Customer satisfaction scores jumped 20% in the first quarter.”",
    'client-author': "– Director, E-commerce",
    'tiers-heading': "Our IT Support Tiers",
    'tier-1': "24/7 tech support & system monitoring",
    'tier-2': "Cybersecurity audits, patching, threat detection",
    'tier-3': "Cloud infrastructure management",
    'tier-4': "NIST, CISA, OPS Core CyberSec compliance",
    'impact-heading': "Real Impact",
    'specialties-heading': "We Specialize In:",
    'specialty-1': "Digital transformation & change management",
    'specialty-2': "Business continuity & risk planning",
    'specialty-3': "Revenue operations & analytics",
    'client-logos-alt': "Client logos",
    'offer-heading': "Limited-Time Offer",
    'offer-text': "Book by July 31 and get a free 90-minute ops strategy session (normally $650).",
    'offer-count': "Only 6 sessions left this month.",
    'cta-strategy-call': "Book Free Strategy Call",
    // Modal button
    'modal-learn-more': "Learn More",
    'nav-menu': 'Menu',
    'aria-toggle-language': 'Switch language to Spanish',
    'aria-toggle-theme': 'Toggle dark mode',
    'aria-nav-menu': 'Toggle navigation menu',
    'aria-close-menu': 'Close navigation menu',
    'aria-cta-explore': 'Explore services section',
    'footer-copyright': '© 2025 OPS Online Support.',
  },
  es: {
    'title-business-ops': "Servicios de Gestion | Ops Online Support",
    'title-contact-center': "Centro de Contacto | Ops Online Support",
    'title-it-support': "Servicios de Soporte TI | Ops Online Support",
    'title-professionals': "Servicios Profesionales | Ops Online Support",
    'nav-business-ops': "Gestion",
    'nav-contact-center': "Centro de Contacto",
    'nav-it-support': "Soporte IT",
    'nav-professionals': "Profesionales",
    'header-heading': "Potencie su empresa. Simplifique su vida.",
    'header-subheading': "Desde la eficiencia operativa hasta el personal experto, estamos a su lado.",
    'cta-explore': "Explorar Servicios",
    'cta-contact': "Contáctanos",
    'services-heading': "Nuestros Servicios de Centro de Contacto",
    'service-1': "Gestión de llamadas entrantes y salientes 24/7",
    'service-2': "Soporte por chat y correo electrónico en varios idiomas",
    'service-3': "Integración con plataformas CRM (por ejemplo, HubSpot, Salesforce)",
    'service-4': "Interacción en redes sociales y seguimiento de sentimiento",
    'service-5': "Análisis de experiencia del cliente y monitoreo de calidad",
    'client-story-heading': "Impacto Real en el Cliente",
    'client-quote': "“Su equipo se sintió como una extensión del nuestro. La satisfacción del cliente subió un 20% en el primer trimestre.”",
    'client-author': "– Director, Comercio electrónico",
    'tiers-heading': "Nuestros Niveles de Soporte TI",
    'tier-1': "Soporte técnico y monitoreo de sistemas 24/7",
    'tier-2': "Auditorías de ciberseguridad, parches y detección de amenazas",
    'tier-3': "Gestión de infraestructura en la nube",
    'tier-4': "Cumplimiento NIST, CISA, OPS Core CyberSec",
    'impact-heading': "Impacto Real",
    'specialties-heading': "Nos Especializamos En:",
    'specialty-1': "Transformación digital y gestión del cambio",
    'specialty-2': "Continuidad del negocio y planificación de riesgos",
    'specialty-3': "Operaciones de ingresos y analítica",
    'client-logos-alt': "Logotipos de clientes",
    'offer-heading': "Oferta por Tiempo Limitado",
    'offer-text': "Reserve antes del 31 de julio y obtenga una sesión de estrategia de operaciones gratuita de 90 minutos (normalmente $650).",
    'offer-count': "Solo quedan 6 sesiones este mes.",
    'cta-strategy-call': "Reservar Llamada de Estrategia Gratis",
    // Modal button
    'modal-learn-more': "Aprende Más",
    'nav-menu': 'Menú',
    'aria-toggle-language': 'Cambiar idioma a inglés',
    'aria-toggle-theme': 'Cambiar modo de color',
    'aria-nav-menu': 'Desplegar menú de navegación',
    'aria-close-menu': 'Cerrar menú de navegación',
    'aria-cta-explore': 'Explorar la sección de servicios',
    'footer-copyright': '© 2025 OPS Online Support.',
  },
};

let currentLanguage = localStorage.getItem('lang') || 'en';
let currentTheme = window.currentTheme || localStorage.getItem('theme') || 'light';
window.currentTheme = currentTheme;
window.currentLanguage = currentLanguage;

function updateContent() {
  const elements = document.querySelectorAll('[data-key]');
  const ariaElements = document.querySelectorAll('[data-aria-label-key]');
  const langButtons = document.querySelectorAll('.lang-toggle');
  const langData = translations[currentLanguage];

  elements.forEach(el => {
    const key = el.getAttribute('data-key');
    let translation = langData[key];

    // Handle service cards separately
    if (!translation) {
      const parts = key.split('-');
      if (parts.length === 2 && translations.services[parts[0]] && translations.services[parts[0]][currentLanguage]) {
        translation = translations.services[parts[0]][currentLanguage][parts[1]];
      }
    }

    if (translation) {
      if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
        el.placeholder = translation;
      } else if (el.tagName === 'IMG' && el.hasAttribute('alt')) {
        el.alt = translation;
      } else if (el.tagName === 'TITLE') {
        el.textContent = translation;
      } else {
        el.textContent = translation;
      }
    }
  });

  ariaElements.forEach(el => {
    const ariaKey = el.getAttribute('data-aria-label-key');
    const ariaTranslation = langData[ariaKey];
    if (ariaTranslation) {
      el.setAttribute('aria-label', ariaTranslation);
    }
  });

  // Update language toggle buttons
  langButtons.forEach(btn => {
    const nextLang = currentLanguage === 'en' ? 'ES' : 'EN';
    btn.textContent = nextLang;
    btn.setAttribute('aria-pressed', currentLanguage === 'es');
  });
}

function toggleLanguage() {
  currentLanguage = (currentLanguage === 'en') ? 'es' : 'en';
  localStorage.setItem('lang', currentLanguage);
  updateContent();
}

function updateTheme() {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(currentTheme);
  document.documentElement.style.backgroundColor = currentTheme === 'dark' ? '#121212' : '#ffffff';
  window.currentTheme = currentTheme;
  const themeButtons = document.querySelectorAll('.theme-toggle');
  themeButtons.forEach(btn => {
    btn.textContent = (currentTheme === 'light') ? 'Dark' : 'Light';
    btn.setAttribute('aria-pressed', currentTheme === 'dark');
  });
}

function toggleTheme() {
  currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  updateTheme();
}

// Initialize stored settings
document.addEventListener('DOMContentLoaded', () => {
  updateContent();
  updateTheme();

  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', toggleLanguage);
  });

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
});
