# 📋 BITÁCORA DE DESARROLLO — PAWS PATIENTS PRO (VETCARE)

> **Norma de registro**: Las entradas más recientes se agregan siempre al **inicio** de la bitácora (orden cronológico inverso).  
> Cada registro documenta la fecha/hora, la incidencia o requerimiento, lo que está funcionando correctamente, los problemas detectados y la solución técnica aplicada.

---

## 📅 [2026-09-07 05:30] — Dictado Clínico IA, Edición de Consultas, TTS Fish Audio Latino y Asistente Manos Libres

### 📝 Incidencia / Requerimiento
1. **Audio exclusivo con Fish Audio**: Eliminar OpenAI para la síntesis de voz (TTS) y utilizar la cuenta de Fish Audio de la clínica.
2. **Dictado por voz en atención médica**: El veterinario requería dictar la consulta en vivo (desde Agenda o Historial de Consultas) y que la IA auto-rellene de forma estructurada los campos médicos (motivo, examen físico, hallazgos, diagnóstico, tratamiento, etc.).
3. **Edición de consultas**: No existía una opción visible para editar o rectificar consultas ya guardadas en la historia clínica.
4. **Calidad de voz y acento latino**: La voz original de Fish Audio sonaba robótica/extraña por no tener asignada una voz latina natural por defecto.
5. **Conciencia de la base de datos de la clínica**: Al preguntarle a la IA cuántas mascotas habían registradas, respondía que no tenía acceso a la información. El asistente debe conocer todo lo que hay en la base de datos viva (pacientes, clientes, citas de hoy, inventario bajo, consultas).
6. **Experiencia conversacional manos libres (estilo Alexa / Google Assistant)**: El usuario no quería tener que presionar el botón de enviar tras hablar por micrófono; requería que al terminar de hablar, la IA envíe sola la pregunta y responda en voz alta.

### ✅ Lo que está bien / funcionando
- **Dictado clínico en formulario de consulta**: Micrófono interactivo con botón *"✨ Procesar con IA y autollenar"* conectado a `structureConsultationVoice()`.
- **Edición completa de consultas**: Botón `[✏️ Editar Consulta]` disponible tanto en el historial de consultas como en citas finalizadas de la Agenda.
- **Fish Audio TTS Exclusivo**: Modelo `s2.1-pro-free` con voz predeterminada **Verity (Español Latino)** (`655e3fff79c7463dbf70e2ed5c4bd5d3`), eliminando cualquier llamada a OpenAI para audio.
- **Selector de voces latinas en Configuración**: Dropdown con voces Verity, Natasha, Jarvis, Médico, soporte para IDs clonados y botón de prueba en vivo (`🔊 Probar voz`).
- **Contexto de base de datos en tiempo real**: Hook `useGlobalClinicContext()` inyecta conteo exacto de mascotas (con nombres, especies y dueños), clientes, agenda del día, productos con stock bajo y equipo veterinario.
- **Modo manos libres con detección de silencio**: Al hablar por el micrófono, un detector de pausas (1.6s) detiene la escucha y envía la consulta automáticamente, reproduciendo la respuesta por voz sin necesidad de tocar el teclado ni el botón Enviar.

### ⚠️ Lo que se tuvo que corregir
1. `runVoiceTTS` recurría a OpenAI TTS: se refactorizó `tts.functions.ts` para que opere única y exclusivamente con la API de Fish Audio (`s2.1-pro-free`).
2. Ausencia de contexto global en `ChatTool`: solo inyectaba datos si había una mascota individual seleccionada; se resolvió construyendo un resumen integral de toda la clínica.
3. Envío manual en entrada de voz: se añadió el temporizador de inactividad fonética y el parámetro `textOverride` en `send()` para disparo automático.

