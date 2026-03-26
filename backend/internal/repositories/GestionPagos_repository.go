package repositories

import (
	"backend/config"
	"backend/internal/models"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"
)

func redondear2(valor float64) float64 {
	return math.Round(valor*100) / 100
}

func ObtenerFacturaActivaPorID(id int) (*models.Factura, error) {
	var factura models.Factura

	query := `
		SELECT id, orden_id, cliente_id, total, iva, uuid, fecha, estado
		FROM facturas
		WHERE id = $1 AND es_eliminado = false
	`

	err := config.DB.QueryRow(query, id).Scan(
		&factura.ID,
		&factura.OrdenID,
		&factura.ClienteID,
		&factura.Total,
		&factura.IVA,
		&factura.UUID,
		&factura.Fecha,
		&factura.Estado,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("factura no encontrada")
		}
		return nil, err
	}

	factura.Total = redondear2(factura.Total)
	factura.IVA = redondear2(factura.IVA)

	return &factura, nil
}

func ObtenerTotalPagadoPorFactura(facturaID int) (float64, error) {
	var total sql.NullFloat64

	query := `
		SELECT COALESCE(SUM(monto), 0)
		FROM pagos
		WHERE factura_id = $1
		  AND es_eliminado = false
		  AND LOWER(COALESCE(estado, 'pendiente')) = 'pagado'
	`

	err := config.DB.QueryRow(query, facturaID).Scan(&total)
	if err != nil {
		return 0, err
	}

	if !total.Valid {
		return 0, nil
	}

	return redondear2(total.Float64), nil
}

