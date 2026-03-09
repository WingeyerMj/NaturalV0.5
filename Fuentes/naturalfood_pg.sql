-- ═══════════════════════════════════════════════════════════
-- NATURALFOOD - Base de Datos PostgreSQL
-- ═══════════════════════════════════════════════════════════

-- extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- Tipos ENUM
-- ═══════════════════════════════════════════════════════════
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Administrador', 'Ingeniero', 'RRHH', 'Carga', 'Sub-Admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE active_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_category AS ENUM ('Insumo', 'Herramienta', 'Otro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('alta', 'media', 'baja');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_status AS ENUM ('pendiente', 'en_progreso', 'completado', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM ('activo', 'vencido', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ═══════════════════════════════════════════════════════════
-- Función para actualización automática de updated_at
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ═══════════════════════════════════════════════════════════
-- Tabla: users
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    NOT NULL UNIQUE,
  password      VARCHAR(255)    NOT NULL,
  role          user_role       NOT NULL DEFAULT 'Sub-Admin',
  avatar        VARCHAR(10)     NOT NULL DEFAULT '',
  active        SMALLINT        NOT NULL DEFAULT 1,
  pending       SMALLINT        NOT NULL DEFAULT 0,
  registered_at TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  approved_at   TIMESTAMP       DEFAULT NULL,
  last_login    TIMESTAMP       DEFAULT NULL,
  created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- Tablas de Administración
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_fincas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    ubicacion VARCHAR(255) DEFAULT '',
    hectareas DECIMAL(10,2) DEFAULT 0,
    encargado VARCHAR(255) DEFAULT '',
    telefono VARCHAR(50) DEFAULT '',
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_fincas_updated_at ON admin_fincas;
CREATE TRIGGER update_fincas_updated_at BEFORE UPDATE ON admin_fincas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS admin_predios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    finca_id INT REFERENCES admin_fincas(id) ON DELETE SET NULL,
    superficie DECIMAL(10,2) DEFAULT 0,
    variedad VARCHAR(255) DEFAULT '',
    tipo_suelo VARCHAR(255) DEFAULT '',
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_predios_updated_at ON admin_predios;
CREATE TRIGGER update_predios_updated_at BEFORE UPDATE ON admin_predios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS admin_cuarteles (
    id SERIAL PRIMARY KEY,
    numero INT NOT NULL,
    predio_id INT REFERENCES admin_predios(id) ON DELETE SET NULL,
    superficie DECIMAL(10,2) DEFAULT 0,
    variedad VARCHAR(255) DEFAULT '',
    hileras INT DEFAULT 0,
    plantas_por_hilera INT DEFAULT 0,
    sistema_conduccion VARCHAR(255) DEFAULT '',
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_cuarteles_updated_at ON admin_cuarteles;
CREATE TRIGGER update_cuarteles_updated_at BEFORE UPDATE ON admin_cuarteles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS admin_faenas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100) DEFAULT '',
    duracion_estimada VARCHAR(50) DEFAULT '',
    costo_estimado DECIMAL(12,2) DEFAULT 0,
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_faenas_updated_at ON admin_faenas;
CREATE TRIGGER update_faenas_updated_at BEFORE UPDATE ON admin_faenas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS admin_labor (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    faena_id INT REFERENCES admin_faenas(id) ON DELETE SET NULL,
    tipo VARCHAR(100) DEFAULT '',
    descripcion TEXT,
    unidad_medida VARCHAR(50) DEFAULT '',
    costo_unitario DECIMAL(12,2) DEFAULT 0,
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_labor_updated_at ON admin_labor;
CREATE TRIGGER update_labor_updated_at BEFORE UPDATE ON admin_labor FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    dni VARCHAR(20) DEFAULT '',
    legajo VARCHAR(50) DEFAULT '',
    cargo VARCHAR(100) DEFAULT '',
    finca VARCHAR(255) DEFAULT '',
    telefono VARCHAR(50) DEFAULT '',
    fecha_ingreso DATE,
    salario DECIMAL(12,2) DEFAULT 0,
    notas TEXT,
    status active_status DEFAULT 'active',
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_empleados_updated_at ON empleados;
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS admin_bodegas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    finca_id INT REFERENCES admin_fincas(id) ON DELETE SET NULL,
    ubicacion VARCHAR(255) DEFAULT '',
    capacidad VARCHAR(100) DEFAULT '',
    tipo VARCHAR(100) DEFAULT '',
    encargado VARCHAR(255) DEFAULT '',
    telefono VARCHAR(50) DEFAULT '',
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_bodegas_updated_at ON admin_bodegas;
CREATE TRIGGER update_bodegas_updated_at BEFORE UPDATE ON admin_bodegas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS admin_productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria product_category DEFAULT 'Insumo',
    bodega_id INT REFERENCES admin_bodegas(id) ON DELETE SET NULL,
    unidad VARCHAR(50) DEFAULT 'unidades',
    precio DECIMAL(12,2) DEFAULT 0,
    stock DECIMAL(12,2) DEFAULT 0,
    proveedor VARCHAR(255) DEFAULT '',
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_productos_updated_at ON admin_productos;
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON admin_productos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS trabajo_campo_logs (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    finca_id INT NOT NULL REFERENCES admin_fincas(id) ON DELETE CASCADE,
    predio_id INT NOT NULL REFERENCES admin_predios(id) ON DELETE CASCADE,
    cuartel_id INT NOT NULL REFERENCES admin_cuarteles(id) ON DELETE CASCADE,
    faena_id INT NOT NULL REFERENCES admin_faenas(id) ON DELETE CASCADE,
    labor_id INT REFERENCES admin_labor(id) ON DELETE SET NULL,
    empleado_id INT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    cantidad DECIMAL(10,2) DEFAULT 0,
    unidad VARCHAR(50) DEFAULT 'horas',
    costo_unitario DECIMAL(12,2) DEFAULT 0,
    total_costo DECIMAL(12,2) DEFAULT 0,
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_logs_updated_at ON trabajo_campo_logs;
CREATE TRIGGER update_logs_updated_at BEFORE UPDATE ON trabajo_campo_logs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS trabajo_campo_insumos (
    id SERIAL PRIMARY KEY,
    log_id INT NOT NULL REFERENCES trabajo_campo_logs(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES admin_productos(id) ON DELETE CASCADE,
    cantidad DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trabajo_campo_herramientas (
    id SERIAL PRIMARY KEY,
    log_id INT NOT NULL REFERENCES trabajo_campo_logs(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES admin_productos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_institucional (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) DEFAULT '',
    direccion VARCHAR(255) DEFAULT '',
    telefono VARCHAR(50) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    contacto VARCHAR(255) DEFAULT '',
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_institucional_updated_at ON admin_institucional;
CREATE TRIGGER update_institucional_updated_at BEFORE UPDATE ON admin_institucional FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS admin_zonas_riego (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    finca_id INT,
    superficie DECIMAL(10,2) DEFAULT 0,
    tipo_riego VARCHAR(100) DEFAULT '',
    caudal VARCHAR(50) DEFAULT '',
    frecuencia VARCHAR(100) DEFAULT '',
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_zonas_riego_updated_at ON admin_zonas_riego;
CREATE TRIGGER update_zonas_riego_updated_at BEFORE UPDATE ON admin_zonas_riego FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS admin_sistema_riego (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) DEFAULT '',
    marca VARCHAR(100) DEFAULT '',
    modelo VARCHAR(100) DEFAULT '',
    capacidad VARCHAR(100) DEFAULT '',
    zona_riego_id INT REFERENCES admin_zonas_riego(id) ON DELETE SET NULL,
    fecha_instalacion DATE,
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_sistema_riego_updated_at ON admin_sistema_riego;
CREATE TRIGGER update_sistema_riego_updated_at BEFORE UPDATE ON admin_sistema_riego FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS admin_planificacion (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(100) DEFAULT '',
    fecha_inicio DATE,
    fecha_fin DATE,
    responsable VARCHAR(255) DEFAULT '',
    prioridad priority_level DEFAULT 'media',
    estado plan_status DEFAULT 'pendiente',
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_planificacion_updated_at ON admin_planificacion;
CREATE TRIGGER update_planificacion_updated_at BEFORE UPDATE ON admin_planificacion FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS admin_contratos (
    id SERIAL PRIMARY KEY,
    empleado_id INT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    numero_contrato VARCHAR(100) DEFAULT '',
    tipo_contrato VARCHAR(100) DEFAULT '',
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    salario_acordado DECIMAL(12,2) DEFAULT 0,
    estado contract_status DEFAULT 'activo',
    notas TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_contratos_updated_at ON admin_contratos;
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON admin_contratos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- Funciones (Equivalentes a Procedimientos MySQL)
-- ═══════════════════════════════════════════════════════════

-- Registro
CREATE OR REPLACE FUNCTION sp_register_user(
  p_name     VARCHAR(100),
  p_email    VARCHAR(150),
  p_password VARCHAR(255)
) RETURNS TABLE(status TEXT, user_id INT, message TEXT) AS $$
DECLARE
    v_exists INT;
    v_avatar TEXT;
    v_new_id INT;
BEGIN
    SELECT COUNT(*) INTO v_exists FROM users WHERE email = p_email;
    IF v_exists > 0 THEN
        RETURN QUERY SELECT 'ERROR'::TEXT, NULL::INT, 'Este correo ya está registrado.'::TEXT;
    ELSE
        -- Avatar logic simplified for SQL
        v_avatar := UPPER(SUBSTRING(SPLIT_PART(p_name, ' ', 1), 1, 1) || SUBSTRING(SPLIT_PART(p_name, ' ', 2), 1, 1));
        
        INSERT INTO users (name, email, password, role, avatar, active, pending, registered_at)
        VALUES (p_name, p_email, p_password, 'Sub-Admin', v_avatar, 0, 1, CURRENT_TIMESTAMP)
        RETURNING id INTO v_new_id;
        
        RETURN QUERY SELECT 'OK'::TEXT, v_new_id, 'Registro exitoso. Pendiente de aprobación.'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Autenticación
CREATE OR REPLACE FUNCTION sp_authenticate(
  p_email    VARCHAR(150),
  p_password VARCHAR(255)
) RETURNS TABLE(status TEXT, id INT, name VARCHAR, email VARCHAR, role user_role, avatar VARCHAR, active SMALLINT, message TEXT) AS $$
DECLARE
    v_user record;
BEGIN
    SELECT * INTO v_user
    FROM users
    WHERE users.email = p_email AND users.password = p_password
    LIMIT 1;
    
    IF v_user.id IS NULL THEN
        RETURN QUERY SELECT 'ERROR'::TEXT, NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::user_role, NULL::VARCHAR, NULL::SMALLINT, 'Credenciales inválidas.'::TEXT;
    ELSIF v_user.pending = 1 AND v_user.active = 0 THEN
        RETURN QUERY SELECT 'PENDING'::TEXT, NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::user_role, NULL::VARCHAR, NULL::SMALLINT, 'Tu cuenta está pendiente de aprobación.'::TEXT;
    ELSIF v_user.active = 0 THEN
        RETURN QUERY SELECT 'INACTIVE'::TEXT, NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::user_role, NULL::VARCHAR, NULL::SMALLINT, 'Tu cuenta está desactivada.'::TEXT;
    ELSE
        UPDATE users SET last_login = NOW() WHERE users.id = v_user.id;
        RETURN QUERY SELECT 'OK'::TEXT, v_user.id, v_user.name, v_user.email, v_user.role, v_user.avatar, v_user.active, 'Acceso concedido.'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Aprobar
CREATE OR REPLACE FUNCTION sp_approve_user(p_user_id INT) 
RETURNS TABLE(status TEXT, message TEXT) AS $$
BEGIN
    UPDATE users 
    SET active = 1, pending = 0, approved_at = NOW()
    WHERE id = p_user_id AND pending = 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT 'OK'::TEXT, 'Usuario aprobado exitosamente.'::TEXT;
    ELSE
        RETURN QUERY SELECT 'ERROR'::TEXT, 'Usuario no encontrado o ya aprobado.'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Rechazar
CREATE OR REPLACE FUNCTION sp_reject_user(p_user_id INT) 
RETURNS TABLE(status TEXT, message TEXT) AS $$
BEGIN
    DELETE FROM users
    WHERE id = p_user_id AND pending = 1 AND active = 0;
    
    IF FOUND THEN
        RETURN QUERY SELECT 'OK'::TEXT, 'Solicitud rechazada.'::TEXT;
    ELSE
        RETURN QUERY SELECT 'ERROR'::TEXT, 'Usuario no encontrado o ya procesado.'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Actualizar
CREATE OR REPLACE FUNCTION sp_update_user(
  p_id       INT,
  p_name     VARCHAR(100),
  p_email    VARCHAR(150),
  p_role     VARCHAR(50),
  p_password VARCHAR(255),
  p_active   SMALLINT
) RETURNS TABLE(status TEXT, message TEXT) AS $$
BEGIN
  UPDATE users 
  SET name = p_name, 
      email = p_email, 
      role = p_role::user_role, 
      active = p_active
  WHERE id = p_id;

  IF p_password IS NOT NULL AND p_password != '' THEN
    UPDATE users SET password = p_password WHERE id = p_id;
  END IF;

  RETURN QUERY SELECT 'OK'::TEXT, 'Usuario actualizado.'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════
-- Datos Iniciales
-- ═══════════════════════════════════════════════════════════
INSERT INTO users (name, email, password, role, avatar, active, pending) VALUES
  ('Carlos Mendoza',   'admin@naturalfood.com',      'admin123',       'Administrador', 'CM', 1, 0),
  ('Laura Vásquez',    'ingeniero@naturalfood.com',  'ing123',         'Ingeniero',     'LV', 1, 0),
  ('María García',     'rrhh@naturalfood.com',       'rrhh123',        'RRHH',          'MG', 1, 0),
  ('Juan Pérez',       'carga@naturalfood.com',      'carga123',       'Carga',         'JP', 1, 0),
  ('Roberto Díaz',     'subadmin@naturalfood.com',   'N4tur4lf00d$00', 'Sub-Admin',     'RD', 1, 0),
  ('Ana Martínez',     'ana@naturalfood.com',        'ana123',         'Carga',         'AM', 1, 0)
ON CONFLICT (email) DO NOTHING;
