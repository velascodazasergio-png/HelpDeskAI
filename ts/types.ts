/**
 * HelpDesk AI — types.ts
 * TypeScript type definitions for the entire system
 */

// ===== ENUMS =====

export enum TicketPriority {
  BAJA    = 'Baja',
  MEDIA   = 'Media',
  ALTA    = 'Alta',
  CRITICA = 'Critica'
}

export enum TicketStatus {
  ABIERTO     = 'Abierto',
  EN_PROGRESO = 'En progreso',
  EN_ESPERA   = 'En espera',
  RESUELTO    = 'Resuelto',
  CERRADO     = 'Cerrado'
}

export enum IncidentType {
  HARDWARE      = 'Hardware',
  SOFTWARE      = 'Software',
  RED           = 'Red',
  SEGURIDAD     = 'Seguridad',
  EMAIL         = 'Email',
  IMPRESORAS    = 'Impresoras',
  TELEFONIA     = 'Telefonia',
  ACCESOS       = 'Accesos',
  BASE_DE_DATOS = 'Base de Datos',
  OTRO          = 'Otro'
}

export enum Area {
  SISTEMAS        = 'Sistemas',
  ADMINISTRACION  = 'Administracion',
  CONTABILIDAD    = 'Contabilidad',
  VENTAS          = 'Ventas',
  RRHH            = 'Recursos Humanos',
  PRODUCCION      = 'Produccion',
  LOGISTICA       = 'Logistica',
  GERENCIA        = 'Gerencia',
  OTRO            = 'Otro'
}

// ===== FORM DATA =====

/**
 * Raw form input data from the HTML form
 */
export interface FormInput {
  nombre:      string;
  correo:      string;
  telefono:    string;
  area:        Area | string;
  incidencia:  IncidentType | string;
  prioridad:   TicketPriority | string;
  descripcion: string;
}

/**
 * Validated and sanitized form data
 */
export interface ValidatedFormData extends FormInput {
  nombre:      string; // Trimmed, min 3 chars
  correo:      string; // Valid email format
  telefono:    string; // Valid phone format
  descripcion: string; // Min 30 chars
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid:  boolean;
  errors:   Record<string, string>;
  warnings: Record<string, string>;
}

/**
 * Individual field validation result
 */
export interface FieldValidation {
  isValid:  boolean;
  error?:   string;
  warning?: string;
}

// ===== API PAYLOAD =====

/**
 * Payload sent to the N8N Webhook
 */
export interface WebhookPayload extends ValidatedFormData {
  ticket_number: string;
  timestamp:     string;
  origen:        string;
  version:       string;
  metadata: {
    user_agent: string;
    language:   string;
    timezone:   string;
    url:        string;
  };
}

// ===== AI ANALYSIS =====

/**
 * AI analysis result from OpenAI GPT
 */
export interface AIAnalysis {
  categoria:         string;    // Auto-detected category
  prioridad:         TicketPriority; // AI-determined priority
  resumen:           string;    // Executive summary
  sugerencia:        string;    // Initial solution suggestion
  respuesta_usuario: string;    // Auto-generated user response
  confianza?:        number;    // Confidence score (0-1)
  tags?:             string[];  // Additional tags
}

/**
 * N8N AI node prompt structure
 */
export interface AIPromptData {
  incidencia:  string;
  descripcion: string;
  area:        string;
  prioridad:   string;
}

// ===== TICKET =====

/**
 * Full ticket object as stored in database
 */
export interface Ticket {
  id:              number;
  ticket_number:   string;
  nombre:          string;
  correo:          string;
  telefono:        string;
  area:            string;
  incidencia:      string;
  prioridad:       TicketPriority;
  descripcion:     string;
  categoria_ia?:   string;
  resumen_ia?:     string;
  estado:          TicketStatus;
  fecha_creacion:  string;  // ISO 8601
  fecha_resolucion?: string;
  asignado_a?:     string;
  comentarios?:    TicketComment[];
}

/**
 * Ticket comment/note
 */
export interface TicketComment {
  id:          number;
  ticket_id:   number;
  autor:       string;
  contenido:   string;
  fecha:       string;
  tipo:        'nota' | 'actualizacion' | 'resolucion';
}

// ===== API RESPONSES =====

/**
 * Response from the webhook after ticket creation
 */
export interface WebhookResponse {
  success:       boolean;
  ticket_number: string;
  message:       string;
  ia?:           AIAnalysis;
  timestamp:     string;
}

/**
 * Response when listing tickets
 */
export interface TicketsListResponse {
  tickets: Ticket[];
  total:   number;
  page:    number;
  limit:   number;
}

/**
 * Generic API error response
 */
export interface APIError {
  success:  false;
  message:  string;
  code?:    string;
  status?:  number;
  details?: unknown;
}

// ===== TELEGRAM =====

/**
 * Telegram notification message structure
 */
export interface TelegramMessage {
  chat_id:    string | number;
  text:       string;
  parse_mode: 'HTML' | 'Markdown' | 'MarkdownV2';
}

/**
 * Formatted Telegram ticket notification
 */
export interface TelegramTicketNotification {
  ticket:   Ticket;
  ia:       AIAnalysis;
  message:  string;  // Pre-formatted Telegram message
}

// ===== N8N WORKFLOW =====

/**
 * N8N workflow node configuration
 */
export interface N8NNode {
  id:          string;
  name:        string;
  type:        string;
  position:    [number, number];
  parameters:  Record<string, unknown>;
}

/**
 * N8N workflow connection
 */
export interface N8NConnection {
  node:  string;
  type:  string;
  index: number;
}

/**
 * Complete N8N workflow structure
 */
export interface N8NWorkflow {
  name:        string;
  nodes:       N8NNode[];
  connections: Record<string, { main: N8NConnection[][] }>;
  active:      boolean;
  settings:    Record<string, unknown>;
  tags:        string[];
}

// ===== DATABASE =====

/**
 * Database ticket row (PostgreSQL/MySQL)
 */
export interface DBTicket {
  id:              number;
  ticket_number:   string;      // VARCHAR(20) UNIQUE
  nombre:          string;      // VARCHAR(100)
  correo:          string;      // VARCHAR(150)
  telefono:        string;      // VARCHAR(20)
  area:            string;      // VARCHAR(100)
  incidencia:      string;      // VARCHAR(100)
  prioridad:       string;      // ENUM
  descripcion:     string;      // TEXT
  categoria_ia:    string | null;  // VARCHAR(100)
  resumen_ia:      string | null;  // TEXT
  estado:          string;      // ENUM
  fecha_creacion:  Date;        // TIMESTAMP
}

// ===== UI STATE =====

/**
 * Dashboard filter state
 */
export interface DashboardFilters {
  estado:    string;
  prioridad: string;
  categoria: string;
}

/**
 * Dashboard component state
 */
export interface DashboardState {
  tickets:    Ticket[];
  filtered:   Ticket[];
  view:       'grid' | 'list';
  searchQuery: string;
  filters:    DashboardFilters;
  loading:    boolean;
  error:      string | null;
}

// ===== CONFIG =====

/**
 * Application configuration
 */
export interface AppConfig {
  webhookUrl:    string;
  ticketsApiUrl: string;
  timeout:       number;
  version:       string;
  mode:          'development' | 'production';
}