### 🔧 Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/lib/tts.functions.ts` | Eliminación de OpenAI TTS, implementación exclusiva de Fish Audio con fallback predeterminado a voz latina. |
| `src/lib/ai.functions.ts` | Creación de `structureConsultationVoice()` con schema tipado Zod para autollenar consultas médicas. |
| `src/components/consultation-form.tsx` | Integración de micrófono, reconocimiento de voz, pre-carga de campos para edición y botón de estructuración IA. |
| `src/components/consultation-detail.tsx` | Modo edición con botón `[✏️ Editar Consulta]` conectado al formulario y `updateConsultation()`. |
| `src/routes/_app.agenda.tsx` | Botón para editar consulta en citas terminadas y enlace a `ConsultationDetailDialog`. |
| `src/routes/_app.consultas.tsx` | Botón de edición en tarjetas de historial médico de mascotas. |
| `src/components/vetcare-ai.tsx` | Inyección de `useGlobalClinicContext()`, selector de voces latinas, botón de prueba y auto-envío por silencio. |
| `src/lib/ai-store.ts` y `saas-store.ts` | Configuración y persistencia en Supabase de la voz latina predeterminada y ajustes de audio. |

---

## 📅 [2026-09-07 03:34] — Sistema de Correos Automáticos Resend + Mejoras UI Cobros

### 📝 Incidencia / Requerimiento
El usuario solicitó:
1. Confirmaciones automáticas de citas y resúmenes clínicos de consultas por correo electrónico a los clientes.
2. Configuración de API Key de Resend por veterinaria desde la pantalla de Configuración.
3. Visibilidad del campo API Key (ícono de ojo para mostrar/ocultar).
4. Cierre automático del modal de correo al confirmar el envío.
5. Que la orden de cobro enviada a Recepción sea visible desde Caja, Punto de Venta y Facturación.
6. Rediseño del modal de cobro de consulta para separar claramente "Enviar a Recepción" de "Cobrar en Consultorio".

### ✅ Lo que está bien / funcionando
- **Dominio `go2vet.online`** verificado en Resend con DKIM, SPF y MX correctos.
- **Envío automático en segundo plano** al crear una cita (Agenda) y al completar una consulta (Consultas), sin interacción manual del usuario.
- **Configuración por clínica** en `Configuración > Correos / Resend`: API Key con toggle de visibilidad (ojo), nombre y correo del remitente, comprobador de conexión en vivo.
- **Forzado del dominio verificado en servidor**: si `fromEmail` está vacío o contiene `resend.dev`, siempre se envía desde `citas@go2vet.online`, eliminando el error 403 de Resend.
- **Cierre automático de modales** de cita y consulta inmediatamente tras el envío exitoso.
- **Órdenes de cobro pendientes** visibles en Punto de Venta, Caja y Facturación con indicador azul parpadeante animado.
- **Modal de cobro rediseñado** con pestañas: "Enviar a Recepción" (azul, por defecto) y "Cobrar en Consultorio" (verde); cierre inmediato en ambas acciones.

### ⚠️ Lo que se tuvo que corregir
1. **Error 403 de Resend**: El `from` header usaba `onboarding@resend.dev` (sandbox) en lugar del dominio verificado. Resend solo permite enviar a correos externos desde un dominio propio verificado.
2. **Modal de correo no se cerraba**: El primer intento usó `setTimeout(500ms)` que no disparaba correctamente. Se corrigió llamando `onOpenChange(false)` directamente.
3. **`Receipt is not defined` en `/punto-venta`**: El ícono `Receipt` de `lucide-react` no estaba importado y colisionaba con el tipo local `Receipt`. Se renombró el tipo a `PosReceiptData` y se importó el ícono.
4. **Caché del Service Worker (PWA)**: El navegador cargaba chunks viejos (404). Requirió `Empty Cache and Hard Reload` desde DevTools.

