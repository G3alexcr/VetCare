export interface LegalPolicySection {
  id: string;
  title: string;
  badge: string;
  lastUpdated: string;
  intro: string;
  articles: {
    title: string;
    content: string | string[];
    highlight?: string;
  }[];
}

export const LEGAL_POLICIES: Record<string, LegalPolicySection> = {
  "datos-personales": {
    id: "datos-personales",
    title: "Tratamiento de Datos Personales",
    badge: "Ley Estatutaria 1581 de 2012 & Decreto 1377 de 2013",
    lastUpdated: "Enero de 2026",
    intro:
      "Dando estricto cumplimiento a lo dispuesto en la Ley Estatutaria 1581 de 2012, su Decreto Reglamentario 1377 de 2013 y demás normas complementarias sobre Protección de Datos Personales (Habeas Data), Go2Vet® adopta la presente Política de Tratamiento de Datos Personales. Este documento establece los mecanismos, procedimientos y garantías institucionales para asegurar el uso adecuado, seguro y transparente de la información recopilada en nuestras bases de datos respecto a profesionales veterinarios, colaboradores, clínicas afiliadas y tutores o propietarios de pacientes.",
    articles: [
      {
        title: "1. Principios Rectores del Tratamiento",
        content: [
          "Principio de Legalidad: El tratamiento de datos realizado por Go2Vet® se sujeta de manera estricta a lo consagrado en la legislación vigente colombiana.",
          "Principio de Finalidad: El acopio de datos personales obedece a fines legítimos de prestación de servicios veterinarios, historia clínica de mascotas, emisión de fórmulas médicas, recordatorios sanitarios y facturación.",
          "Principio de Libertad: La recolección de datos requiere consentimiento libre, previo, expreso e informado del titular.",
          "Principio de Veracidad o Calidad: La información sujeta a tratamiento debe ser veraz, completa, exacta, actualizada y comprensible.",
          "Principio de Seguridad y Confidencialidad: Se aplican rigurosos estándares técnicos, humanos y administrativos para impedir adulteración, pérdida, consulta o uso no autorizado.",
        ],
      },
      {
        title: "2. Finalidades de la Recolección de Datos",
        content: [
          "Gestión integral de expedientes clínicos veterinarios, vacunaciones, desparasitaciones y procedimientos médicos de pacientes caninos, felinos y otras especies.",
          "Administración de citas médicas, recordatorios vía WhatsApp, SMS o correo electrónico, y seguimiento de tratamientos farmacológicos.",
          "Emisión de comprobantes de pago, facturas electrónicas, recetas médicas y certificados de salud animal según normativas sanitarias.",
          "Habilitación y administración de cuentas de usuario en el Portal de Tutores y en el sistema de gestión clínica veterinaria.",
          "Generación de reportes epidemiológicos anonimizados y estadísticas operativas de rendimiento clínico.",
        ],
        highlight:
          "Go2Vet® garantiza que bajo ninguna circunstancia comercializa, arrienda o transfiere bases de datos personales o expedientes médicos a empresas de publicidad o intermediarios no autorizados.",
      },
      {
        title: "3. Derechos de los Titulares (Derechos ARCO)",
        content: [
          "Acceso: Conocer de forma gratuita los datos personales que reposan en las bases de datos de Go2Vet®.",
          "Actualización y Rectificación: Solicitar la corrección de datos inexactos, incompletos, fraccionados o que induzcan a error.",
          "Supresión y Cancelación: Exigir la eliminación de datos cuando considere que no se están respetando los principios, derechos y garantías legales (salvo deber legal o contractual de custodia médica).",
          "Revocatoria de la Autorización: Revocar el consentimiento otorgado para el tratamiento de sus datos personales en cualquier momento.",
          "Presentación de Reclamos: Presentar consultas y quejas formales ante Go2Vet® y, subsidiariamente, ante la Superintendencia de Industria y Comercio (SIC).",
        ],
      },
      {
        title: "4. Custodia y Conservación de Historias Clínicas Veterinarias",
        content:
          "Las historias clínicas, registros médicos de intervenciones, exámenes de laboratorio e imágenes diagnósticas registradas en Go2Vet® están sujetas a reserva profesional y protocolos de custodia reforzados. Go2Vet® actúa como encargado del tratamiento tecnológico, proveyendo copias de respaldo automatizadas en la nube y cifrado en tránsito y reposo.",
      },
      {
        title: "5. Canales para el Ejercicio de Derechos de Habeas Data",
        content:
          "Cualquier titular o tutor de mascota puede ejercer sus derechos enviando una solicitud formal a través de nuestro correo oficial de privacidad: privacidad@go2vet.app, o mediante la sección de Soporte en la plataforma, indicando nombres, identificación y el objeto puntual de su solicitud.",
      },
    ],
  },

  "aplicativos-web": {
    id: "aplicativos-web",
    title: "Política de Manejo de Aplicativos Web y Privacidad",
    badge: "Seguridad Digital, Cookies y Servicios en la Nube",
    lastUpdated: "Enero de 2026",
    intro:
      "Para Go2Vet®, la seguridad digital y la privacidad de la información procesada a través de nuestra plataforma web, aplicaciones móviles y portal de clientes son pilares fundamentales. Esta política describe los lineamientos de confidencialidad, uso de cookies, telemetría y salvaguardas tecnológicas implementadas en toda la infraestructura de Go2Vet®.",
    articles: [
      {
        title: "1. Registro y Voluntariedad de la Información",
        content:
          "El usuario reconoce que el ingreso de credenciales e información personal, médica o comercial en Go2Vet® se realiza de forma voluntaria y necesaria para el alta y administración del software veterinario, la gestión de inventarios, compras en farmacia, expedición de citas y soporte técnico interactivo.",
      },
      {
        title: "2. Cifrado y Seguridad de Credenciales",
        content: [
          "Toda comunicación entre el navegador del usuario y nuestros servidores viaja protegida mediante protocolos criptográficos TLS/SSL con algoritmos de 256 bits.",
          "Las contraseñas de acceso están fuertemente encriptadas mediante funciones hash unidireccionales (bcrypt/argon2). El personal técnico de Go2Vet® no tiene acceso ni potestad para visualizar la clave en texto plano.",
          "El usuario y la clínica titular son los exclusivos custodios de sus credenciales de acceso y deben evitar su divulgación a terceros.",
        ],
        highlight:
          "Go2Vet® nunca solicitará contraseñas ni códigos de verificación por canales telefónicos no autenticados.",
      },
      {
        title: "3. Uso de Cookies y Almacenamiento Local",
        content: [
          "Cookies Esenciales / de Sesión: Necesarias para mantener iniciada la sesión de veterinarios, recepcionistas y propietarios de mascotas de forma segura.",
          "Almacenamiento Local (Local/IndexedDB): Utilizado para permitir la sincronización en modo offline (PWA), permitiendo continuar consultas o inventario ante caídas temporales de red.",
          "Cookies de Rendimiento y Análisis: Go2Vet® emplea herramientas de telemetría y métricas analíticas (tales como analítica de navegación anónima) con el único fin de diagnosticar fallos, tiempos de carga y mejorar la experiencia de usuario.",
          "Gestión de Cookies: El usuario puede configurar su navegador para bloquear o suprimir cookies, teniendo en cuenta que algunas funcionalidades interactivas podrían verse limitadas.",
        ],
      },
      {
        title: "4. No Cesión de Datos a Terceros y Excepciones Legales",
        content:
          "Go2Vet® no cede, transfiere ni comercializa datos personales o clínicos con terceras partes ajenas a la prestación del servicio sin previa autorización. Únicamente se podrá revelar información ante requerimiento expreso y motivado de autoridades judiciales o sanitarias legalmente facultadas.",
      },
      {
        title: "5. Medidas Técnicas y Mitigación de Riesgos",
        content:
          "Go2Vet® implementa firewalls de aplicación web (WAF), copias de seguridad incrementales periódicas, políticas de control de acceso basadas en roles (RBAC) y monitoreo de intrusiones para prevenir accesos no autorizados, fugas de datos o pérdida de integridad en la información clínica.",
      },
      {
        title: "6. Modificaciones a la Política Web",
        content:
          "Go2Vet® se reserva la facultad de actualizar periódicamente las presentes especificaciones para adaptarlas a innovaciones técnicas o exigencias normativas. Las actualizaciones entrarán en vigor a partir de su publicación visible en la plataforma.",
      },
    ],
  },

  "condiciones-uso": {
    id: "condiciones-uso",
    title: "Condiciones y Términos de Uso de la Plataforma",
    badge: "Licencia de Uso de Software Cloud Go2Vet®",
    lastUpdated: "Enero de 2026",
    intro:
      "El presente acuerdo rige el acceso, suscripción y empleo del ecosistema tecnológico Go2Vet®, compuesto por la aplicación web de gestión médica veterinaria, el módulo de Punto de Venta (POS) & Farmacia, el Portal del Propietario y los sitios web temáticos de clínicas asociadas. Al ingresar y utilizar cualquiera de estos servicios, usted acepta en su totalidad las presentes Condiciones de Uso.",
    articles: [
      {
        title: "1. Objeto y Alcance de la Plataforma",
        content:
          "Go2Vet® es una solución de software en la nube desarrollada expresamente para centros veterinarios, clínicas especializadas, hospitales animales y consultorios independientes, facilitando la gestión de expedientes clínicos, hospitalizaciones, teleconsulta, citas, recordatorios automáticos y facturación.",
      },
      {
        title: "2. Responsabilidad Profesional Veterinaria",
        content:
          "Go2Vet® constituye una herramienta de apoyo informático y almacenamiento de registros médicos. Las decisiones diagnósticas, terapéuticas, prescripciones farmacológicas y procedimientos quirúrgicos son responsabilidad exclusiva de los médicos veterinarios colegiados y habilitados que administran cada cuenta clínica.",
        highlight:
          "El software Go2Vet® y sus módulos asistidos por inteligencia artificial (Go2Vet AI) son instrumentos auxiliares de documentación y gestión y no sustituyen el juicio clínico profesional del facultativo veterinario.",
      },
      {
        title: "3. Disponibilidad y Niveles de Servicio (SLA)",
        content: [
          "Go2Vet® procura mantener una disponibilidad promedio del 99.9% anual en su infraestructura en la nube.",
          "Los mantenimientos programados de servidores se notificarán con debida antelación y se ejecutarán prioritariamente en horarios de menor impacto operativo.",
          "El sistema dispone de soporte offline progresivo (PWA) para contingencias locales de conectividad a internet.",
        ],
      },
      {
        title: "4. Buenas Prácticas y Prohibiciones de Uso",
        content: [
          "Queda estrictamente prohibido utilizar Go2Vet® para almacenar material ilícito, difamatorio o no relacionado con los fines veterinarios y administrativos de la plataforma.",
          "Se prohíbe cualquier intento de vulnerar la seguridad, realizar pruebas de penetración sin autorización, descompilar código o extraer información de otros arrendatarios (tenants).",
          "La clínica usuaria se compromete a registrar información fehaciente de sus pacientes, tutores y personal colaborador.",
        ],
      },
      {
        title: "5. Aceptación y Terminación",
        content:
          "El uso continuado de la plataforma implica el conocimiento y aceptación integral de estos términos. La clínica titular o el usuario tutor pueden dar de baja su cuenta en cualquier momento conforme a las condiciones de su plan de suscripción, garantizándose la descarga y exportación de sus expedientes clínicos en formatos estándar.",
      },
    ],
  },
};
