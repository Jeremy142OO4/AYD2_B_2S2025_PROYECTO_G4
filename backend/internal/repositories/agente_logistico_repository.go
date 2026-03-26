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

func ObtenerOrdenes() ([]models.OrdenResponse, error) {
	var ordenes []models.OrdenResponse

	query := `
		SELECT 
			o.id,
			o.cliente_id,
			COALESCE(o.contrato_id, 0) AS contrato_id,
			COALESCE(u.nombre, '') AS nombre_cliente,
			COALESCE(r.origen, '') AS origen,
			COALESCE(r.destino, '') AS destino,
			COALESCE(o.peso, 0) AS peso,
			COALESCE(e.nombre, '') AS estado
		FROM ordenes_servicio o
		LEFT JOIN clientes c ON o.cliente_id = c.id
		LEFT JOIN usuarios u ON c.usuario_id = u.id
		LEFT JOIN rutas r ON o.ruta_id = r.id
		LEFT JOIN estados_orden e ON o.estado_id = e.id
		WHERE o.es_eliminado = false
		ORDER BY o.id DESC
	`

	rows, err := config.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var orden models.OrdenResponse

		err := rows.Scan(
			&orden.ID,
			&orden.ClienteID,
			&orden.ContratoID,
			&orden.NombreCliente,
			&orden.Origen,
			&orden.Destino,
			&orden.Peso,
			&orden.Estado,
		)
		if err != nil {
			return nil, err
		}

		ordenes = append(ordenes, orden)
	}

	return ordenes, nil
}

func ExisteAsignacionPorOrden(ordenID int) (bool, error) {
	var existe bool

	query := `
		SELECT EXISTS (
			SELECT 1 FROM asignaciones 
			WHERE orden_id = $1
		)
	`

	err := config.DB.QueryRow(query, ordenID).Scan(&existe)
	if err != nil {
		return false, err
	}

	return existe, nil
}

func InsertarAsignacion(req models.AsignarViajeRequest, fecha time.Time) error {
	query := `
		INSERT INTO asignaciones (orden_id, vehiculo_id, piloto_id, fecha_salida)
		VALUES ($1, $2, $3, $4)
	`

	_, err := config.DB.Exec(
		query,
		req.OrdenID,
		req.VehiculoID,
		req.PilotoID,
		fecha,
	)

	return err
}

func ExisteVehiculoPorPlaca(placa string) (bool, error) {
	var existe bool

	query := `
		SELECT EXISTS (
			SELECT 1 FROM vehiculos 
			WHERE LOWER(placa) = LOWER($1)
			  AND es_eliminado = false
		)
	`

	err := config.DB.QueryRow(query, placa).Scan(&existe)
	if err != nil {
		return false, err
	}

	return existe, nil
}

func InsertarVehiculo(req models.CrearCamionRequest) error {
	query := `
		INSERT INTO vehiculos (placa, tipo, capacidad)
		VALUES ($1, $2, $3)
	`

	_, err := config.DB.Exec(
		query,
		req.Placa,
		req.Tipo,
		req.Capacidad,
	)

	return err
}

func ObtenerCamiones() ([]models.VehiculoResponse, error) {
	var vehiculos []models.VehiculoResponse

	query := `
		SELECT 
			id,
			placa,
			tipo,
			capacidad
		FROM vehiculos
		WHERE es_eliminado = false
		ORDER BY id DESC
	`

	rows, err := config.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var v models.VehiculoResponse

		err := rows.Scan(
			&v.ID,
			&v.Placa,
			&v.Tipo,
			&v.Capacidad,
		)
		if err != nil {
			return nil, err
		}

		vehiculos = append(vehiculos, v)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return vehiculos, nil
}

func ExisteUsuarioPorCorreo(correo string) (bool, error) {
	var existe bool

	query := `
		SELECT EXISTS (
			SELECT 1 FROM usuarios 
			WHERE LOWER(correo) = LOWER($1)
			  AND es_eliminado = false
		)
	`

	err := config.DB.QueryRow(query, correo).Scan(&existe)
	return existe, err
}