### 🔧 Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/lib/email.functions.ts` | Función `getValidSenderEmail()` fuerza `citas@go2vet.online` en los tres server functions. |
| `src/lib/clinic-email-store.ts` | `getClinicEmailConfig()` sanitiza automáticamente valores `resend.dev` en localStorage. |
| `src/routes/_app.configuracion.tsx` | Placeholder y fallback actualizados a `citas@go2vet.online`. |
| `src/components/appointment-email-dialog.tsx` | Cierre inmediato del modal en éxito. |
| `src/components/consultation-email-dialog.tsx` | Cierre inmediato del modal en éxito. |
| `src/components/pay-consultation-dialog.tsx` | Rediseño completo con Tabs, cierre inmediato, sin pantalla de confirmación intermedia. |
| `src/routes/_app.caja.tsx` | Banner de órdenes pendientes con cards por consulta y modal de cobro rápido. |
| `src/routes/_app.punto-venta.tsx` | Import de ícono `Receipt`; tipo renombrado `Receipt → PosReceiptData`. |

### 📦 Commits de esta sesión
- `743c7a7` — fix: enforce verified domain `citas@go2vet.online` to eliminate Resend 403
- `8522947` — feat: auto-close email dialogs upon successful dispatch
- `7461a99` — fix: close email dialogs immediately without delay
- `261f47f` — feat: redesign PayConsultationDialog + pending orders in Caja/POS/Facturación
- `291d37f` — fix: import Receipt icon, rename type PosReceiptData in punto-venta

---

## 📅 [2026-09-04 00:54] — Módulo Website Studio CMS Completo con 4 Plantillas Veterinarias

### 📝 Incidencia / Requerimiento
El CMS anterior era un formulario monolítico básico con 3 estilos que solo cambiaban colores CSS sin variedad estructural. El usuario solicitó rehacer el módulo al estilo del CMS de Edulink Nexus bajo el principio de arquitectura **`CONTENT ≠ TEMPLATE`**, implementando 4 plantillas con diseño profesional e impactante ("que queden con la boca abierta"), junto con un editor por pestañas y vista previa responsive.

