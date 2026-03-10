------------------------------------------------------------
-- 1. LIMPIEZA PREVIA (opcional)
------------------------------------------------------------
DROP TABLE IF EXISTS labores CASCADE;
DROP TABLE IF EXISTS faenas CASCADE;

------------------------------------------------------------
-- 2. CREACIÓN DE TABLAS
------------------------------------------------------------

-- Tabla de faenas
CREATE TABLE faenas (
    id_faena INTEGER PRIMARY KEY,
    faena VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla de labores
CREATE TABLE labores (
    id_labor_nuevo INTEGER PRIMARY KEY,
    labor VARCHAR(200) NOT NULL,
    faena_nueva VARCHAR(100) NOT NULL,
    finca TEXT,
    codigo VARCHAR(50),
    tipo VARCHAR(100),
    precio VARCHAR(50),
    rendimiento INTEGER,
    FOREIGN KEY (faena_nueva) REFERENCES faenas(faena)
);

------------------------------------------------------------
-- 3. IMPORTACIÓN DE CSV
-- (Asegurate de colocar los archivos en una ruta accesible)
------------------------------------------------------------

-- Importar faenas
\copy faenas
FROM 'faenas_reorganizadas.csv'
CSV HEADER;

-- Importar labores
\copy labores
FROM 'labores_reorganizadas.csv'
CSV HEADER;

------------------------------------------------------------
-- 4. VALIDACIONES
------------------------------------------------------------

-- Cantidad de registros
SELECT 'Faenas:' AS tabla, COUNT(*) FROM faenas;
SELECT 'Labores:' AS tabla, COUNT(*) FROM labores;

-- Verificar que todas las labores tienen faena válida
SELECT labor, faena_nueva
FROM labores
WHERE faena_nueva NOT IN (SELECT faena FROM faenas);

-- Buscar duplicados de labores
SELECT labor, COUNT(*)
FROM labores
GROUP BY labor
HAVING COUNT(*) > 1;

-- Verificar registros sin código o tipo (opcional)
SELECT *
FROM labores
WHERE codigo IS NULL OR tipo IS NULL;

------------------------------------------------------------
-- 5. LISTO
------------------------------------------------------------
-- Base de datos cargada correctamente para Fincaría.