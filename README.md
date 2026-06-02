# 🎫 HelpDesk AI — Sistema de Gestión de Incidencias

> Sistema Web Automatizado de Gestión de Incidencias y Soporte Técnico con Inteligencia Artificial




[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![N8N](https://img.shields.io/badge/N8N-EA4B71?style=flat&logo=n8n&logoColor=white)](https://n8n.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?style=flat&logo=openai&logoColor=white)](https://openai.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=flat&logo=telegram&logoColor=white)](https://telegram.org/)

---

## 📋 Descripción

HelpDesk AI es una plataforma empresarial completa para la gestión de incidencias técnicas que integra:

- **Formulario web moderno** para registro de incidencias
- **N8N** como motor de automatización y orquestación
- **OpenAI GPT-4** para clasificación automática con IA
- **PostgreSQL** para almacenamiento persistente
- **Telegram Bot** para notificaciones en tiempo real
- **Email SMTP** para confirmación al usuario

---

## 🌟 Características

| Característica | Descripción |
|----------------|-------------|
| 🤖 **IA Automática** | Clasificación, priorización y resumen por GPT-4o-mini |
| 📱 **Notificaciones Telegram** | Alertas instantáneas al equipo de soporte |
| 📧 **Email Automático** | Confirmación HTML al usuario con análisis IA |
| 🎫 **Tickets Únicos** | Generación automática de número de ticket |
| 📊 **Dashboard** | Panel de seguimiento con filtros y búsqueda |
| ✅ **Validación TypeScript** | Validaciones robustas en frontend |
| 🌙 **Dark Mode** | Diseño corporativo oscuro moderno |
| 📱 **Mobile First** | Completamente responsive |

---

## 🗂️ Estructura del Proyecto

```
helpdesk-system/
│
├── index.html          # Landing page principal
├── form.html           # Formulario de registro de incidencias
├── success.html        # Página de confirmación post-envío
├── tickets.html        # Dashboard de seguimiento de tickets
│
├── css/
│   ├── styles.css      # Estilos globales (variables, navbar, landing)
│   ├── form.css        # Estilos del formulario y success page
│   └── dashboard.css   # Estilos del dashboard de tickets
│
├── js/
│   ├── app.js              # Scripts globales (navbar, animaciones, utils)
│   ├── api.js              # Módulo de comunicación con N8N
│   ├── dashboard.js        # Lógica del dashboard de tickets
│   └── form-compiled.js    # Validaciones TypeScript compiladas
│
├── ts/
│   ├── types.ts        # Definiciones de tipos TypeScript
│   ├── form.ts         # Validaciones y envío del formulario
│   └── ticket.ts       # Lógica de consulta y gestión de tickets
│
├── assets/
│   └── (logos, imágenes)
│
├── docs/
│   ├── arquitectura.md # Arquitectura completa del sistema
│   ├── flujo-n8n.md    # Documentación del flujo de N8N
│   └── ia.md           # Documentación del módulo de IA
│
├── n8n/
│   ├── n8n-workflow.json  # Flujo N8N listo para importar
│   └── database.sql       # Script de creación de base de datos
│
└── README.md           # Este archivo
```

---

## 🚀 Inicio Rápido

### 1. Clonar / Descargar el proyecto

```bash
git clone https://github.com/tu-usuario/helpdesk-ai.git
cd helpdesk-ai
```

### 2. Abrir en el navegador (modo demo)

El proyecto funciona directamente sin backend. En modo demo, simula las llamadas a N8N con respuestas mock.

```bash
# Con servidor local (recomendado)
npx serve .
# O con Python
python3 -m http.server 8080
# O simplemente abrir index.html en el navegador
```

### 3. Configurar N8N (para producción)

**a) Instalar N8N:**
```bash
npm install -g n8n
# o con Docker:
docker run -d --name n8n -p 5678:5678 n8nio/n8n
```

**b) Importar el workflow:**
1. Abrir N8N: `http://localhost:5678`
2. Settings → Import Workflow
3. Subir: `n8n/n8n-workflow.json`

**c) Configurar credenciales en N8N:**
- ➕ PostgreSQL (host, port, database, user, password)
- ➕ OpenAI API Key
- ➕ Telegram Bot Token + Chat ID
- ➕ SMTP (Gmail u otro proveedor)

**d) Actualizar la URL del webhook en el frontend:**

Editar `js/api.js` y `js/form-compiled.js`:
```javascript
// Cambiar esta línea:
const WEBHOOK_URL = "AQUI_WEBHOOK_N8N";
// Por la URL real de tu N8N:
const WEBHOOK_URL = "https://tu-n8n.com/webhook/helpdesk/incidencia";
```

