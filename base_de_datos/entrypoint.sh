#!/bin/bash

/opt/mssql/bin/sqlservr &

echo "Esperando a que SQL Server inicie..."
sleep 20s

until /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "${SA_PASSWORD}" \
  -C \
  -Q "SELECT 1" &> /dev/null
do
  echo "SQL Server no está listo, reintentando..."
  sleep 5s
done

echo "Ejecutando script de inicialización..."
/opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "${SA_PASSWORD}" \
  -C \
  -I \
  -i /usr/src/app/init.sql

echo "Base de datos inicializada correctamente."

wait