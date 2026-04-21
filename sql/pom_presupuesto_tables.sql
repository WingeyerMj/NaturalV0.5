-- ═══════════════════════════════════════════════════════════
-- NATURALFOOD - POM Avanzado: Presupuesto Persistente
-- Stores the full projection matrix in the database
-- ═══════════════════════════════════════════════════════════

-- 1. Parent table: one row per saved budget cycle
CREATE TABLE IF NOT EXISTS pom_presupuestos (
    id SERIAL PRIMARY KEY,
    ciclo VARCHAR(20) NOT NULL,
    total_jornales_proyectados NUMERIC(12,2) DEFAULT 0,
    total_jornales_reales NUMERIC(12,2) DEFAULT 0,
    total_jornales_sugeridos NUMERIC(12,2) DEFAULT 0,
    desvio_total NUMERIC(8,2) DEFAULT NULL,
    notas TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ciclo)
);

-- 2. Detail table: one row per cuartel × labor projection
CREATE TABLE IF NOT EXISTS pom_presupuesto_detalle (
    id SERIAL PRIMARY KEY,
    presupuesto_id INTEGER NOT NULL REFERENCES pom_presupuestos(id) ON DELETE CASCADE,
    key VARCHAR(500) NOT NULL,
    finca VARCHAR(255),
    predio VARCHAR(255),
    cuartel VARCHAR(100),
    hectareas NUMERIC(10,2) DEFAULT 0,
    plantas INTEGER DEFAULT 0,
    variedad VARCHAR(255) DEFAULT '',
    labor_id VARCHAR(100),
    labor_nombre VARCHAR(255),
    labor_categoria VARCHAR(100),
    unidad_base VARCHAR(50) DEFAULT 'plantas',
    rendimiento_original NUMERIC(10,2) DEFAULT 0,
    jornales_original NUMERIC(10,2) DEFAULT 0,
    rendimiento_proyectado NUMERIC(10,2) DEFAULT 0,
    jornales_proyectados NUMERIC(10,2) DEFAULT 0,
    rendimiento_real NUMERIC(10,2) DEFAULT NULL,
    jornales_reales NUMERIC(10,2) DEFAULT NULL,
    desvio_jornales NUMERIC(8,2) DEFAULT NULL,
    rendimiento_sugerido NUMERIC(10,2) DEFAULT NULL,
    jornales_sugeridos NUMERIC(10,2) DEFAULT NULL,
    fecha_inicio VARCHAR(20),
    fecha_fin VARCHAR(20),
    fuente VARCHAR(50) DEFAULT 'excel',
    editado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_pom_detalle_presupuesto ON pom_presupuesto_detalle(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_pom_detalle_key ON pom_presupuesto_detalle(key);
CREATE INDEX IF NOT EXISTS idx_pom_presupuestos_ciclo ON pom_presupuestos(ciclo);
