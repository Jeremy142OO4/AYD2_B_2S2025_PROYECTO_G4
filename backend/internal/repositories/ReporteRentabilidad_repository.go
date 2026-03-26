package repositories

import (
	"backend/config"
	"backend/internal/models"
)

func MostrarIngresosVsCostos(fechaInicio string, fechaFin string) (*models.IngresosVsCostos, error) {
	query := `
		SELECT
			COALESCE(SUM(f.total), 0) AS ingresos,
			COALESCE(SUM(o.costo_operativo), 0) AS costos,
			COALESCE(SUM(f.total), 0) - COALESCE(SUM(o.costo_operativo), 0) AS utilidad
		FROM ordenes_servicio o
		LEFT JOIN facturas f 
			ON f.orden_id = o.id 
		   AND f.es_eliminado = false
		WHERE o.es_eliminado = false
		  AND DATE(o.fecha_creacion) BETWEEN $1 AND $2
	`

	var result models.IngresosVsCostos

	err := config.DB.QueryRow(query, fechaInicio, fechaFin).Scan(
		&result.Ingresos,
		&result.Costos,
		&result.Utilidad,
	)
	if err != nil {
		return nil, err
	}

	return &result, nil
}
