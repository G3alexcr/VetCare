# Paws & Patients Pro

Quiero crear una plataforma SaaS moderna para clínicas veterinarias, inspirada en OkVet, con una interfaz profesional, rápida y fácil de usar.

La aplicación debe ser multiusuario y preparada para evolucionar a un sistema multiclínica.

## Tecnologías objetivo

- Frontend moderno y responsive.

- Integración con Supabase.

- Base de datos PostgreSQL.

- Supabase Auth para autenticación.

- Supabase Storage para almacenar fotografías.

- Código limpio y modular.

- Diseño profesional tipo CRM médico.

-----------------------------------

AUTENTICACIÓN

-----------------------------------

Crear sistema de login con:

- Correo electrónico

- Contraseña

- Recuperación de contraseña

Roles:

- Administrador

- Veterinario

- Recepción

Cada usuario debe iniciar sesión y acceder únicamente a las funciones permitidas.

-----------------------------------

DASHBOARD

-----------------------------------

Al ingresar mostrar un dashboard con tarjetas estadísticas:

- Mascotas registradas

- Clientes registrados

- Citas del día

- Próximas citas

Mostrar también una agenda rápida del día.

Diseño moderno con sidebar izquierdo.

Menú:

Dashboard

Clientes

Mascotas

Agenda

Consultas

Configuración

-----------------------------------

MÓDULO CLIENTES

-----------------------------------

Crear CRUD completo.

Campos:

- Nombre completo

- Identificación

- Teléfono

- WhatsApp

- Correo electrónico

- Dirección

- Fecha de registro

- Observaciones

Funciones:

- Buscar cliente

- Editar

- Eliminar

- Ver mascotas asociadas

Un cliente puede tener múltiples mascotas.

-----------------------------------

MÓDULO MASCOTAS

-----------------------------------

CRUD completo.

Campos:

- Fotografía

- Nombre

- Especie

- Raza

- Sexo

- Color

- Fecha de nacimiento

- Peso

- Microchip

- Esterilizado (Sí/No)

- Alergias

- Observaciones

- Cliente propietario

Mostrar historial básico.

Permitir búsqueda rápida.

-----------------------------------

MÓDULO AGENDA

-----------------------------------

Crear agenda veterinaria.

Campos:

- Fecha

- Hora

- Cliente

- Mascota

- Veterinario

- Motivo

- Estado

Estados:

- Pendiente

- Confirmada

- En atención

- Finalizada

- Cancelada

Mostrar:

- Vista diaria

- Vista semanal

Permitir mover citas.

-----------------------------------

MÓDULO CONSULTAS

-----------------------------------

Registrar atención médica.

Campos:

- Fecha

- Veterinario

- Mascota

- Motivo de consulta

- Peso

- Temperatura

- Diagnóstico

- Tratamiento

- Medicamentos

- Observaciones

Cada consulta debe quedar guardada en el historial de la mascota.

-----------------------------------

BASE DE DATOS

-----------------------------------

Crear tablas relacionadas:

users

clients

pets

appointments

medical_consultations

Relaciones:

Cliente -> muchas mascotas

Mascota -> muchas consultas

Mascota -> muchas citas

Veterinario -> muchas citas

Veterinario -> muchas consultas

Usar claves foráneas correctamente.

-----------------------------------

DISEÑO

-----------------------------------

Estilo moderno tipo SaaS.

Inspirado en sistemas médicos profesionales.

Utilizar:

- Sidebar fijo

- Header superior

- Tablas modernas

- Formularios limpios

- Tarjetas estadísticas

- Colores suaves

- Excelente experiencia de usuario

Debe ser completamente responsive para computadora, tablet y móvil.

-----------------------------------

PREPARACIÓN PARA FUTURAS FASES

-----------------------------------

La arquitectura debe quedar preparada para agregar posteriormente:

- Vacunas

- Desparasitación

- Hospitalización

- Laboratorio

- Inventario

- Facturación

- WhatsApp

- Inteligencia Artificial

- CRM

- App móvil

- Sistema multiclínica

La estructura debe ser modular para facilitar futuras ampliaciones sin modificar el núcleo del sistema.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