### 4. Configurar la base de datos

```bash
# Conectar a PostgreSQL y ejecutar:
psql -U postgres -d helpdesk -f n8n/database.sql
```

---

## ⚙️ Configuración de Servicios

### OpenAI

1. Ir a [platform.openai.com](https://platform.openai.com)
2. API Keys → Create new secret key
3. Configurar en N8N → Credentials → "OpenAI API" o "HTTP Header Auth"

### Telegram Bot

1. Abrir Telegram y buscar `@BotFather`
2. Enviar `/newbot`
3. Seguir instrucciones y guardar el token
4. Agregar el bot al grupo de soporte
5. Obtener Chat ID:
   ```
   https://api.telegram.org/bot{TU_TOKEN}/getUpdates
   ```
6. Configurar en N8N → Credentials → Telegram API

### Gmail SMTP

1. Google Account → Security → 2-Step Verification → App Passwords
2. Generar contraseña para "Mail"
3. Configurar en N8N → Credentials → SMTP:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - User: `tu-correo@gmail.com`
   - Pass: `contraseña-de-app`

---

## 🏗️ Arquitectura

```
Usuario Web → form.html → POST JSON → Webhook N8N
                                           ↓
                                    Validar datos
                                           ↓
                                    PostgreSQL INSERT
                                           ↓
                                    OpenAI GPT-4o-mini
                                           ↓
                                    PostgreSQL UPDATE (IA)
                                           ↓
                                 ┌─────────┴──────────┐
                                 ↓                    ↓
                           Telegram Bot          Email SMTP
                                 └─────────┬──────────┘
                                           ↓
                                 Respuesta JSON → Frontend
                                           ↓
                                    success.html
```

---

## 📡 API Reference

### POST `/webhook/helpdesk/incidencia`

**Request:**
```json
{
  "ticket_number": "TK-ABC123-0042",
  "nombre": "Carlos Ramírez",
  "correo": "carlos@empresa.com",
  "telefono": "+57 300 123 4567",
  "area": "Infraestructura",
  "incidencia": "Red / Conectividad",
  "prioridad": "Alta",
  "descripcion": "Descripción detallada del problema...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "origen": "web"
}
```

**Response:**
```json
{
  "success": true,
  "ticket_number": "TK-ABC123-0042",
  "mensaje": "Incidencia registrada exitosamente.",
  "ia": {
    "categoria": "Red / Conectividad",
    "prioridad": "Alta",
    "resumen": "Falla de conectividad detectada...",
    "sugerencia": "Verificar switch principal...",
    "respuesta_usuario": "Estimado Carlos, su incidencia fue registrada..."
  }
}
```

---

## 🔒 Seguridad

- ✅ Validación dual: cliente (TypeScript) + servidor (N8N)
- ✅ Sanitización de HTML para prevención de XSS
- ✅ HTTPS obligatorio en producción
- ✅ Credenciales almacenadas en N8N Credential Store (encriptadas)
- ✅ Usuario PostgreSQL con permisos mínimos
- ⚠️ Agregar rate limiting en producción (nginx o N8N)
- ⚠️ Configurar CORS apropiadamente en N8N

---

## 📊 Tecnologías Utilizadas

| Tecnología | Versión | Uso |
|------------|---------|-----|
| HTML5 | - | Estructura semántica |
| CSS3 | - | Estilos y animaciones |
| JavaScript | ES2020 | Lógica del cliente |
| TypeScript | 5.x | Tipado y validaciones |
| N8N | 1.x | Automatización |
| OpenAI GPT-4o-mini | - | Análisis IA |
| PostgreSQL | 14+ | Base de datos |
| Telegram Bot API | - | Notificaciones |
| Google Fonts | - | Tipografía (Syne + DM Sans) |

---

## 📖 Documentación

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](docs/arquitectura.md) | Diseño completo del sistema |
| [Flujo N8N](docs/flujo-n8n.md) | Documentación nodo por nodo |
| [Módulo IA](docs/ia.md) | Configuración OpenAI y prompts |

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crear rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

---

## 📄 Licencia

MIT License — Libre para uso educativo y comercial.

---

## 👨‍💻 Autor

Desarrollado como proyecto educativo de integración Full Stack + IA + Automatización.

**Stack:** HTML5 + CSS3 + TypeScript + N8N + OpenAI + PostgreSQL + Telegram

---

*HelpDesk AI — Gestión inteligente de incidencias técnicas* 🚀
