package repositories

import (
	"backend/config"
	"backend/internal/models"
)

func ObtenerAlertasDesviacion(fechaInicio string, fechaFin string) (*models.AlertasDesviacionResponse, error) {
	resp := &models.AlertasDesviacionResponse{
		ClientesConBajaCarga: []models.AlertaDesviacionCliente{},
		RutasAltoConsumo:     []models.AlertaDesviacionRuta{},
	}

	// Obtener clientes con baja carga
	queryClientes := `
		SELECT
			c.id,
			u.nombre,
			COUNT(os.id) as total_ordenes,
			COALESCE(AVG(cg.peso_real), 0) as peso_promedio_real,
			COALESCE(AVG(os.peso), 0) as peso_promedio_pactado
		FROM clientes c
		INNER JOIN usuarios u ON u.id = c.usuario_id
		LEFT JOIN ordenes_servicio os ON os.cliente_id = c.id 
			AND os.es_eliminado = FALSE
			AND DATE(os.fecha_creacion) BETWEEN $1::DATE AND $2::DATE
		LEFT JOIN carga cg ON cg.orden_id = os.id
			AND cg.es_eliminado = FALSE
		WHERE c.es_eliminado = FALSE
			AND u.es_eliminado = FALSE
		GROUP BY c.id, u.nombre
		HAVING COUNT(os.id) > 0
			AND COALESCE(AVG(cg.peso_real), 0) < (COALESCE(AVG(os.peso), 0) * 0.5)
		ORDER BY (COALESCE(AVG(os.peso), 0) - COALESCE(AVG(cg.peso_real), 0)) DESC
	`

	rows, err := config.DB.Query(queryClientes, fechaInicio, fechaFin)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var alerta models.AlertaDesviacionCliente
		err := rows.Scan(
			&alerta.ClienteID,
			&alerta.NombreCliente,
			&alerta.TotalOrdenes,
			&alerta.PesoPromedioReal,
			&alerta.PesoPromedioPactado,
		)
		if err != nil {
			return nil, err
		}

		if alerta.PesoPromedioPactado > 0 {
			alerta.Desviacion = ((alerta.PesoPromedioPactado - alerta.PesoPromedioReal) / alerta.PesoPromedioPactado) * 100
		}

		if alerta.Desviacion > 70 {
			alerta.Severidad = "crítica"
		} else if alerta.Desviacion > 50 {
			alerta.Severidad = "alta"
		} else {
			alerta.Severidad = "media"
		}

		resp.ClientesConBajaCarga = append(resp.ClientesConBajaCarga, alerta)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// Obtener rutas con alto consumo
	queryRutas := `
		SELECT
			r.id,
			r.origen,
			r.destino,
			r.distancia_km,
			COUNT(DISTINCT os.id) as total_ordenes,
			COALESCE(SUM(os.peso), 0) as peso_total_consumido,
			COALESCE(AVG(os.peso), 0) as consumo_promedio
		FROM rutas r
		LEFT JOIN ordenes_servicio os ON os.ruta_id = r.id
			AND os.es_eliminado = FALSE
			AND DATE(os.fecha_creacion) BETWEEN $1::DATE AND $2::DATE
		WHERE r.es_eliminado = FALSE
		GROUP BY r.id, r.origen, r.destino, r.distancia_km
		HAVING COUNT(DISTINCT os.id) > 0
			AND COALESCE(AVG(os.peso), 0) > 500
		ORDER BY COALESCE(SUM(os.peso), 0) DESC
	`

	rowsRutas, err := config.DB.Query(queryRutas, fechaInicio, fechaFin)
	if err != nil {
		return nil, err
	}
	defer rowsRutas.Close()

	for rowsRutas.Next() {
		var alerta models.AlertaDesviacionRuta
		err := rowsRutas.Scan(
			&alerta.RutaID,
			&alerta.Origen,
			&alerta.Destino,
			&alerta.DistanciaKm,
			&alerta.TotalOrdenes,
			&alerta.PesoTotalConsumido,
			&alerta.ConsumoPromedio,
		)
		if err != nil {
			return nil, err
		}

		if alerta.ConsumoPromedio > 1000 {
			alerta.Severidad = "crítica"
		} else if alerta.ConsumoPromedio > 750 {
			alerta.Severidad = "alta"
		} else {
			alerta.Severidad = "media"
		}

		resp.RutasAltoConsumo = append(resp.RutasAltoConsumo, alerta)
	}

	if err = rowsRutas.Err(); err != nil {
		return nil, err
	}

	resp.TotalAlertasClientes = len(resp.ClientesConBajaCarga)
	resp.TotalAlertasRutas = len(resp.RutasAltoConsumo)

	return resp, nil
}