### ✅ Lo que está bien / funcionando
- **Modelo de datos enriquecido (`src/lib/website-store.ts`)**: Se definió un modelo con soporte para identidad extendida (misión, visión, historia, certificaciones, cover hero), contacto completo (urgencias 24h, WhatsApp, mapa embed, redes), SEO, métricas interactivas, FAQs y catálogo de servicios detallados. El contenido persiste de forma independiente a la plantilla elegida.
- **4 Plantillas visuales independientes (`src/components/website-templates/`)**:
  1. `ModernPetcareRenderer.tsx`: Estilo cálido y familiar (menta/coral), hero asimétrico con pata SVG, hover 3D en servicios y botón WhatsApp flotante.
  2. `VeterinaryMedicalRenderer.tsx`: Estilo hospitalario/formal (azul cobalto/dorado), topbar médica, barra de certificaciones, equipo médico con formato credencial ID.
  3. `BentoVetRenderer.tsx`: Estilo tech vanguardista (#0d0d0f/púrpura), mosaico Bento asimétrico con widget de urgencias 24h animado, horarios en tiempo real y glassmorphism.
  4. `BoutiqueSpaRenderer.tsx`: Estilo boutique premium (crema/dorado/rosa), tipografía serif, formato menú de spa con tiempos/precios y galería tipo Pinterest/Masonry.
- **Enrutador central (`WebsiteRenderer.tsx`)**: Renderizado dinámico de la plantilla según `template_id`.
- **Editor Website Studio por pestañas (`src/components/website-studio/`)**:
  - `WebsiteStudio.tsx`: Header oscuro con estado animado (Borrador/Publicado), nombre de plantilla activa, botón `[Vista Previa]` y acción rápida `[Publicar]`.
  - `DesignTab.tsx`: Tarjetas visuales de plantilla, paleta de colores y switches para activar/desactivar secciones.
  - `ContentTab.tsx`: Identidad, historia, misión, métricas interactivas y editor de FAQs.
  - `ServicesTab.tsx`: CRUD completo de servicios con emojis, precios, badges, duraciones y precarga demo.
  - `ContactTab.tsx`: Teléfonos, WhatsApp internacional, email, mapa y redes sociales.
  - `SeoTab.tsx`: Slug (`/site/$slug`), metadatos SEO con contadores y controles de publicación.
  - `WebsitePreviewModal.tsx`: Simulador interactivo en 3 vistas (Celular 390px con notch, Tablet 768px y PC).
- **Rutas públicas e internas**: Conectadas en `/_app/website` y `/site/$slug`.

### ⚠️ Lo que se tuvo que corregir
1. **Interpolación de strings en archivos del editor**: Durante la generación inicial mediante comandos de shell, las cadenas de plantilla con `${...}` fueron evaluadas prematuramente como variables vacías, generando errores de sintaxis (`Expected "}" but found "h"`).
2. **Discrepancia en exportaciones de componentes de plantilla**: `WebsiteRenderer.tsx` importaba `VeterinaryMedicalRenderer`, `BentoVetRenderer` y `BoutiqueSpaRenderer` como exports nombrados, pero estaban definidos como `export default`.

### 🔧 Cómo se corrigió
1. Se reescribieron los archivos del editor (`WebsiteStudio.tsx`, `DesignTab.tsx`, `ContentTab.tsx`, `ServicesTab.tsx`, `ContactTab.tsx`, `SeoTab.tsx`, `WebsitePreviewModal.tsx`) asegurando que los template literals `${...}` permanezcan literales e intactos.
2. Se corrigió la sintaxis de importación en `WebsiteRenderer.tsx` para importar por defecto cada componente de renderizado correspondiente.
3. Se verificó con `npm run build`: compilación de cliente y servidor SSR finalizada con **código de salida 0**.

---

## 📅 [2026-09-04 00:05] — Ajuste de Safe Area Insets (AppBar en Móviles con Notch / Barra de Estado)

### 📝 Incidencia / Requerimiento
El usuario señaló que el AppBar quedaba muy arriba en la pantalla, con riesgo de que la barra de estado o el notch de los teléfonos móviles tapara la información o botones de navegación.

### ✅ Lo que está bien / funcionando
- El diseño respeta los márgenes seguros de los dispositivos móviles modernos (iOS y Android) manteniendo sticky header funcional y accesible.

### ⚠️ Lo que se tuvo que corregir
Los layouts principales (`app-layout`, `portal-layout`, `superadmin-layout`, etc.) tenían padding fijo que no consideraba las variables de entorno de pantalla de los navegadores móviles (`env(safe-area-inset-top)`).

### 🔧 Cómo se corrigió
1. Se agregaron utilidades CSS en `src/styles.css`:
   - `.safe-top`: `padding-top: max(0.5rem, env(safe-area-inset-top, 0px))`
   - `.safe-bottom`: `padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0px))`
   - `.safe-x`: `padding-left` y `padding-right` acordes al notch horizontal.
2. Se aplicó la clase `.safe-top` a los headers de `superadmin-layout.tsx`, `app-layout.tsx`, `portal-layout.tsx`, `tienda.tsx` y al modal sticky de `portal.mascotas.tsx`.

---

## 📅 [2026-09-03 23:45] — Redirección Inteligente de Clientes en Login de Personal

### 📝 Incidencia / Requerimiento
Confusión recurrente al intentar ingresar con credenciales de clientes (ej. `maria@gmail.com`) en la pantalla `/login` (que es exclusiva para personal/veterinarios con Supabase Auth), lo que arrojaba un error genérico de credenciales inválidas.

### ✅ Lo que está bien / funcionando
- El personal administrativo y médico inicia sesión por `/login`.
- Los dueños de mascotas inician sesión por `/portal/login`.
- Si un cliente intenta iniciar sesión en `/login`, la app lo asiste inmediatamente.

### ⚠️ Lo que se tuvo que corregir
El formulario de login del personal no distinguía si el correo pertenecía a un cliente registrado, frustrando al usuario con mensajes de error no explicativos.

### 🔧 Cómo se corrigió
En `src/routes/login.tsx`, se integró la verificación contra `getAllClientes()` dentro de `handleSubmit()`. Si el correo corresponde a un cliente, se dispara un toast informativo con duración de 8 segundos y un botón de acción rápida **"Ir al Portal"** que redirige automáticamente a `/portal/login`.

---

## 📅 [2026-09-03 23:20] — Formulario de Registro con Doble Contraseña y Limpieza de Login

### 📝 Incidencia / Requerimiento
El usuario solicitó:
1. Eliminar cajas visibles con credenciales de prueba ("demo") en las pantallas de login para PC y móvil.
2. Solicitar confirmación de contraseña al registrarse ("pedir dos veces la contraseña").
3. Mantener claro el flujo de registro de clientes.

### ✅ Lo que está bien / funcionando
- Interfaz de login limpia, moderna y profesional sin textos de soporte demo expuestos.
- Validación reactiva de contraseñas coincidentes antes de enviar el formulario.

### ⚠️ Lo que se tuvo que corregir
- Cajas estáticas con credenciales de demostración estaban fijas en la UI.
- Los formularios de registro solo tenían un único campo de contraseña sin confirmación.

### 🔧 Cómo se corrigió
1. Se removieron los recuadros demo de `src/routes/login.tsx` y `src/routes/portal.login.tsx`.
2. Se agregó el campo `Confirmar contraseña` con validación en tiempo real y mensaje de error en caso de no coincidir.
3. Se implementó el toggle interactivo "¿No tienes cuenta? Crear cuenta" en `portal.login.tsx`.

---

## 📅 [2026-09-03 22:50] — Navegación de Retorno en Tienda y Farmacia

### 📝 Incidencia / Requerimiento
Al ingresar a la tienda o farmacia (`/tienda`), el usuario no tenía un mecanismo claro y directo para regresar a su panel principal según su rol (cliente vs personal).

### ✅ Lo que está bien / funcionando
- La navegación es contextual: un dueño de mascota regresa a `/portal/dashboard` y un empleado/veterinario regresa a `/dashboard`.

### ⚠️ Lo que se tuvo que corregir
La cabecera de la tienda carecía de un botón de retorno evidente que identificara el contexto de sesión del usuario.

### 🔧 Cómo se corrigió
En `src/routes/tienda.tsx`, se agregó un enlace visible `← Volver a Inicio` en la barra superior que evalúa la sesión activa mediante `usePortalAuth()` y `useAuth()` para redirigir a la ruta correcta.

---

## 📅 [2026-09-03 22:15] — Limpieza de Sidebar y Diferenciación de "Ver Expediente" vs "Carnet"

### 📝 Incidencia / Requerimiento
1. En el sidebar del portal del cliente aparecía "Mis Mascotas", lo cual era redundante ya que el Inicio ya lista las mascotas con sus acciones.
2. En las tarjetas de mascotas, el botón "Ver expediente" llevaba al carnet digital en lugar de abrir el historial clínico directo de la mascota.
3. El icono de Wi-Fi / Estado de red en el AppBar ocupaba espacio innecesario.

### ✅ Lo que está bien / funcionando
- El inicio del portal del cliente (`/portal/dashboard`) es el punto neurálgico con todas las mascotas y accesos directos.
- Cada mascota cuenta con dos botones claros:
  - **[Ver expediente]**: abre directamente el expediente clínico e historial médico.
  - **[Carnet]**: abre el carnet digital de vacunas/desparasitaciones.
- Los AppBars tienen un diseño limpio sin iconos superfluos.

### ⚠️ Lo que se tuvo que corregir
- Redundancia en el menú lateral de navegación.
- Confusión de rutas entre el carnet digital y el expediente de la mascota.
- Presencia del indicador de estado de red en todos los layouts.

### 🔧 Cómo se corrigió
1. Se removió la opción "Mis Mascotas" del sidebar de `portal-layout.tsx`; `/portal/mascotas` redirige al dashboard.
2. En `portal.dashboard.tsx`, se implementó la botonera dual para cada mascota (`Ver expediente` y `Carnet`).
3. Se retiró el componente `NetworkStatus` de todos los encabezados y se configuró para retornar `null`.

---