func InsertarUsuario(req models.AgregarPilotoRequest) (int, error) {
	var userID int

	query := `
		INSERT INTO usuarios (nombre, correo, password, foto_perfil)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`

	err := config.DB.QueryRow(
		query,
		req.Nombre,
		req.Correo,
		req.Password,
		req.FotoPerfil,
	).Scan(&userID)

	return userID, err
}

func InsertarPiloto(usuarioID int, licencia string) error {
	query := `
		INSERT INTO pilotos (usuario_id, licencia)
		VALUES ($1, $2)
	`

	_, err := config.DB.Exec(query, usuarioID, licencia)
	return err
}

func AsignarRolPiloto(usuarioID int) error {
	query := `
		INSERT INTO usuario_rol (usuario_id, rol_id)
		VALUES ($1, 7) -- 7 = Piloto
	`

	_, err := config.DB.Exec(query, usuarioID)
	return err
}

func ExisteCliente(clienteID int) (bool, error) {
	var existe bool

	query := `
		SELECT EXISTS (
			SELECT 1 FROM clientes 
			WHERE id = $1 AND es_eliminado = false
		)
	`

	err := config.DB.QueryRow(query, clienteID).Scan(&existe)
	return existe, err
}

func ObtenerContrato(contratoID int) (int, bool, error) {
	var clienteID int
	var activo bool

	query := `
		SELECT cliente_id, activo
		FROM contratos
		WHERE id = $1 AND es_eliminado = false
	`

	err := config.DB.QueryRow(query, contratoID).Scan(&clienteID, &activo)
	if err != nil {
		return 0, false, err
	}

	return clienteID, activo, nil
}

func ExisteRuta(rutaID int) (bool, error) {
	var existe bool

	query := `
		SELECT EXISTS (
			SELECT 1 FROM rutas 
			WHERE id = $1 AND es_eliminado = false
		)
	`

	err := config.DB.QueryRow(query, rutaID).Scan(&existe)
	return existe, err
}

func ExisteEstadoOrden(estadoID int) (bool, error) {
	var existe bool

	query := `
		SELECT EXISTS (
			SELECT 1 FROM estados_orden 
			WHERE id = $1
		)
	`

	err := config.DB.QueryRow(query, estadoID).Scan(&existe)
	return existe, err
}

