package repositories

import (
	"backend/config"
	"backend/internal/models"
)

func MostrarCumplimientoTiempos(fechaInicio string, fechaFin string) (*models.CumplimientoTiempos, error) {
	query := `
		SELECT
			COUNT(c.id) AS total_contratos,
			COALESCE(SUM(CASE WHEN CURRENT_DATE <= c.fecha_fin THEN 1 ELSE 0 END), 0) AS contratos_en_tiempo,
			COALESCE(SUM(CASE WHEN CURRENT_DATE > c.fecha_fin THEN 1 ELSE 0 END), 0) AS contratos_fuera_de_tiempo,
			COALESCE(
				ROUND(
					(SUM(CASE WHEN CURRENT_DATE <= c.fecha_fin THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(c.id), 0)::NUMERIC) * 100,
					2
				),
				0
			) AS porcentaje_cumplimiento,
			COALESCE(ROUND(AVG((c.fecha_fin - c.fecha_inicio)::NUMERIC), 2), 0) AS promedio_tiempo_pactado_dias,
			COALESCE(
				ROUND(
					AVG((LEAST(CURRENT_DATE, c.fecha_fin) - c.fecha_inicio)::NUMERIC),
					2
				),
				0
			) AS promedio_tiempo_real_dias
		FROM contratos c
		WHERE c.es_eliminado = FALSE
		  AND c.fecha_inicio IS NOT NULL
		  AND c.fecha_fin IS NOT NULL
		  AND c.fecha_inicio <= c.fecha_fin
		  AND c.fecha_inicio <= $2::DATE
		  AND c.fecha_fin >= $1::DATE
	`

	var result models.CumplimientoTiempos

	err := config.DB.QueryRow(query, fechaInicio, fechaFin).Scan(
		&result.TotalContratos,
		&result.ContratosEnTiempo,
		&result.ContratosFueraDeTiempo,
		&result.PorcentajeCumplimiento,
		&result.PromedioTiempoPactadoDias,
		&result.PromedioTiempoRealDias,
	)
	if err != nil {
		return nil, err
	}

	return &result, nil
}
