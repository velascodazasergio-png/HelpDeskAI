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

## 👥 Integrantes

| Nombre | Rol |
|--------|-----|
| **Sergio Velasco Daza** | Desarrollador |
| **Jonatan Sarmiento** | Desarrollador |

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

## 🖼️ Capturas de Pantalla

### Vista Principal del n8n
<!-- Agregar enlace de imagen aquí -->
![Vista Principal](https://i.ibb.co/gc0TskN/Captura-de-pantalla-2026-06-02-175021.png)

### Formulario de Incidencia
<!-- Agregar enlace de imagen aquí -->
![Formulario](https://i.ibb.co/wrYXY0kk/Captura-de-pantalla-2026-06-02-175951.png)

### Dashboard de Tickets
<!-- Agregar enlace de imagen aquí -->
![Dashboard](https://i.ibb.co/tMT2j5JL/Captura-de-pantalla-2026-06-02-180034.png)

### Notificación Telegram
<!-- Agregar enlace de imagen aquí -->
![Telegram](https://i.ibb.co/Xx6yL89h/Captura-de-pantalla-2026-06-02-180106.png)

---

## 🔄 JSON del Flujo N8N

> Importar este JSON directamente en N8N: **Settings → Import Workflow**

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "helpdesk/incidencia",
        "responseMode": "responseNode",
        "options": {
          "allowedOrigins": "*",
          "rawBody": false
        }
      },
      "id": "9d2e6ba3-e0a5-4708-a126-883106d3ea8d",
      "name": "📥 Recibir Incidencia Web",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [0, 0],
      "webhookId": "helpdesk-incidencia-webhook"
    },
    {
      "parameters": {
        "functionCode": "const body = $input.first().json.body || $input.first().json;\nconst required = ['nombre', 'correo', 'telefono', 'area', 'incidencia', 'prioridad', 'descripcion'];\nfor (const field of required) {\n  if (!body[field] || body[field].toString().trim() === '') {\n    throw new Error(`Campo requerido faltante: ${field}`);\n  }\n}\nconst emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\nif (!emailRegex.test(body.correo)) {\n  throw new Error('Correo electrónico inválido: ' + body.correo);\n}\nif (body.descripcion.trim().length < 10) {\n  throw new Error('Descripción demasiado corta');\n}\nconst ticketNumber = body.ticket_number || `TK-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*9999)}`;\nconst now = new Date();\nreturn [{ json: { ticket_number: ticketNumber, nombre: body.nombre.trim(), correo: body.correo.trim().toLowerCase(), telefono: body.telefono.trim(), area: body.area.trim(), incidencia: body.incidencia.trim(), prioridad: body.prioridad.trim(), descripcion: body.descripcion.trim(), estado: 'Abierto', timestamp_n8n: now.toISOString(), timestamp_original: body.timestamp || now.toISOString(), origen: body.origen || 'web', metadata: body.metadata || {} } }];"
      },
      "id": "543ba744-7c0d-4e6f-b23c-8d7e42d6432e",
      "name": "🔍 Validar y Enriquecer Datos",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [224, 0]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO tickets (ticket_number, nombre, correo, telefono, area, incidencia, prioridad, descripcion, estado, fecha_creacion) VALUES ('{{ $json.ticket_number }}', '{{ $json.nombre }}', '{{ $json.correo }}', '{{ $json.telefono }}', '{{ $json.area }}', '{{ $json.incidencia }}', '{{ $json.prioridad }}', '{{ $json.descripcion }}', 'Abierto', NOW()) RETURNING id, ticket_number, fecha_creacion;",
        "options": {}
      },
      "id": "01831eac-7939-474f-9c70-8fbc1016a818",
      "name": "💾 Guardar Ticket en PostgreSQL",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [432, 0],
      "credentials": {
        "postgres": { "id": "RHVs2sU2TaqHAW6z", "name": "Postgres account" }
      }
    },
    {
      "parameters": {
        "functionCode": "const dbResult = $input.first().json;\nconst ticketData = $node['🔍 Validar y Enriquecer Datos'].json;\nreturn [{ json: { ...ticketData, db_id: dbResult.id, db_fecha: dbResult.fecha_creacion } }];"
      },
      "id": "581b15e7-d528-480b-be44-4d58b2aa4af3",
      "name": "🔗 Combinar Datos Ticket + DB",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [656, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Authorization", "value": "=Bearer {{ $credentials.httpHeaderAuth.value }}" },
            { "name": "Content-Type", "value": "application/json" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\"model\":\"gpt-4o-mini\",\"temperature\":0.3,\"max_tokens\":500,\"response_format\":{\"type\":\"json_object\"},\"messages\":[{\"role\":\"system\",\"content\":\"Eres un sistema experto en soporte técnico IT. Analiza incidencias y responde ÚNICAMENTE en JSON válido con esta estructura exacta:\\n{\\\"categoria\\\": string, \\\"prioridad\\\": string, \\\"resumen\\\": string, \\\"sugerencia\\\": string, \\\"respuesta_usuario\\\": string}\\n\\nCATEGORÍAS VÁLIDAS: Hardware, Software, Red/Conectividad, Acceso/Seguridad, Periféricos, Comunicaciones, General\\nPRIORIDADES: Crítica, Alta, Media, Baja\\n\\nREGLAS:\\n1. resumen: máximo 100 palabras, tercera persona\\n2. sugerencia: accionable, máximo 50 palabras\\n3. respuesta_usuario: formal, empática, en español\"},{\"role\":\"user\",\"content\":\"=Analiza esta incidencia técnica:\\n\\nTipo: {{ $json.incidencia }}\\nÁrea afectada: {{ $json.area }}\\nPrioridad reportada: {{ $json.prioridad }}\\nDescripción: {{ $json.descripcion }}\\n\\nResponde en JSON.\"}]}",
        "options": { "timeout": 30000 }
      },
      "id": "e88d8840-2ab6-401e-a934-94dd98cebce0",
      "name": "🤖 Analizar con OpenAI GPT-4",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [880, 0],
      "credentials": {
        "httpHeaderAuth": { "id": "Ymyo8NQuiRrSb5Mp", "name": "Header Auth account" }
      }
    },
    {
      "parameters": {
        "functionCode": "const openaiResponse = $input.first().json;\nconst ticketData = $node['🔗 Combinar Datos Ticket + DB'].json;\nlet ia;\ntry {\n  const content = openaiResponse.choices[0].message.content;\n  const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();\n  ia = JSON.parse(cleaned);\n  if (!ia.categoria) ia.categoria = ticketData.incidencia;\n  if (!ia.prioridad) ia.prioridad = ticketData.prioridad;\n  if (!ia.resumen) ia.resumen = `Incidencia de ${ticketData.incidencia} en ${ticketData.area}`;\n  if (!ia.sugerencia) ia.sugerencia = 'Un técnico especializado revisará su caso';\n  if (!ia.respuesta_usuario) ia.respuesta_usuario = `Estimado/a ${ticketData.nombre}, su incidencia ${ticketData.ticket_number} fue registrada correctamente.`;\n} catch (error) {\n  ia = { categoria: ticketData.incidencia, prioridad: ticketData.prioridad, resumen: `Incidencia de ${ticketData.incidencia} reportada en ${ticketData.area}. Análisis manual requerido.`, sugerencia: 'Un técnico especializado revisará su caso y le contactará pronto.', respuesta_usuario: `Estimado/a ${ticketData.nombre}, su incidencia ${ticketData.ticket_number} ha sido registrada exitosamente.` };\n}\nreturn [{ json: { ...ticketData, ia: ia, categoria_ia: ia.categoria, resumen_ia: ia.resumen } }];"
      },
      "id": "0d7424f8-97f3-4118-b933-21c998f4b7a4",
      "name": "🧠 Procesar Respuesta IA",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [1104, 0]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "UPDATE tickets SET categoria_ia = '{{ $json.ia.categoria }}', resumen_ia = '{{ $json.ia.resumen }}' WHERE ticket_number = '{{ $json.ticket_number }}' RETURNING id, ticket_number, categoria_ia, estado;",
        "options": {}
      },
      "id": "4d259d60-7343-4c82-b4df-748551ca0405",
      "name": "📝 Actualizar Ticket con IA",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [1328, 0],
      "credentials": {
        "postgres": { "id": "RHVs2sU2TaqHAW6z", "name": "Postgres account" }
      }
    },
    {
      "parameters": {
        "functionCode": "const dbUpdate = $input.first().json;\nconst allData = $node['🧠 Procesar Respuesta IA'].json;\nreturn [{ json: { ...allData, db_updated: true } }];"
      },
      "id": "6967e194-78ac-4258-99af-cd6b07efe2ac",
      "name": "📦 Preparar Datos Finales",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [1552, 0]
    },
    {
      "parameters": {
        "chatId": "=8546238882",
        "text": "=🚨 NUEVA INCIDENCIA — HelpDesk AI\n\n🎫 Ticket: {{ $json.ticket_number }}\n⚡ Prioridad: {{ $json.prioridad }}\n📁 Área: {{ $json.area }}\n🔧 Tipo: {{ $json.incidencia }}\n\n👤 Usuario: {{ $json.nombre }}\n📧 {{ $json.correo }}\n📞 {{ $json.telefono }}\n\n🤖 Análisis IA:\n📂 Categoría: {{ $json.ia.categoria }}\n📋 Resumen: {{ $json.ia.resumen }}\n💡 Sugerencia: {{ $json.ia.sugerencia }}\n\n🕒 {{ $json.timestamp_n8n }}",
        "additionalFields": { "parse_mode": "Markdown" }
      },
      "id": "201be9c0-8a2a-4880-b051-4151b24fe278",
      "name": "📱 Notificar por Telegram",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [1744, 0],
      "credentials": {
        "telegramApi": { "id": "N0Ikg3qXuwhdEZXI", "name": "Telegram account" }
      }
    },
    {
      "parameters": {
        "functionCode": "const ticketData = $node['📦 Preparar Datos Finales'].json;\nreturn [{ json: { success: true, ticket_number: ticketData.ticket_number, mensaje: 'Incidencia registrada exitosamente. El equipo de soporte fue notificado por Telegram y recibirás confirmación por correo.', ia: { categoria: ticketData.ia.categoria, prioridad: ticketData.ia.prioridad, resumen: ticketData.ia.resumen, sugerencia: ticketData.ia.sugerencia, respuesta_usuario: ticketData.ia.respuesta_usuario }, timestamp: ticketData.timestamp_n8n } }];"
      },
      "id": "c34603ef-73a0-4217-9866-095de20edf70",
      "name": "📋 Preparar Respuesta Final",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [1984, 0]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify($json) }}",
        "options": {
          "responseCode": 200,
          "responseHeaders": {
            "entries": [
              { "name": "Content-Type", "value": "application/json" },
              { "name": "Access-Control-Allow-Origin", "value": "*" }
            ]
          }
        }
      },
      "id": "f05adb05-0afc-4859-ad40-8c45436e78ea",
      "name": "✅ Responder al Frontend",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [2208, 0]
    }
  ],
  "connections": {
    "📥 Recibir Incidencia Web": { "main": [[{ "node": "🔍 Validar y Enriquecer Datos", "type": "main", "index": 0 }]] },
    "🔍 Validar y Enriquecer Datos": { "main": [[{ "node": "💾 Guardar Ticket en PostgreSQL", "type": "main", "index": 0 }]] },
    "💾 Guardar Ticket en PostgreSQL": { "main": [[{ "node": "🔗 Combinar Datos Ticket + DB", "type": "main", "index": 0 }]] },
    "🔗 Combinar Datos Ticket + DB": { "main": [[{ "node": "🤖 Analizar con OpenAI GPT-4", "type": "main", "index": 0 }]] },
    "🤖 Analizar con OpenAI GPT-4": { "main": [[{ "node": "🧠 Procesar Respuesta IA", "type": "main", "index": 0 }]] },
    "🧠 Procesar Respuesta IA": { "main": [[{ "node": "📝 Actualizar Ticket con IA", "type": "main", "index": 0 }]] },
    "📝 Actualizar Ticket con IA": { "main": [[{ "node": "📦 Preparar Datos Finales", "type": "main", "index": 0 }]] },
    "📦 Preparar Datos Finales": { "main": [[{ "node": "📱 Notificar por Telegram", "type": "main", "index": 0 }]] },
    "📱 Notificar por Telegram": { "main": [[{ "node": "📋 Preparar Respuesta Final", "type": "main", "index": 0 }]] },
    "📋 Preparar Respuesta Final": { "main": [[{ "node": "✅ Responder al Frontend", "type": "main", "index": 0 }]] }
  },
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "2e5b97dfe6429c931e6826b83b7918fd802287082bc2748fa7811d055cdd6d33"
  }
}
```

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
├── n8n/
│   ├── n8n-workflow.json  # Flujo N8N listo para importar
│   └── database.sql       # Script de creación de base de datos
│
└── README.md
```