func CerrarOrdenYGenerarBorradorFEL(ordenID int) (*models.CerrarOrdenResponse, error) {
	tx, err := config.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var estadoAnterior string
	err = tx.QueryRow(`
		SELECT eo.nombre
		FROM ordenes_servicio os
		INNER JOIN estados_orden eo ON eo.id = os.estado_id
		WHERE os.id = $1
			AND os.es_eliminado = FALSE
	`, ordenID).Scan(&estadoAnterior)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}

	yaEntregado := estadoAnterior == "Entregado"

	if !yaEntregado {
		var estadoEntregadoID int
		err = tx.QueryRow(`
			SELECT id
			FROM estados_orden
			WHERE nombre = 'Entregado'
			LIMIT 1
		`).Scan(&estadoEntregadoID)
		if err != nil {
			return nil, err
		}

		_, err = tx.Exec(`
			UPDATE ordenes_servicio
			SET estado_id = $1
			WHERE id = $2
				AND es_eliminado = FALSE
		`, estadoEntregadoID, ordenID)
		if err != nil {
			return nil, err
		}
	}

	var facturaExistenteID int
	err = tx.QueryRow(`
		SELECT id
		FROM facturas
		WHERE orden_id = $1
			AND es_eliminado = FALSE
		ORDER BY id DESC
		LIMIT 1
	`, ordenID).Scan(&facturaExistenteID)
	if err == nil {
		if err := tx.Commit(); err != nil {
			return nil, err
		}
		mensaje := "la orden se cerro, pero ya existia una factura para esta orden"
		if yaEntregado {
			mensaje = "la orden ya estaba entregada y ya existia una factura para esta orden"
		}
		return &models.CerrarOrdenResponse{
			OrdenID:          ordenID,
			Estado:           "Entregado",
			BorradorGenerado: false,
			FacturaID:        &facturaExistenteID,
			Mensaje:          mensaje,
		}, nil
	}
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	var clienteID int
	var distanciaKm float64
	var tarifaKm float64
	var descuentoPct float64

	err = tx.QueryRow(`
		SELECT
			os.cliente_id,
			COALESCE(r.distancia_km, 0) AS distancia_km,
			COALESCE(
				tar.precio_km,
				CASE UPPER(COALESCE(tar.tipo_unidad, ''))
					WHEN 'LIGERA' THEN 8.00
					WHEN 'PESADA' THEN 12.50
					WHEN 'CABEZAL' THEN 18.00
					ELSE 0
				END
			) AS tarifa_km,
			COALESCE(ct.descuento, 0) AS descuento_pct
		FROM ordenes_servicio os
		INNER JOIN contratos ct ON ct.id = os.contrato_id
			AND ct.es_eliminado = FALSE
		INNER JOIN rutas r ON r.id = os.ruta_id
			AND r.es_eliminado = FALSE
		LEFT JOIN contrato_ruta cr ON cr.contrato_id = os.contrato_id
			AND cr.ruta_id = os.ruta_id
		LEFT JOIN tarifarios tar ON tar.id = cr.tarifario_id
			AND tar.es_eliminado = FALSE
		WHERE os.id = $1
			AND os.es_eliminado = FALSE
	`, ordenID).Scan(&clienteID, &distanciaKm, &tarifaKm, &descuentoPct)
	if err != nil {
		return nil, err
	}

	if tarifaKm <= 0 {
		return nil, fmt.Errorf("no se pudo determinar la tarifa por km para la orden %d", ordenID)
	}

	subtotalBruto := distanciaKm * tarifaKm
	descuentoMonto := subtotalBruto * (descuentoPct / 100.0)
	subtotal := subtotalBruto - descuentoMonto
	if subtotal < 0 {
		subtotal = 0
	}
	iva := subtotal * 0.12
	montoTotal := subtotal + iva

	subtotal = redondear2FEL(subtotal)
	iva = redondear2FEL(iva)
	montoTotal = redondear2FEL(montoTotal)

	var nuevaFacturaID int
	err = tx.QueryRow(`
		INSERT INTO facturas (orden_id, cliente_id, total, iva, uuid, fecha, estado, es_eliminado)
		VALUES ($1, $2, $3, $4, '', NOW(), 'Borrador', FALSE)
		RETURNING id
	`, ordenID, clienteID, subtotal, iva).Scan(&nuevaFacturaID)
	if err != nil {
		return nil, err
	}

	descripcion := fmt.Sprintf(
		"Borrador FEL auto por orden #%d: %.2f km x Q%.2f/km, descuento %.2f%%",
		ordenID,
		distanciaKm,
		tarifaKm,
		descuentoPct,
	)

	_, err = tx.Exec(`
		INSERT INTO detalle_factura (factura_id, descripcion, monto)
		VALUES ($1, $2, $3)
	`, nuevaFacturaID, descripcion, montoTotal)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return &models.CerrarOrdenResponse{
		OrdenID:          ordenID,
		Estado:           "Entregado",
		BorradorGenerado: true,
		FacturaID:        &nuevaFacturaID,
		Subtotal:         subtotal,
		IVA:              iva,
		MontoTotal:       montoTotal,
		Mensaje:          "orden cerrada y borrador FEL generado automaticamente",
	}, nil
}

func redondear2FEL(valor float64) float64 {
	return math.Round(valor*100) / 100
}

