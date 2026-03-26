package repositories

import (
	"backend/config"
	"backend/internal/models"
	"database/sql"
	"errors"
)

func ObtenerFacturas() ([]models.Factura, error) {
	rows, err := config.DB.Query(`
		SELECT id, orden_id, cliente_id, total, iva, uuid, fecha, es_eliminado
		FROM facturas
		WHERE es_eliminado = false
		ORDER BY fecha DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facturas []models.Factura

	for rows.Next() {
		var factura models.Factura
		err := rows.Scan(
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
			return nil, err
		}
		facturas = append(facturas, factura)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if facturas == nil {
		facturas = make([]models.Factura, 0)
	}

	return facturas, nil
}

func ObtenerDetalleFactura(id string) (*models.FacturaDetalleResponse, error) {
	var factura models.Factura

	queryFactura := `
		SELECT id, orden_id, cliente_id, total, iva, uuid, fecha, es_eliminado
		FROM facturas
		WHERE id = $1 AND es_eliminado = false
	`

	err := config.DB.QueryRow(queryFactura, id).Scan(
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

	queryDetalle := `
		SELECT id, factura_id, descripcion, monto
		FROM detalle_factura
		WHERE factura_id = $1
		ORDER BY id ASC
	`

	rows, err := config.DB.Query(queryDetalle, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var detalles []models.DetalleFactura

	for rows.Next() {
		var detalle models.DetalleFactura
		err := rows.Scan(
			&detalle.ID,
			&detalle.FacturaID,
			&detalle.Descripcion,
			&detalle.Monto,
		)
		if err != nil {
			return nil, err
		}
		detalles = append(detalles, detalle)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.FacturaDetalleResponse{
		Factura: factura,
		Detalle: detalles,
	}, nil
}

func ObtenerFacturasPendientes() ([]models.Factura, error) {
	rows, err := config.DB.Query(`
		SELECT id, orden_id, cliente_id, total, iva, uuid, fecha, estado
		FROM facturas
		WHERE es_eliminado = false
		  AND estado ILIKE 'borrador'
		ORDER BY fecha DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facturas []models.Factura

	for rows.Next() {
		var factura models.Factura
		err := rows.Scan(
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
			return nil, err
		}
		facturas = append(facturas, factura)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if facturas == nil {
		facturas = make([]models.Factura, 0)
	}

	return facturas, nil
}

func ObtenerFacturasBorrador() ([]models.Factura, error) {
	rows, err := config.DB.Query(`
		SELECT 
			f.id, f.orden_id, f.cliente_id, f.total, f.iva, f.uuid, f.fecha, f.estado,
			u.nombre, c.nit, c.direccion
		FROM facturas f
		JOIN clientes c ON f.cliente_id = c.id
		JOIN usuarios u ON c.usuario_id = u.id
		WHERE f.es_eliminado = false
		  AND f.estado ILIKE 'borrador'
		ORDER BY f.fecha DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facturas []models.Factura

	for rows.Next() {
		var factura models.Factura
		var clienteNombre sql.NullString
		var nit sql.NullString
		var direccion sql.NullString

		err := rows.Scan(
			&factura.ID,
			&factura.OrdenID,
			&factura.ClienteID,
			&factura.Total,
			&factura.IVA,
			&factura.UUID,
			&factura.Fecha,
			&factura.Estado,
			&clienteNombre,
			&nit,
			&direccion,
		)
		if err != nil {
			return nil, err
		}

		// Asignar valores nulos con seguridad
		if clienteNombre.Valid {
			factura.ClienteNombre = &clienteNombre.String
		}
		if nit.Valid {
			factura.NIT = &nit.String
		}
		if direccion.Valid {
			factura.DireccionFiscal = &direccion.String
		}

		facturas = append(facturas, factura)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if facturas == nil {
		facturas = make([]models.Factura, 0)
	}

	return facturas, nil
}

func ObtenerFacturasCertificadasPendiente() ([]models.Factura, error) {
	rows, err := config.DB.Query(`
		SELECT 
			f.id, f.orden_id, f.cliente_id, f.total, f.iva, f.uuid, f.fecha, f.estado,
			u.nombre, c.nit, c.direccion,
			COALESCE(SUM(p.monto), 0) as total_pagado
		FROM facturas f
		JOIN clientes c ON f.cliente_id = c.id
		JOIN usuarios u ON c.usuario_id = u.id
		LEFT JOIN pagos p ON f.id = p.factura_id
		WHERE f.es_eliminado = false
		  AND (f.estado ILIKE 'certificada pendiente de pago' OR f.estado ILIKE 'certificado')
		GROUP BY f.id, f.orden_id, f.cliente_id, f.total, f.iva, f.uuid, f.fecha, f.estado,
		         u.nombre, c.nit, c.direccion
		ORDER BY f.fecha DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facturas []models.Factura

	for rows.Next() {
		var factura models.Factura
		var clienteNombre sql.NullString
		var nit sql.NullString
		var direccion sql.NullString
		var totalPagado float64

		err := rows.Scan(
			&factura.ID,
			&factura.OrdenID,
			&factura.ClienteID,
			&factura.Total,
			&factura.IVA,
			&factura.UUID,
			&factura.Fecha,
			&factura.Estado,
			&clienteNombre,
			&nit,
			&direccion,
			&totalPagado,
		)
		if err != nil {
			return nil, err
		}

		// Asignar valores nulos con seguridad
		if clienteNombre.Valid {
			factura.ClienteNombre = &clienteNombre.String
		}
		if nit.Valid {
			factura.NIT = &nit.String
		}
		if direccion.Valid {
			factura.DireccionFiscal = &direccion.String
		}

		// Calcular saldo pendiente
		factura.Saldo = (factura.Total + factura.IVA) - totalPagado
		if factura.Saldo < 0 {
			factura.Saldo = 0
		}

		facturas = append(facturas, factura)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return facturas, nil
}

func ActualizarEstadoFactura(facturaID int, nuevoEstado string) error {
	query := `
		UPDATE facturas
		SET estado = $1
		WHERE id = $2
	`

	_, err := config.DB.Exec(query, nuevoEstado, facturaID)
	return err
}