---

## 🚀 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/helpdesk-ai.git
cd helpdesk-ai
```

### 2. Abrir en el navegador

```bash
# Con servidor local (recomendado)
npx serve .
# O con Python
python3 -m http.server 8080
```

### 3. Configurar N8N

```bash
# Instalar N8N
npm install -g n8n
# O con Docker
docker run -d --name n8n -p 5678:5678 n8nio/n8n
```

Luego en N8N: **Settings → Import Workflow** → subir `n8n/n8n-workflow.json`

Configurar credenciales:
- PostgreSQL (host, port, database, user, password)
- OpenAI API Key
- Telegram Bot Token + Chat ID
- SMTP (Gmail u otro)

Actualizar la URL del webhook en `js/api.js`:
```javascript
const WEBHOOK_URL = "https://tu-n8n.com/webhook/helpdesk/incidencia";
```

### 4. Crear la base de datos

```bash
psql -U postgres -d helpdesk -f n8n/database.sql
```

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
| HTML5 | — | Estructura semántica |
| CSS3 | — | Estilos y animaciones |
| JavaScript | ES2020 | Lógica del cliente |
| TypeScript | 5.x | Tipado y validaciones |
| N8N | 1.x | Automatización |
| OpenAI GPT-4o-mini | — | Análisis IA |
| PostgreSQL | 14+ | Base de datos |
| Telegram Bot API | — | Notificaciones |

---

## 📄 Licencia

MIT License — Libre para uso educativo y comercial.

---

*HelpDesk AI — Gestión inteligente de incidencias técnicas* 🚀