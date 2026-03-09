
ALTER TABLE admin_fincas ADD CONSTRAINT unique_finca_nombre UNIQUE (nombre);
ALTER TABLE admin_predios ADD CONSTRAINT unique_predio_finca_nombre UNIQUE (finca_id, nombre);
ALTER TABLE admin_cuarteles ADD CONSTRAINT unique_cuartel_predio_numero UNIQUE (predio_id, numero);
ALTER TABLE admin_faenas ADD CONSTRAINT unique_faena_nombre UNIQUE (nombre);
ALTER TABLE admin_labor ADD CONSTRAINT unique_labor_faena_nombre UNIQUE (faena_id, nombre);
