package repositories

import (
	"backend/config"
	"backend/internal/models"
)

func ObtenerDashboardOperativo() (*models.DashboardOperativoResponse, error) {
	queryResumen := `
		SELECT
			COUNT(os.id) AS ordenes_del_dia,
			COALESCE(SUM(CASE WHEN eo.nombre = 'Registrada' THEN 1 ELSE 0 END), 0) AS registradas,
			COALESCE(SUM(CASE WHEN eo.nombre = 'Listo para Despacho' THEN 1 ELSE 0 END), 0) AS listas_para_despacho
		FROM ordenes_servicio os
		LEFT JOIN estados_orden eo ON eo.id = os.estado_id
		WHERE os.es_eliminado = false
		  AND DATE(os.fecha_creacion) = CURRENT_DATE
	`

	var resp models.DashboardOperativoResponse
	if err := config.DB.QueryRow(queryResumen).Scan(
		&resp.OrdenesDelDia,
		&resp.Estados.Registradas,
		&resp.Estados.ListasParaDespacho,
	); err != nil {
		return nil, err
	}

	queryClientesBloqueados := `
		SELECT
			c.id,
			u.nombre,
			COALESCE(c.riesgo, '') AS riesgo
		FROM clientes c
		INNER JOIN usuarios u ON u.id = c.usuario_id
		WHERE c.es_eliminado = false
		  AND LOWER(COALESCE(c.riesgo, '')) IN ('alto', 'bloqueado')
		ORDER BY u.nombre
		LIMIT 10
	`

	rowsClientes, err := config.DB.Query(queryClientesBloqueados)
	if err != nil {
		return nil, err
	}
	defer rowsClientes.Close()

	for rowsClientes.Next() {
		var item models.OperativoClienteBloqueado
		if err := rowsClientes.Scan(&item.ClienteID, &item.Nombre, &item.Riesgo); err != nil {
			return nil, err
		}
		resp.Alertas.ClientesBloqueados = append(resp.Alertas.ClientesBloqueados, item)
	}

	if err := rowsClientes.Err(); err != nil {
		return nil, err
	}

	queryContratosVencidos := `
		SELECT
			ct.id,
			u.nombre,
			TO_CHAR(ct.fecha_fin, 'YYYY-MM-DD') AS fecha_fin
		FROM contratos ct
		INNER JOIN clientes c ON c.id = ct.cliente_id
		INNER JOIN usuarios u ON u.id = c.usuario_id
		WHERE ct.es_eliminado = false
		  AND ct.fecha_fin < CURRENT_DATE
		ORDER BY ct.fecha_fin DESC
		LIMIT 10
	`

	rowsContratos, err := config.DB.Query(queryContratosVencidos)
	if err != nil {
		return nil, err
	}
	defer rowsContratos.Close()

	for rowsContratos.Next() {
		var item models.OperativoContratoVencido
		if err := rowsContratos.Scan(&item.ContratoID, &item.Cliente, &item.FechaFin); err != nil {
			return nil, err
		}
		resp.Alertas.ContratosVencidos = append(resp.Alertas.ContratosVencidos, item)
	}

	if err := rowsContratos.Err(); err != nil {
		return nil, err
	}

	return &resp, nil
}

func MostrarOperacionesDiariasPorSede(sede string, fecha string) (*models.OperacionesDiarias, error) {

	query := `
	SELECT
		COUNT(o.id) AS total_ordenes,
		COALESCE(SUM(f.total),0) AS total_facturado,
		COALESCE(SUM(o.costo_operativo),0) AS total_costos,
		COALESCE(SUM(f.total),0) - COALESCE(SUM(o.costo_operativo),0) AS utilidad
	FROM ordenes_servicio o
	LEFT JOIN facturas f ON f.orden_id = o.id AND f.es_eliminado = false
	WHERE o.es_eliminado = false
	  AND o.sede = $1
	  AND DATE(o.fecha_creacion) = $2
	`

	var result models.OperacionesDiarias

	err := config.DB.QueryRow(query, sede, fecha).Scan(
		&result.TotalOrdenes,
		&result.TotalFacturado,
		&result.TotalCostos,
		&result.Utilidad,
	)

	if err != nil {
		return nil, err
	}

	return &result, nil
}

func ImplementarCorteDiarioOperaciones(fecha string, sede string, observaciones string) (*models.CorteDiarioResponse, error) {
	queryResumen := `
		SELECT
			COUNT(o.id) AS total_ordenes,
			COALESCE(SUM(f.total), 0) AS total_facturado,
			COALESCE(SUM(o.costo_operativo), 0) AS total_costos,
			COALESCE(SUM(f.total), 0) - COALESCE(SUM(o.costo_operativo), 0) AS total_utilidad
		FROM ordenes_servicio o
		LEFT JOIN facturas f
			ON f.orden_id = o.id
		   AND f.es_eliminado = false
		WHERE o.es_eliminado = false
		  AND o.sede = $1
		  AND DATE(o.fecha_creacion) = $2
	`

	var resp models.CorteDiarioResponse
	resp.Sede = sede
	resp.Observaciones = observaciones

	err := config.DB.QueryRow(queryResumen, sede, fecha).Scan(
		&resp.TotalOrdenes,
		&resp.TotalFacturado,
		&resp.TotalCostos,
		&resp.TotalUtilidad,
	)
	if err != nil {
		return nil, err
	}

	queryInsert := `
		INSERT INTO corte_operaciones (
			fecha,
			sede,
			total_ordenes,
			total_facturado,
			total_costos,
			total_utilidad,
			observaciones
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, fecha
	`

	err = config.DB.QueryRow(
		queryInsert,
		fecha,
		sede,
		resp.TotalOrdenes,
		resp.TotalFacturado,
		resp.TotalCostos,
		resp.TotalUtilidad,
		observaciones,
	).Scan(&resp.ID, &resp.Fecha)

	if err != nil {
		return nil, err
	}

	return &resp, nil
}