func InsertarOrden(req models.CrearOrdenRequest) error {
	query := `
		INSERT INTO ordenes_servicio 
		(cliente_id, contrato_id, ruta_id, estado_id, peso)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := config.DB.Exec(
		query,
		req.ClienteID,
		req.ContratoID,
		req.RutaID,
		req.EstadoID,
		req.Peso,
	)

	return err
}

func ObtenerPilotos() ([]models.PilotoResponse, error) {
	var pilotos []models.PilotoResponse

	query := `
		SELECT 
			p.id,
			u.id,
			p.licencia,
			COALESCE(u.nombre, ''),
			COALESCE(u.foto_perfil, '')
		FROM pilotos p
		INNER JOIN usuarios u ON p.usuario_id = u.id
		WHERE p.es_eliminado = false
		  AND u.es_eliminado = false
		ORDER BY p.id DESC
	`

	rows, err := config.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var p models.PilotoResponse

		err := rows.Scan(
			&p.PilotoID,
			&p.UsuarioID,
			&p.Licencia,
			&p.Nombre,
			&p.FotoPerfil,
		)
		if err != nil {
			return nil, err
		}

		pilotos = append(pilotos, p)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return pilotos, nil
}

func ObtenerHistorialPiloto(pilotoID int) (string, []models.ViajePiloto, error) {
	var nombre string
	var viajes []models.ViajePiloto

	query := `
		SELECT 
			u.nombre,
			o.id,
			a.fecha_salida,
			r.origen,
			r.destino,
			r.distancia_km,
			o.peso,
			v.placa
		FROM pilotos p
		INNER JOIN usuarios u ON p.usuario_id = u.id
		LEFT JOIN asignaciones a ON p.id = a.piloto_id
		LEFT JOIN ordenes_servicio o ON a.orden_id = o.id
		LEFT JOIN rutas r ON o.ruta_id = r.id
		LEFT JOIN vehiculos v ON a.vehiculo_id = v.id
		WHERE p.id = $1
		AND p.es_eliminado = false
		ORDER BY a.fecha_salida DESC
	`

	rows, err := config.DB.Query(query, pilotoID)
	if err != nil {
		return "", nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var viaje models.ViajePiloto
		var fecha sql.NullTime
		var origen, destino sql.NullString
		var distancia sql.NullFloat64
		var peso sql.NullFloat64
		var placa sql.NullString

		err := rows.Scan(
			&nombre,
			&viaje.ID,
			&fecha,
			&origen,
			&destino,
			&distancia,
			&peso,
			&placa,
		)
		if placa.Valid {
			viaje.Placa = placa.String
		}
		if err != nil {
			return "", nil, err
		}

		if viaje.ID == 0 {
			continue
		}

		if fecha.Valid {
			viaje.Fecha = fecha.Time.Format("2006-01-02")
		}

		if origen.Valid {
			viaje.Origen = origen.String
		}

		if destino.Valid {
			viaje.Destino = destino.String
		}

		if distancia.Valid {
			viaje.Distancia = distancia.Float64
		}

		if peso.Valid {
			viaje.Peso = peso.Float64
		}

		viajes = append(viajes, viaje)
	}

	if err = rows.Err(); err != nil {
		return "", nil, err
	}

	return nombre, viajes, nil
}

func ObtenerBitacora() ([]models.BitacoraViajeResponse, error) {
	var viajes []models.BitacoraViajeResponse

	query := `
		SELECT 
			o.id,
			a.fecha_salida,
			r.origen,
			r.destino,
			r.distancia_km,
			o.peso,
			p.id,
			u.nombre
		FROM asignaciones a
		LEFT JOIN ordenes_servicio o ON a.orden_id = o.id
		LEFT JOIN rutas r ON o.ruta_id = r.id
		LEFT JOIN pilotos p ON a.piloto_id = p.id
		LEFT JOIN usuarios u ON p.usuario_id = u.id
		WHERE o.es_eliminado = false
		ORDER BY a.fecha_salida DESC
	`

	rows, err := config.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var viaje models.BitacoraViajeResponse

		var id sql.NullInt64
		var fecha sql.NullTime
		var origen, destino sql.NullString
		var distancia sql.NullFloat64
		var peso sql.NullFloat64
		var pilotoID sql.NullInt64
		var nombrePiloto sql.NullString

		err := rows.Scan(
			&id,
			&fecha,
			&origen,
			&destino,
			&distancia,
			&peso,
			&pilotoID,
			&nombrePiloto,
		)
		if err != nil {
			return nil, err
		}

		if !id.Valid {
			continue
		}

		viaje.ID = int(id.Int64)

		if fecha.Valid {
			viaje.Fecha = fecha.Time.Format("2006-01-02")
		}

		if origen.Valid {
			viaje.Origen = origen.String
		}

		if destino.Valid {
			viaje.Destino = destino.String
		}

		if distancia.Valid {
			viaje.Distancia = distancia.Float64
		}

		if peso.Valid {
			viaje.Peso = peso.Float64
		}

		if pilotoID.Valid {
			viaje.PilotoID = int(pilotoID.Int64)
		}

		if nombrePiloto.Valid {
			viaje.NombrePiloto = nombrePiloto.String
		}

		viajes = append(viajes, viaje)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return viajes, nil
}

func ObtenerContratos() ([]models.ContratoResponse, error) {
	var contratos []models.ContratoResponse

	query := `
		SELECT 
			c.id,
			u.nombre,
			r.origen,
			r.destino,
			c.activo
		FROM contratos c
		INNER JOIN clientes cl ON c.cliente_id = cl.id
		INNER JOIN usuarios u ON cl.usuario_id = u.id
		LEFT JOIN contrato_ruta cr ON c.id = cr.contrato_id
		LEFT JOIN rutas r ON cr.ruta_id = r.id
		WHERE c.es_eliminado = false
		ORDER BY c.id DESC
	`

	rows, err := config.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var contrato models.ContratoResponse
		var origen, destino sql.NullString

		err := rows.Scan(
			&contrato.ID,
			&contrato.NombreCliente,
			&origen,
			&destino,
			&contrato.Activo,
		)
		if err != nil {
			return nil, err
		}

		if origen.Valid {
			contrato.Origen = origen.String
		}

		if destino.Valid {
			contrato.Destino = destino.String
		}

		contratos = append(contratos, contrato)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return contratos, nil
}

func ObtenerClientes() ([]models.ClienteResponse, error) {
	var clientes []models.ClienteResponse

	query := `
		SELECT 
			c.id,
			u.id,
			u.nombre,
			u.correo,
			COALESCE(c.telefono, '')
		FROM clientes c
		INNER JOIN usuarios u ON c.usuario_id = u.id
		WHERE c.es_eliminado = false
		  AND u.es_eliminado = false
		ORDER BY c.id DESC
	`

	rows, err := config.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var cliente models.ClienteResponse

		err := rows.Scan(
			&cliente.ClienteID,
			&cliente.UsuarioID,
			&cliente.Nombre,
			&cliente.Correo,
			&cliente.Telefono,
		)
		if err != nil {
			return nil, err
		}

		clientes = append(clientes, cliente)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return clientes, nil
}

func ObtenerViajesPorSalir() ([]models.BitacoraViajeResponse, error) {
	var viajes []models.BitacoraViajeResponse

	query := `
		SELECT 
			o.id,
			a.fecha_salida,
			r.origen,
			r.destino,
			r.distancia_km,
			o.peso,
			p.id,
			u.nombre,
			v.placa
		FROM asignaciones a
		INNER JOIN ordenes_servicio o ON a.orden_id = o.id
		LEFT JOIN rutas r ON o.ruta_id = r.id
		LEFT JOIN pilotos p ON a.piloto_id = p.id
		LEFT JOIN usuarios u ON p.usuario_id = u.id
		LEFT JOIN vehiculos v ON a.vehiculo_id = v.id
		WHERE 
			o.es_eliminado = false
			AND a.fecha_salida IS NOT NULL
			AND a.fecha_salida >= (NOW() AT TIME ZONE 'America/Guatemala')::DATE
		ORDER BY a.fecha_salida ASC
	`

	rows, err := config.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var viaje models.BitacoraViajeResponse

		var id sql.NullInt64
		var fecha sql.NullTime
		var origen, destino sql.NullString
		var distancia sql.NullFloat64
		var peso sql.NullFloat64
		var pilotoID sql.NullInt64
		var nombrePiloto sql.NullString
		var placa sql.NullString

		err := rows.Scan(
			&id,
			&fecha,
			&origen,
			&destino,
			&distancia,
			&peso,
			&pilotoID,
			&nombrePiloto,
			&placa,
		)

		if placa.Valid {
			viaje.Placa = placa.String
		}

		if err != nil {
			return nil, err
		}

		if !id.Valid {
			continue
		}

		viaje.ID = int(id.Int64)

		if fecha.Valid {
			viaje.Fecha = fecha.Time.Format("2006-01-02")
		}

		if origen.Valid {
			viaje.Origen = origen.String
		}

		if destino.Valid {
			viaje.Destino = destino.String
		}

		if distancia.Valid {
			viaje.Distancia = distancia.Float64
		}

		if peso.Valid {
			viaje.Peso = peso.Float64
		}

		if pilotoID.Valid {
			viaje.PilotoID = int(pilotoID.Int64)
		}

		if nombrePiloto.Valid {
			viaje.NombrePiloto = nombrePiloto.String
		}

		viajes = append(viajes, viaje)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return viajes, nil
}

func GenerarOrdenServicioOperativo(req models.GenerarOrdenOperativoRequest) (*models.GenerarOrdenOperativoResponse, error) {
	tx, err := config.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var clienteID int
	var limiteCredito float64
	var riesgo string
	err = tx.QueryRow(`
		SELECT c.id, COALESCE(c.limite_credito, 0), COALESCE(c.riesgo, '')
		FROM clientes c
		INNER JOIN usuarios u ON u.id = c.usuario_id AND u.es_eliminado = FALSE
		WHERE c.id = $1 AND c.es_eliminado = FALSE
	`, req.ClienteID).Scan(&clienteID, &limiteCredito, &riesgo)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("cliente no encontrado")
		}
		return nil, err
	}

	if strings.EqualFold(strings.TrimSpace(riesgo), "ALTO") {
		return nil, errors.New("cliente bloqueado por riesgo alto")
	}

	var contratoID int
	err = tx.QueryRow(`
		SELECT id
		FROM contratos
		WHERE cliente_id = $1
			AND activo = TRUE
			AND es_eliminado = FALSE
			AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin
		ORDER BY fecha_inicio DESC
		LIMIT 1
	`, clienteID).Scan(&contratoID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("cliente sin contrato vigente")
		}
		return nil, err
	}

	var rutaID int
	err = tx.QueryRow(`
		SELECT r.id
		FROM contrato_ruta cr
		INNER JOIN rutas r ON r.id = cr.ruta_id
		WHERE cr.contrato_id = $1
			AND r.es_eliminado = FALSE
			AND LOWER(TRIM(r.origen)) = LOWER(TRIM($2))
			AND LOWER(TRIM(r.destino)) = LOWER(TRIM($3))
		LIMIT 1
	`, contratoID, req.Origen, req.Destino).Scan(&rutaID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("ruta no autorizada por contrato")
		}
		return nil, err
	}

	var deudaPendiente float64
	err = tx.QueryRow(`
		SELECT COALESCE(SUM((f.total + f.iva) - COALESCE(p.total_pagado, 0)), 0)
		FROM facturas f
		LEFT JOIN (
			SELECT factura_id, SUM(monto) AS total_pagado
			FROM pagos
			WHERE es_eliminado = FALSE
			GROUP BY factura_id
		) p ON p.factura_id = f.id
		WHERE f.cliente_id = $1
			AND f.es_eliminado = FALSE
	`, clienteID).Scan(&deudaPendiente)
	if err != nil {
		return nil, err
	}

	creditoDisponible := limiteCredito - deudaPendiente
	if creditoDisponible <= 0 {
		return nil, errors.New("credito no disponible")
	}

	var estadoID int
	err = tx.QueryRow(`
		SELECT id
		FROM estados_orden
		WHERE LOWER(nombre) = LOWER('Listo para Despacho')
		LIMIT 1
	`).Scan(&estadoID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("estado operativo no configurado")
		}
		return nil, err
	}

	var ordenID int
	var fechaCreacion time.Time
	err = tx.QueryRow(`
		INSERT INTO ordenes_servicio (cliente_id, contrato_id, ruta_id, estado_id, peso, es_eliminado)
		VALUES ($1, $2, $3, $4, $5, FALSE)
		RETURNING id, fecha_creacion
	`, clienteID, contratoID, rutaID, estadoID, req.Peso).Scan(&ordenID, &fechaCreacion)
	if err != nil {
		return nil, err
	}

	if _, err = tx.Exec(`
		INSERT INTO bitacora_orden (orden_id, descripcion)
		VALUES ($1, $2)
	`, ordenID, "ORDEN_GENERADA_AUTOMATICAMENTE_OPERATIVO"); err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return &models.GenerarOrdenOperativoResponse{
		OrdenID:    ordenID,
		Codigo:     "OS-" + fechaCreacion.Format("2006") + "-" + strings.TrimSpace(fmt.Sprintf("%d", ordenID)),
		ClienteID:  clienteID,
		ContratoID: contratoID,
		RutaID:     rutaID,
		Estado:     "Listo para despacho",
		Peso:       req.Peso,
	}, nil
}

func ObtenerCapacidadPorPlaca(placa string) (float64, error) {
	var capacidad sql.NullFloat64

	query := `
		SELECT capacidad
		FROM vehiculos
		WHERE LOWER(placa) = LOWER($1)
		  AND es_eliminado = false
	`

	err := config.DB.QueryRow(query, placa).Scan(&capacidad)
	if err != nil {
		return 0, err
	}

	if !capacidad.Valid {
		return 0, nil
	}

	return capacidad.Float64, nil
}

func ObtenerFacturaParaEnvio(id int) (models.FacturaEnvio, error) {
	var factura models.FacturaEnvio

	query := `
		SELECT 
			f.id,
			f.total,
			f.iva,
			f.estado,
			COALESCE(c.nit, ''),
			COALESCE(u.correo, ''),
			COALESCE(u.nombre, ''),
			COALESCE(c.direccion, ''),
			TO_CHAR(f.fecha, 'YYYY-MM-DD')
		FROM facturas f
		JOIN clientes c ON f.cliente_id = c.id
		JOIN usuarios u ON c.usuario_id = u.id
		WHERE f.id = $1
		  AND f.es_eliminado = false
	`

	err := config.DB.QueryRow(query, id).Scan(
		&factura.ID,
		&factura.Total,
		&factura.IVA,
		&factura.Estado,
		&factura.NIT,
		&factura.Correo,
		&factura.Nombre,
		&factura.DireccionFiscal,
		&factura.Fecha,
	)

	if err != nil {
		return factura, err
	}

	return factura, nil
}

func ActualizarFacturaCertificada(id int, uuid string) error {
	query := `
		UPDATE facturas
		SET uuid = $1,
		    estado = 'certificada pendiente de pago'
		WHERE id = $2
	`

	_, err := config.DB.Exec(query, uuid, id)
	return err
}

func ObtenerOrdenIDPorPlaca(placa string) (int, error) {
	query := `
		SELECT o.id
		FROM vehiculos v
		INNER JOIN asignaciones a ON v.id = a.vehiculo_id
		INNER JOIN ordenes_servicio o ON a.orden_id = o.id
		WHERE v.placa = $1
		AND o.es_eliminado = false
		ORDER BY o.fecha_creacion DESC
		LIMIT 1
	`

	var ordenID sql.NullInt64

	err := config.DB.QueryRow(query, placa).Scan(&ordenID)
	if err != nil {
		return 0, err
	}

	if !ordenID.Valid {
		return 0, errors.New("no se encontro orden para la placa")
	}

	return int(ordenID.Int64), nil
}

func InsertarEvento(ordenID int, req models.ReportarEventoRequest) error {
	query := `
		INSERT INTO evidencia_entrega (orden_id, tipo, archivo)
		VALUES ($1, $2, $3)
	`

	var archivo interface{}

	if req.Foto != "" {
		archivo = req.Foto
	} else {
		archivo = nil
	}

	_, err := config.DB.Exec(query, ordenID, req.Tipo, archivo)
	if err != nil {
		return err
	}

	return nil
}

func ObtenerEstadoOrden(idOrden int) (string, error) {
	query := `
		SELECT e.nombre
		FROM ordenes_servicio o
		INNER JOIN estados_orden e ON o.estado_id = e.id
		WHERE o.id = $1
		AND o.es_eliminado = false
	`

	var estado sql.NullString

	err := config.DB.QueryRow(query, idOrden).Scan(&estado)
	if err != nil {
		return "", err
	}

	if !estado.Valid {
		return "", errors.New("orden no encontrada")
	}

	return estado.String, nil
}

func CancelarOrden(idOrden int) error {

	query := `
		UPDATE ordenes_servicio
		SET estado_id = (
			SELECT id FROM estados_orden WHERE nombre = 'Cancelado'
		)
		WHERE id = $1
	`

	_, err := config.DB.Exec(query, idOrden)
	if err != nil {
		return err
	}

	return nil
}

func ActualizarEstadoEnTransito(idOrden int) (string, error) {
	query := `
		UPDATE ordenes_servicio
		SET estado_id = (
			SELECT id FROM estados_orden WHERE nombre = 'En Transito'
		)
		WHERE id = $1
		RETURNING estado_id
	`

	var estadoID sql.NullInt64

	err := config.DB.QueryRow(query, idOrden).Scan(&estadoID)
	if err != nil {
		return "", err
	}

	if !estadoID.Valid {
		return "", errors.New("no se pudo actualizar el estado")
	}

	var nombreEstado sql.NullString

	queryEstado := `
		SELECT nombre FROM estados_orden WHERE id = $1
	`

	err = config.DB.QueryRow(queryEstado, estadoID.Int64).Scan(&nombreEstado)
	if err != nil {
		return "", err
	}

	if !nombreEstado.Valid {
		return "", errors.New("no se pudo obtener el estado")
	}

	return nombreEstado.String, nil
}

func ObtenerBitacoraPiloto(pilotoID int) (string, []models.EventoPiloto, error) {

	var eventos []models.EventoPiloto
	var nombre string

	query := `
		SELECT 
			u.nombre,
			o.id,
			b.descripcion,
			b.fecha,
			'bitacora' as tipo
		FROM pilotos p
		INNER JOIN usuarios u ON p.usuario_id = u.id
		INNER JOIN asignaciones a ON p.id = a.piloto_id
		INNER JOIN ordenes_servicio o ON a.orden_id = o.id
		INNER JOIN bitacora_orden b ON o.id = b.orden_id
		WHERE p.id = $1

		UNION ALL

		SELECT 
			u.nombre,
			o.id,
			e.tipo,
			e.fecha,
			'evidencia' as tipo
		FROM pilotos p
		INNER JOIN usuarios u ON p.usuario_id = u.id
		INNER JOIN asignaciones a ON p.id = a.piloto_id
		INNER JOIN ordenes_servicio o ON a.orden_id = o.id
		INNER JOIN evidencia_entrega e ON o.id = e.orden_id
		WHERE p.id = $1

		ORDER BY fecha DESC
	`

	rows, err := config.DB.Query(query, pilotoID)
	if err != nil {
		return "", nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var evento models.EventoPiloto

		var ordenID sql.NullInt64
		var descripcion sql.NullString
		var fecha sql.NullTime
		var tipo sql.NullString

		err := rows.Scan(
			&nombre,
			&ordenID,
			&descripcion,
			&fecha,
			&tipo,
		)
		if err != nil {
			return "", nil, err
		}

		if ordenID.Valid {
			evento.OrdenID = int(ordenID.Int64)
		}

		if descripcion.Valid {
			evento.Descripcion = descripcion.String
		}

		if fecha.Valid {
			evento.Fecha = fecha.Time.Format("2006-01-02 15:04")
		}

		if tipo.Valid {
			evento.Tipo = tipo.String
		}

		eventos = append(eventos, evento)
	}

	if err = rows.Err(); err != nil {
		return "", nil, err
	}

	return nombre, eventos, nil
}