func InsertarPago(pago models.RegistrarPagoRequest, estado string) error {
	query := `
		INSERT INTO pagos (
			factura_id,
			monto,
			metodo,
			banco,
			numero_autorizacion,
			estado
		)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := config.DB.Exec(
		query,
		pago.FacturaID,
		pago.Monto,
		pago.Metodo,
		pago.Banco,
		pago.NumeroAutorizacion,
		estado,
	)

	return err
}

func ObtenerLimiteCreditoCliente(clienteID int) (float64, error) {
	var limite sql.NullFloat64

	query := `
		SELECT limite_credito
		FROM clientes
		WHERE id = $1
		  AND es_eliminado = false
	`

	err := config.DB.QueryRow(query, clienteID).Scan(&limite)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, errors.New("cliente no encontrado")
		}
		return 0, err
	}

	if !limite.Valid {
		return 0, nil
	}

	return limite.Float64, nil
}

func ActualizarEstadoFacturaPagada(facturaID int) error {
	query := `
		UPDATE facturas
		SET estado = 'pagada'
		WHERE id = $1
	`

	_, err := config.DB.Exec(query, facturaID)
	return err
}

func ObtenerDeudaTotalCliente(clienteID int) (float64, error) {
	var deuda sql.NullFloat64

	query := `
		SELECT
			COALESCE(SUM(f.total), 0) -
			COALESCE(SUM(CASE
				WHEN p.es_eliminado = false
				 AND LOWER(COALESCE(p.estado, 'pendiente')) = 'pagado'
				THEN p.monto
				ELSE 0
			END), 0) AS deuda
		FROM facturas f
		LEFT JOIN pagos p ON p.factura_id = f.id
		WHERE f.cliente_id = $1
		  AND f.es_eliminado = false
	`

	err := config.DB.QueryRow(query, clienteID).Scan(&deuda)
	if err != nil {
		return 0, err
	}

	if !deuda.Valid {
		return 0, nil
	}

	return deuda.Float64, nil
}

func ObtenerPagos() ([]models.Pago, error) {
	rows, err := config.DB.Query(`
		SELECT id, factura_id, monto, metodo, banco, numero_autorizacion, fecha, estado
		FROM pagos
		WHERE es_eliminado = false
		ORDER BY fecha DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pagos []models.Pago

	for rows.Next() {
		var pago models.Pago
		err := rows.Scan(
			&pago.ID,
			&pago.FacturaID,
			&pago.Monto,
			&pago.Metodo,
			&pago.Banco,
			&pago.NumeroAutorizacion,
			&pago.Fecha,
			&pago.Estado,
		)
		if err != nil {
			return nil, err
		}
		pagos = append(pagos, pago)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return pagos, nil
}

func ObtenerPagosPorFactura(facturaID int) ([]models.Pago, error) {
	rows, err := config.DB.Query(`
		SELECT id, factura_id, monto, metodo, banco, numero_autorizacion, fecha, estado
		FROM pagos
		WHERE factura_id = $1
		  AND es_eliminado = false
		ORDER BY fecha DESC
	`, facturaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pagos []models.Pago

	for rows.Next() {
		var pago models.Pago
		var estado sql.NullString

		err := rows.Scan(
			&pago.ID,
			&pago.FacturaID,
			&pago.Monto,
			&pago.Metodo,
			&pago.Banco,
			&pago.NumeroAutorizacion,
			&pago.Fecha,
			&estado,
		)
		if err != nil {
			return nil, err
		}

		if estado.Valid {
			pago.Estado = estado.String
		} else {
			pago.Estado = "pendiente"
		}

		pagos = append(pagos, pago)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return pagos, nil
}

func ObtenerPagosPendientes() ([]models.Pago, error) {
	rows, err := config.DB.Query(`
		SELECT id, factura_id, monto, metodo, banco, numero_autorizacion, fecha, estado
		FROM pagos
		WHERE es_eliminado = false
		  AND LOWER(estado) = 'pendiente'
		ORDER BY fecha DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pagos []models.Pago

	for rows.Next() {
		var pago models.Pago
		var estado sql.NullString

		err := rows.Scan(
			&pago.ID,
			&pago.FacturaID,
			&pago.Monto,
			&pago.Metodo,
			&pago.Banco,
			&pago.NumeroAutorizacion,
			&pago.Fecha,
			&estado,
		)
		if err != nil {
			return nil, err
		}

		if estado.Valid {
			pago.Estado = estado.String
		} else {
			pago.Estado = "pendiente"
		}

		pagos = append(pagos, pago)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return pagos, nil
}
func ObtenerEstadoCuentaPorCliente(idCliente int) (*models.EstadoCuentaCliente, error) {
	var estadoCuenta models.EstadoCuentaCliente

	queryCliente := `
		SELECT id, limite_credito, dias_credito
		FROM clientes
		WHERE id = $1
		  AND es_eliminado = false
	`

	err := config.DB.QueryRow(queryCliente, idCliente).Scan(
		&estadoCuenta.ClienteID,
		&estadoCuenta.LimiteCredito,
		&estadoCuenta.DiasCredito,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("cliente no encontrado")
		}
		return nil, err
	}

	queryFacturas := `
		SELECT
			f.id,
			f.fecha,
			f.total,
			f.iva,
			COALESCE(SUM(CASE
				WHEN p.es_eliminado = false
				 AND LOWER(COALESCE(p.estado, 'pendiente')) = 'pagado'
				THEN p.monto
				ELSE 0
			END), 0) AS total_pagado
		FROM facturas f
		LEFT JOIN pagos p ON p.factura_id = f.id
		WHERE f.cliente_id = $1
		  AND f.es_eliminado = false
		  AND LOWER(f.estado) = 'certificada pendiente de pago'
		GROUP BY f.id, f.fecha, f.total, f.iva
		ORDER BY f.fecha DESC
	`

	rows, err := config.DB.Query(queryFacturas, idCliente)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facturas []models.FacturaEstadoCuenta
	var totalFacturado float64
	var totalPagado float64

	for rows.Next() {
		var factura models.FacturaEstadoCuenta
		var iva float64

		err := rows.Scan(
			&factura.FacturaID,
			&factura.FechaFactura,
			&factura.TotalFactura,
			&iva,
			&factura.TotalPagado,
		)
		if err != nil {
			return nil, err
		}

		factura.TotalFactura = redondear2(factura.TotalFactura + iva)
		factura.Saldo = factura.TotalFactura - factura.TotalPagado
		if factura.Saldo < 0 {
			factura.Saldo = 0
		}

		totalFacturado += factura.TotalFactura
		totalPagado += factura.TotalPagado

		facturas = append(facturas, factura)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	estadoCuenta.TotalFacturado = math.Round(totalFacturado*100) / 100
	estadoCuenta.TotalPagado = math.Round(totalPagado*100) / 100
	estadoCuenta.SaldoPendiente = math.Round((totalFacturado-totalPagado)*100) / 100
	estadoCuenta.Facturas = facturas

	return &estadoCuenta, nil
}

func ObtenerEstadoCuentaPorNIT(nit string) (*models.EstadoCuentaCliente, error) {
	var clienteID int

	// Primero obtener el cliente_id usando el NIT
	queryClienteID := `
		SELECT id
		FROM clientes
		WHERE nit = $1
		  AND es_eliminado = false
	`

	err := config.DB.QueryRow(queryClienteID, nit).Scan(&clienteID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("cliente no encontrado")
		}
		return nil, err
	}

	// Usar la función existente con el cliente_id obtenido
	return ObtenerEstadoCuentaPorCliente(clienteID)
}

type ClienteCredito struct {
	ID             int     `json:"id"`
	NIT            string  `json:"nit"`
	Nombre         string  `json:"nombre"`
	LimiteCredito  float64 `json:"limite_credito"`
	DiasCredito    int     `json:"dias_credito"`
	TotalFacturado float64 `json:"total_facturado"`
	TotalPagado    float64 `json:"total_pagado"`
	SaldoPendiente float64 `json:"saldo_pendiente"`
}

func ObtenerClientesConCredito() ([]ClienteCredito, error) {
	query := `
		SELECT 
			c.id,
			c.nit,
			u.nombre,
			c.limite_credito,
			c.dias_credito,
			COALESCE(SUM(f.total + COALESCE(f.iva, 0)), 0) AS total_facturado,
			COALESCE(SUM(CASE 
				WHEN p.es_eliminado = false AND LOWER(COALESCE(p.estado, 'pendiente')) = 'pagado'
				THEN p.monto 
				ELSE 0 
			END), 0) AS total_pagado
		FROM clientes c
		JOIN usuarios u ON c.usuario_id = u.id
		LEFT JOIN facturas f ON f.cliente_id = c.id AND f.es_eliminado = false
		LEFT JOIN pagos p ON p.factura_id = f.id
		WHERE c.es_eliminado = false
		GROUP BY c.id, c.nit, u.nombre, c.limite_credito, c.dias_credito
		ORDER BY c.id
	`

	rows, err := config.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clientes []ClienteCredito

	for rows.Next() {
		var cliente ClienteCredito

		err := rows.Scan(
			&cliente.ID,
			&cliente.NIT,
			&cliente.Nombre,
			&cliente.LimiteCredito,
			&cliente.DiasCredito,
			&cliente.TotalFacturado,
			&cliente.TotalPagado,
		)
		if err != nil {
			return nil, err
		}

		cliente.SaldoPendiente = cliente.TotalFacturado - cliente.TotalPagado
		clientes = append(clientes, cliente)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return clientes, nil
}

func ObtenerAntiguedadSaldosCliente(idCliente int) (*models.AntiguedadSaldosCliente, error) {
	var result models.AntiguedadSaldosCliente
	result.ClienteID = idCliente

	queryCliente := `
		SELECT id, dias_credito
		FROM clientes
		WHERE id = $1
		  AND es_eliminado = false
	`

	err := config.DB.QueryRow(queryCliente, idCliente).Scan(
		&result.ClienteID,
		&result.DiasCredito,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("cliente no encontrado")
		}
		return nil, err
	}

	query := `
		SELECT
			f.id,
			f.fecha,
			f.total,
			COALESCE(SUM(CASE
				WHEN p.es_eliminado = false
				 AND LOWER(COALESCE(p.estado, 'pendiente')) = 'pagado'
				THEN p.monto
				ELSE 0
			END), 0) AS total_pagado
		FROM facturas f
		LEFT JOIN pagos p ON p.factura_id = f.id
		WHERE f.cliente_id = $1
		  AND f.es_eliminado = false
		GROUP BY f.id, f.fecha, f.total
	`

	rows, err := config.DB.Query(query, idCliente)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var facturaID int
		var totalFactura float64
		var totalPagado float64
		var fechaFactura sql.NullTime

		err := rows.Scan(
			&facturaID,
			&fechaFactura,
			&totalFactura,
			&totalPagado,
		)
		if err != nil {
			return nil, err
		}

		saldo := totalFactura - totalPagado
		if saldo <= 0 {
			continue
		}

		if !fechaFactura.Valid {
			result.Corriente += saldo

			continue
		}

		// días vencidos = hoy - (fecha_factura + dias_credito)
		queryDias := `
			SELECT GREATEST(
				DATE_PART('day', CURRENT_DATE - ($1::date + ($2 * INTERVAL '1 day'))),
				0
			)
		`

		var diasVencidos float64
		err = config.DB.QueryRow(queryDias, fechaFactura.Time, result.DiasCredito).Scan(&diasVencidos)
		if err != nil {
			return nil, err
		}

		switch {
		case diasVencidos <= 0:
			result.Corriente += saldo
		case diasVencidos >= 1 && diasVencidos <= 30:
			result.De1a30 += saldo
		case diasVencidos >= 31 && diasVencidos <= 60:
			result.De31a60 += saldo
		case diasVencidos >= 61 && diasVencidos <= 90:
			result.De61a90 += saldo
		default:
			result.MasDe90 += saldo
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result.TotalVencido = result.De1a30 + result.De31a60 + result.De61a90 + result.MasDe90
	result.Corriente = redondear2(result.Corriente)
	result.De1a30 = redondear2(result.De1a30)
	result.De31a60 = redondear2(result.De31a60)
	result.De61a90 = redondear2(result.De61a90)
	result.MasDe90 = redondear2(result.MasDe90)
	result.TotalVencido = redondear2(result.TotalVencido)
	return &result, nil
}

func ObtenerEstadoCuentaClienteFormatoFrontend(idCliente int) (*models.EstadoCuentaResponse, error) {
	queryCliente := `
		SELECT limite_credito, dias_credito
		FROM clientes
		WHERE id = $1
		  AND es_eliminado = FALSE
	`

	var limiteCredito float64
	var diasCredito int
	err := config.DB.QueryRow(queryCliente, idCliente).Scan(&limiteCredito, &diasCredito)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("cliente no encontrado")
		}
		return nil, err
	}

	// Obtener facturas con saldo pendiente
	queryFacturas := `
		SELECT
			f.id,
			f.fecha::date,
			(f.fecha::date + (c.dias_credito * INTERVAL '1 day'))::date AS fecha_vencimiento,
			(f.total + COALESCE(f.iva, 0)) AS total_factura,
			((f.total + COALESCE(f.iva, 0)) - COALESCE(SUM(CASE
				WHEN p.es_eliminado = FALSE AND LOWER(COALESCE(p.estado, 'pendiente')) = 'pagado' THEN p.monto
				ELSE 0
			END), 0)) AS monto_pendiente,
			CASE
				WHEN CURRENT_DATE > (f.fecha::date + (c.dias_credito * INTERVAL '1 day'))::date THEN 'Vencida'
				ELSE 'Pendiente'
			END AS estado
		FROM facturas f
		INNER JOIN clientes c ON c.id = f.cliente_id
		LEFT JOIN pagos p ON p.factura_id = f.id
		WHERE f.cliente_id = $1
		  AND f.es_eliminado = FALSE
		GROUP BY f.id, f.fecha, f.total, f.iva, c.dias_credito
		ORDER BY ((f.total + COALESCE(f.iva, 0)) - COALESCE(SUM(CASE
			WHEN p.es_eliminado = FALSE AND LOWER(COALESCE(p.estado, 'pendiente')) = 'pagado' THEN p.monto
			ELSE 0
		END), 0)) DESC, f.fecha DESC, f.id DESC
	`

	rows, err := config.DB.Query(queryFacturas, idCliente)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	facturas := make([]models.FacturaEstadoCuentaItem, 0)
	totalFacturado := 0.0
	for rows.Next() {
		var facturaID int
		var fechaEmision time.Time
		var fechaVencimiento time.Time
		var totalFactura float64
		var factura models.FacturaEstadoCuentaItem

		err := rows.Scan(
			&facturaID,
			&fechaEmision,
			&fechaVencimiento,
			&totalFactura,
			&factura.Monto,
			&factura.Estado,
		)
		if err != nil {
			return nil, err
		}

		factura.Numero = "FAC-" + fechaEmision.Format("2006") + "-" + fmt.Sprintf("%04d", facturaID)
		factura.FechaEmision = fechaEmision.Format("2006-01-02")
		factura.FechaVencimiento = fechaVencimiento.Format("2006-01-02")
		factura.Monto = redondear2(factura.Monto)
		totalFacturado += redondear2(totalFactura)
		facturas = append(facturas, factura)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Obtener pagos realizados
	queryPagos := `
		SELECT id, factura_id, monto, metodo, banco, numero_autorizacion, fecha, estado
		FROM pagos
		WHERE factura_id IN (
			SELECT id FROM facturas 
			WHERE cliente_id = $1 AND es_eliminado = FALSE
		)
		AND es_eliminado = FALSE
		AND LOWER(COALESCE(estado, 'pendiente')) = 'pagado'
		ORDER BY fecha DESC
	`

	rowsPagos, err := config.DB.Query(queryPagos, idCliente)
	if err != nil {
		return nil, err
	}
	defer rowsPagos.Close()

	pagosRealizados := make([]models.PagoEstadoCuentaItem, 0)
	totalPagado := 0.0
	for rowsPagos.Next() {
		var pago models.PagoEstadoCuentaItem
		var fecha time.Time

		err := rowsPagos.Scan(
			&pago.ID,
			&pago.FacturaID,
			&pago.Monto,
			&pago.Metodo,
			&pago.Banco,
			&pago.NumeroAutorizacion,
			&fecha,
			&pago.Estado,
		)
		if err != nil {
			return nil, err
		}

		pago.Monto = redondear2(pago.Monto)
		pago.Fecha = fecha.Format("2006-01-02")
		totalPagado += pago.Monto
		pagosRealizados = append(pagosRealizados, pago)
	}

	if err := rowsPagos.Err(); err != nil {
		return nil, err
	}

	saldoPendiente := redondear2(totalFacturado - totalPagado)

	return &models.EstadoCuentaResponse{
		LimiteCredito:   redondear2(limiteCredito),
		Facturas:        facturas,
		PagosRealizados: pagosRealizados,
		TotalFacturado:  redondear2(totalFacturado),
		TotalPagado:     redondear2(totalPagado),
		SaldoPendiente:  saldoPendiente,
	}, nil
}

func esRiesgoAlto(riesgoRaw string) bool {
	r := strings.ToUpper(strings.TrimSpace(riesgoRaw))
	if r == "ALTO" {
		return true
	}

	return strings.Contains(r, "RG:ALTO") ||
		strings.Contains(r, "RIESGO_GLOBAL:ALTO")
}

func ObtenerMetricasAlertasCliente(idCliente int) (*models.AlertasClienteMetricas, error) {
	queryCliente := `
		SELECT limite_credito, riesgo
		FROM clientes
		WHERE id = $1
		  AND es_eliminado = FALSE
	`

	var creditoMaximo float64
	var riesgoRaw sql.NullString
	err := config.DB.QueryRow(queryCliente, idCliente).Scan(&creditoMaximo, &riesgoRaw)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("cliente no encontrado")
		}
		return nil, err
	}

	queryCreditoUsado := `
		SELECT COALESCE(SUM(
			GREATEST(
				(f.total + COALESCE(f.iva, 0)) - COALESCE(p.total_pagado, 0),
				0
			)
		), 0)
		FROM facturas f
		LEFT JOIN (
			SELECT factura_id, SUM(monto) AS total_pagado
			FROM pagos
			WHERE es_eliminado = FALSE
			  AND LOWER(COALESCE(estado, 'pendiente')) = 'pagado'
			GROUP BY factura_id
		) p ON p.factura_id = f.id
		WHERE f.cliente_id = $1
		  AND f.es_eliminado = FALSE
	`

	var creditoUsado float64
	err = config.DB.QueryRow(queryCreditoUsado, idCliente).Scan(&creditoUsado)
	if err != nil {
		return nil, err
	}

	queryContrato := `
		SELECT fecha_fin
		FROM contratos
		WHERE cliente_id = $1
		  AND es_eliminado = FALSE
		ORDER BY activo DESC, fecha_fin DESC
		LIMIT 1
	`

	var fechaFinContrato sql.NullTime
	err = config.DB.QueryRow(queryContrato, idCliente).Scan(&fechaFinContrato)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	metricas := &models.AlertasClienteMetricas{
		CreditoMaximo: creditoMaximo,
		CreditoUsado:  redondear2(creditoUsado),
		RiesgoAlto:    riesgoRaw.Valid && esRiesgoAlto(riesgoRaw.String),
	}

	if fechaFinContrato.Valid {
		fecha := fechaFinContrato.Time
		metricas.FechaFinContrato = &fecha
	}

	return metricas, nil
}
