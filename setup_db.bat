@echo off
set PGPASSWORD=wingeyer
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE naturalfood_db;"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d naturalfood_db -f "Fuentes\naturalfood_pg.sql"
