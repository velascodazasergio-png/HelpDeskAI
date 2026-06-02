-- =====================================================
-- HelpDesk AI — database.sql
-- Script de inicialización para PostgreSQL
-- Se ejecuta automáticamente al crear el contenedor
-- =====================================================

-- Crear tabla de tickets
CREATE TABLE IF NOT EXISTS tickets (
    id              SERIAL PRIMARY KEY,
    ticket_number   VARCHAR(20)  UNIQUE NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    correo          VARCHAR(150) NOT NULL,
    telefono        VARCHAR(20),
    area            VARCHAR(100),
    incidencia      VARCHAR(100),
    prioridad       VARCHAR(20)  CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Critica')),
    descripcion     TEXT,
    categoria_ia    VARCHAR(100),
    resumen_ia      TEXT,
    estado          VARCHAR(30)  DEFAULT 'Abierto'
                                 CHECK (estado IN ('Abierto', 'En progreso', 'En espera', 'Resuelto', 'Cerrado')),
    fecha_creacion  TIMESTAMP    DEFAULT NOW(),
    fecha_resolucion TIMESTAMP   NULL
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_tickets_numero   ON tickets (ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_estado   ON tickets (estado);
CREATE INDEX IF NOT EXISTS idx_tickets_prioridad ON tickets (prioridad);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha    ON tickets (fecha_creacion DESC);

-- Datos de ejemplo (opcional — puedes borrar este bloque)
INSERT INTO tickets (ticket_number, nombre, correo, telefono, area, incidencia, prioridad, descripcion, categoria_ia, resumen_ia, estado)
VALUES
  ('TK-DEMO-0001', 'Carlos Ramírez', 'carlos@empresa.com', '300 123 4567', 'Sistemas', 'Red', 'Alta',
   'Sin conexión a internet en el piso 3.', 'Red / Conectividad', 'Falla de red detectada en piso 3.', 'En progreso'),
  ('TK-DEMO-0002', 'Ana Gómez', 'ana@empresa.com', '310 987 6543', 'Contabilidad', 'Software', 'Media',
   'El sistema de nómina no abre desde ayer.', 'Software / Aplicaciones', 'Error de timeout en sistema de nómina.', 'Abierto')
ON CONFLICT (ticket_number) DO NOTHING;