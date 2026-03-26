package repositories

import (
	"backend/config"
	"backend/internal/models"
	"database/sql"
	"errors"
	"strconv"
	"strings"
	"time"
)

type ClientProfileRepository struct{}

func NewClientProfileRepository() *ClientProfileRepository {
	return &ClientProfileRepository{}
}

func (r *ClientProfileRepository) validateDBConnection() error {
	if config.DB == nil {
		return errors.New("la conexion a base de datos no esta disponible")
	}

	return nil
}

func buildRiskString(riesgoGlobal string) string {
	return strings.ToUpper(strings.TrimSpace(riesgoGlobal))
}

func parseRiskString(riesgo string) (string, string, string, string) {
	capacidadPago := ""
	lavadoDinero := ""
	aduanas := ""
	riesgoGlobal := ""
	riesgo = strings.TrimSpace(riesgo)

	// Backward compatibility: if DB stores only one value (e.g. ALTO), treat it as global risk.
	if !strings.Contains(riesgo, "|") && !strings.Contains(riesgo, ":") {
		return "", "", "", riesgo
	}

	parts := strings.Split(riesgo, "|")
	for _, part := range parts {
		kv := strings.SplitN(part, ":", 2)
		if len(kv) != 2 {
			continue
		}

		switch strings.TrimSpace(kv[0]) {
		case "capacidad_pago":
			capacidadPago = strings.TrimSpace(kv[1])
		case "lavado_dinero":
			lavadoDinero = strings.TrimSpace(kv[1])
		case "aduanas":
			aduanas = strings.TrimSpace(kv[1])
		case "riesgo_global":
			riesgoGlobal = strings.TrimSpace(kv[1])
		case "CP":
			capacidadPago = strings.TrimSpace(kv[1])
		case "LD":
			lavadoDinero = strings.TrimSpace(kv[1])
		case "AD":
			aduanas = strings.TrimSpace(kv[1])
		case "RG":
			riesgoGlobal = strings.TrimSpace(kv[1])
		}
	}

	return capacidadPago, lavadoDinero, aduanas, riesgoGlobal
}

func (r *ClientProfileRepository) CreateClientProfile(req models.ModelCreateClientProfileRequest) (models.ModelClientRiskProfileResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ModelClientRiskProfileResponse{}, err
	}

	tx, err := config.DB.Begin()
	if err != nil {
		return models.ModelClientRiskProfileResponse{}, err
	}
	defer tx.Rollback()

	riskData := buildRiskString(req.RiesgoGlobal)

	var usuarioID int
	queryUser := `
		INSERT INTO usuarios (nombre, correo, password, foto_perfil, es_eliminado)
		VALUES ($1, $2, $3, $4, FALSE)
		RETURNING id;
	`
	err = tx.QueryRow(queryUser, req.Nombre, req.Correo, req.Password, req.FotoPerfil).Scan(&usuarioID)
	if err != nil {
		return models.ModelClientRiskProfileResponse{}, err
	}

	var rolClienteID int
	queryRole := `
		SELECT id
		FROM roles
		WHERE LOWER(nombre) = LOWER($1)
			AND (es_eliminado = FALSE OR es_eliminado IS NULL)
		LIMIT 1;
	`
	err = tx.QueryRow(queryRole, "Cliente").Scan(&rolClienteID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.ModelClientRiskProfileResponse{}, errors.New("no se encontro el rol de cliente")
		}
		return models.ModelClientRiskProfileResponse{}, err
	}

	queryUserRole := `
		INSERT INTO usuario_rol (usuario_id, rol_id)
		VALUES ($1, $2);
	`
	_, err = tx.Exec(queryUserRole, usuarioID, rolClienteID)
	if err != nil {
		return models.ModelClientRiskProfileResponse{}, err
	}

	var clienteID int
	queryClient := `
		INSERT INTO clientes (usuario_id, nit, direccion, telefono, riesgo, limite_credito, dias_credito, es_eliminado)
		VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
		RETURNING id;
	`
	err = tx.QueryRow(queryClient, usuarioID, req.Nit, req.Direccion, req.Telefono, riskData, req.LimiteCredito, req.DiasCredito).Scan(&clienteID)
	if err != nil {
		return models.ModelClientRiskProfileResponse{}, err
	}

	if err = tx.Commit(); err != nil {
		return models.ModelClientRiskProfileResponse{}, err
	}

	return models.ModelClientRiskProfileResponse{
		IDCliente:     clienteID,
		IDUsuario:     usuarioID,
		NombreEmpresa: req.Nombre,
		Correo:        req.Correo,
		Nit:           req.Nit,
		Direccion:     req.Direccion,
		Telefono:      req.Telefono,
		LimiteCredito: req.LimiteCredito,
		DiasCredito:   req.DiasCredito,
		CapacidadPago: req.CapacidadPago,
		LavadoDinero:  req.LavadoDinero,
		RiesgoAduanas: req.RiesgoAduanas,
		RiesgoGlobal:  req.RiesgoGlobal,
	}, nil
}

func (r *ClientProfileRepository) UpdateClientRiskProfile(clienteID int, req models.ModelUpdateClientRiskRequest, riesgoGlobal string) (models.ModelClientRiskProfileResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ModelClientRiskProfileResponse{}, err
	}

	riskData := buildRiskString(riesgoGlobal)

	query := `
		UPDATE clientes
		SET direccion = $1,
			telefono = $2,
			riesgo = $3,
			limite_credito = $4,
			dias_credito = $5
		WHERE id = $6 AND es_eliminado = FALSE;
	`

	result, err := config.DB.Exec(query, req.Direccion, req.Telefono, riskData, req.LimiteCredito, req.DiasCredito, clienteID)
	if err != nil {
		return models.ModelClientRiskProfileResponse{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.ModelClientRiskProfileResponse{}, err
	}
	if rowsAffected == 0 {
		return models.ModelClientRiskProfileResponse{}, errors.New("cliente no encontrado")
	}

	return r.GetClientRiskProfileByID(clienteID)
}

func (r *ClientProfileRepository) GetClientRiskProfileByID(clienteID int) (models.ModelClientRiskProfileResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ModelClientRiskProfileResponse{}, err
	}

	query := `
		SELECT
			c.id,
			u.id,
			u.nombre,
			u.correo,
			c.nit,
			c.direccion,
			c.telefono,
			c.limite_credito,
			c.dias_credito,
			c.riesgo
		FROM clientes c
		INNER JOIN usuarios u ON u.id = c.usuario_id
		WHERE c.id = $1
			AND c.es_eliminado = FALSE
			AND u.es_eliminado = FALSE;
	`

	var resp models.ModelClientRiskProfileResponse
	var riesgoRaw string
	err := config.DB.QueryRow(query, clienteID).Scan(
		&resp.IDCliente,
		&resp.IDUsuario,
		&resp.NombreEmpresa,
		&resp.Correo,
		&resp.Nit,
		&resp.Direccion,
		&resp.Telefono,
		&resp.LimiteCredito,
		&resp.DiasCredito,
		&riesgoRaw,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.ModelClientRiskProfileResponse{}, errors.New("cliente no encontrado")
		}
		return models.ModelClientRiskProfileResponse{}, err
	}

	resp.CapacidadPago, resp.LavadoDinero, resp.RiesgoAduanas, resp.RiesgoGlobal = parseRiskString(riesgoRaw)

	return resp, nil
}

func (r *ClientProfileRepository) ResolveClientID(referenceID int) (int, error) {
	if err := r.validateDBConnection(); err != nil {
		return 0, err
	}

	query := `
		SELECT c.id
		FROM clientes c
		WHERE c.es_eliminado = FALSE
			AND (c.id = $1 OR c.usuario_id = $1)
		ORDER BY CASE WHEN c.id = $1 THEN 0 ELSE 1 END
		LIMIT 1;
	`

	var clienteID int
	err := config.DB.QueryRow(query, referenceID).Scan(&clienteID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, errors.New("cliente no encontrado")
		}
		return 0, err
	}

	return clienteID, nil
}

func (r *ClientProfileRepository) GetActiveContractID(clienteID int) (*int, error) {
	if err := r.validateDBConnection(); err != nil {
		return nil, err
	}

	query := `
		SELECT id
		FROM contratos
		WHERE cliente_id = $1
			AND activo = TRUE
			AND es_eliminado = FALSE
			AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin
		ORDER BY fecha_inicio DESC
		LIMIT 1;
	`

	var contratoID int
	err := config.DB.QueryRow(query, clienteID).Scan(&contratoID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &contratoID, nil
}

// GetOperativeSummary obtiene el resumen operativo del cliente
func (r *ClientProfileRepository) GetOperativeSummary(clienteID int) (models.ResumenOperativo, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ResumenOperativo{}, err
	}

	var summary models.ResumenOperativo
	query := `
		SELECT 
			COALESCE(SUM(CASE WHEN eo.nombre IN ('Registrada', 'Listo para Despacho') THEN 1 ELSE 0 END), 0) as ordenes_activas,
			COALESCE(SUM(CASE WHEN eo.nombre = 'En Transito' THEN 1 ELSE 0 END), 0) as ordenes_en_transito,
			COALESCE(SUM(CASE WHEN eo.nombre = 'Entregado' THEN 1 ELSE 0 END), 0) as ordenes_completadas
		FROM ordenes_servicio os
		INNER JOIN estados_orden eo ON os.estado_id = eo.id
		WHERE os.cliente_id = $1 AND os.es_eliminado = FALSE;
	`

	err := config.DB.QueryRow(query, clienteID).Scan(
		&summary.OrdenesActivas,
		&summary.OrdenesEnTransito,
		&summary.OrdenesCompletadas,
	)

	if err != nil {
		return models.ResumenOperativo{}, err
	}

	return summary, nil
}

// GetFinancialSummary obtiene el resumen financiero del cliente
func (r *ClientProfileRepository) GetFinancialSummary(clienteID int) (models.ResumenFinanciero, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ResumenFinanciero{}, err
	}

	var summary models.ResumenFinanciero

	// Obtener facturas pendientes y vencidas
	queryFacturas := `
		SELECT 
			COALESCE(SUM(CASE WHEN CURRENT_DATE <= DATE(f.fecha + INTERVAL '30 days') THEN (f.total + f.iva) - COALESCE(p.total_pagado, 0) ELSE 0 END), 0) as facturas_pendientes,
			COALESCE(SUM(CASE WHEN CURRENT_DATE > DATE(f.fecha + INTERVAL '30 days') THEN (f.total + f.iva) - COALESCE(p.total_pagado, 0) ELSE 0 END), 0) as facturas_vencidas
		FROM facturas f
		LEFT JOIN (
			SELECT factura_id, SUM(monto) as total_pagado
			FROM pagos
			WHERE es_eliminado = FALSE
			GROUP BY factura_id
		) p ON f.id = p.factura_id
		WHERE f.cliente_id = $1 AND f.es_eliminado = FALSE;
	`

	err := config.DB.QueryRow(queryFacturas, clienteID).Scan(
		&summary.FacturasPendientesMonto,
		&summary.FacturasVencidasMonto,
	)

	if err != nil {
		return models.ResumenFinanciero{}, err
	}

	// Obtener límite de crédito y crédito disponible
	queryCliente := `
		SELECT limite_credito FROM clientes WHERE id = $1 AND es_eliminado = FALSE;
	`

	err = config.DB.QueryRow(queryCliente, clienteID).Scan(&summary.LimiteCredito)
	if err != nil {
		return models.ResumenFinanciero{}, err
	}

	// Crédito disponible = límite - (pendientes + vencidas)
	summary.CreditoDisponible = summary.LimiteCredito - (summary.FacturasPendientesMonto + summary.FacturasVencidasMonto)
	if summary.CreditoDisponible < 0 {
		summary.CreditoDisponible = 0
	}

	return summary, nil
}

// GetClientAlerts obtiene las alertas del cliente
func (r *ClientProfileRepository) GetClientAlerts(clienteID int) ([]models.Alerta, error) {
	if err := r.validateDBConnection(); err != nil {
		return nil, err
	}

	var alertas []models.Alerta

	query := `
		SELECT id, mensaje, tipo, leido
		FROM notificaciones
		WHERE usuario_id = (SELECT usuario_id FROM clientes WHERE id = $1)
		AND leido = FALSE
		ORDER BY fecha DESC
		LIMIT 10;
	`

	rows, err := config.DB.Query(query, clienteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var alerta models.Alerta
		var leido bool
		err := rows.Scan(&alerta.ID, &alerta.Mensaje, &alerta.Tipo, &leido)
		if err != nil {
			return nil, err
		}

		// Asignar severidad basada en tipo
		switch alerta.Tipo {
		case "financiera":
			alerta.Severidad = "alta"
		case "contrato":
			alerta.Severidad = "media"
		default:
			alerta.Severidad = "baja"
		}

		alerta.Fecha = new(strings.Builder).String() // timestamp será generado por BD

		alertas = append(alertas, alerta)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return alertas, nil
}

func (r *ClientProfileRepository) GetLastDeliveredOrderAt(clienteID int) (string, error) {
	if err := r.validateDBConnection(); err != nil {
		return "", err
	}

	query := `
		SELECT os.fecha_creacion
		FROM ordenes_servicio os
		INNER JOIN estados_orden eo ON eo.id = os.estado_id
		WHERE os.cliente_id = $1
			AND os.es_eliminado = FALSE
			AND eo.nombre = 'Entregado'
		ORDER BY os.fecha_creacion DESC
		LIMIT 1;
	`

	var fecha sql.NullTime
	err := config.DB.QueryRow(query, clienteID).Scan(&fecha)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", nil
		}
		return "", err
	}

	if !fecha.Valid {
		return "", nil
	}

	return fecha.Time.Format(time.RFC3339), nil
}

func (r *ClientProfileRepository) GetOverdueInvoicesCount(clienteID int) (int, error) {
	if err := r.validateDBConnection(); err != nil {
		return 0, err
	}

	query := `
		SELECT COALESCE(COUNT(*), 0)
		FROM facturas f
		LEFT JOIN (
			SELECT factura_id, SUM(monto) AS total_pagado
			FROM pagos
			WHERE es_eliminado = FALSE
			GROUP BY factura_id
		) p ON p.factura_id = f.id
		WHERE f.cliente_id = $1
			AND f.es_eliminado = FALSE
			AND CURRENT_DATE > DATE(f.fecha + INTERVAL '30 days')
			AND ((f.total + f.iva) - COALESCE(p.total_pagado, 0)) > 0;
	`

	var total int
	err := config.DB.QueryRow(query, clienteID).Scan(&total)
	if err != nil {
		return 0, err
	}

	return total, nil
}

func (r *ClientProfileRepository) GetClientProfile(clienteID int) (models.ModelClientProfileViewResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ModelClientProfileViewResponse{}, err
	}

	query := `
		SELECT
			c.id,
			u.nombre,
			u.correo,
			c.nit,
			c.direccion,
			c.telefono
		FROM clientes c
		INNER JOIN usuarios u ON u.id = c.usuario_id
		WHERE c.id = $1
			AND c.es_eliminado = FALSE
			AND u.es_eliminado = FALSE;
	`

	var resp models.ModelClientProfileViewResponse
	err := config.DB.QueryRow(query, clienteID).Scan(
		&resp.ClienteID,
		&resp.NombreEmpresa,
		&resp.Correo,
		&resp.Nit,
		&resp.Direccion,
		&resp.Telefono,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.ModelClientProfileViewResponse{}, errors.New("cliente no encontrado")
		}
		return models.ModelClientProfileViewResponse{}, err
	}

	return resp, nil
}

func (r *ClientProfileRepository) PatchClientProfile(clienteID int, req models.ModelPatchClientProfileRequest) error {
	if err := r.validateDBConnection(); err != nil {
		return err
	}

	tx, err := config.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	queryUsuario := `
		UPDATE usuarios u
		SET nombre = $1
		FROM clientes c
		WHERE c.id = $2
			AND c.usuario_id = u.id
			AND c.es_eliminado = FALSE
			AND u.es_eliminado = FALSE;
	`
	resultUsuario, err := tx.Exec(queryUsuario, req.NombreEmpresa, clienteID)
	if err != nil {
		return err
	}

	rowsUsuario, err := resultUsuario.RowsAffected()
	if err != nil {
		return err
	}
	if rowsUsuario == 0 {
		return errors.New("cliente no encontrado")
	}

	queryCliente := `
		UPDATE clientes
		SET nit = $1,
			direccion = $2,
			telefono = $3
		WHERE id = $4
			AND es_eliminado = FALSE;
	`
	_, err = tx.Exec(queryCliente, req.Nit, req.Direccion, req.Telefono, clienteID)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "clientes_nit_key") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return errors.New("el nit ya existe")
		}
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

func (r *ClientProfileRepository) UpdateClientPassword(clienteID int, passwordActual string, passwordNueva string) error {
	if err := r.validateDBConnection(); err != nil {
		return err
	}

	queryGet := `
		SELECT u.password
		FROM usuarios u
		INNER JOIN clientes c ON c.usuario_id = u.id
		WHERE c.id = $1
			AND c.es_eliminado = FALSE
			AND u.es_eliminado = FALSE;
	`

	var currentPassword string
	err := config.DB.QueryRow(queryGet, clienteID).Scan(&currentPassword)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("cliente no encontrado")
		}
		return err
	}

	if currentPassword != passwordActual {
		return errors.New("passwordActual incorrecta")
	}

	queryUpdate := `
		UPDATE usuarios u
		SET password = $1
		FROM clientes c
		WHERE c.id = $2
			AND c.usuario_id = u.id
			AND c.es_eliminado = FALSE
			AND u.es_eliminado = FALSE;
	`

	_, err = config.DB.Exec(queryUpdate, passwordNueva, clienteID)
	if err != nil {
		return err
	}

	return nil
}

func (r *ClientProfileRepository) getRegisteredOrderStateID(tx *sql.Tx) (int, error) {
	query := `
		SELECT id
		FROM estados_orden
		WHERE LOWER(nombre) = LOWER($1)
		LIMIT 1;
	`

	var stateID int
	err := tx.QueryRow(query, "Registrada").Scan(&stateID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, errors.New("no se encontro estado Registrada")
		}
		return 0, err
	}

	return stateID, nil
}

func (r *ClientProfileRepository) getAuthorizedRouteID(tx *sql.Tx, contratoID int, origen string, destino string) (int, error) {
	query := `
		SELECT r.id
		FROM contrato_ruta cr
		INNER JOIN rutas r ON r.id = cr.ruta_id
		WHERE cr.contrato_id = $1
			AND r.es_eliminado = FALSE
			AND LOWER(TRIM(r.origen)) = LOWER(TRIM($2))
			AND LOWER(TRIM(r.destino)) = LOWER(TRIM($3))
		LIMIT 1;
	`

	var routeID int
	err := tx.QueryRow(query, contratoID, origen, destino).Scan(&routeID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, errors.New("la ruta no esta autorizada en el contrato vigente")
		}
		return 0, err
	}

	return routeID, nil
}

func (r *ClientProfileRepository) CreateClientRequestOrder(clienteID int, req models.ModelCreateClientRequestOrder) (models.ModelCreateClientRequestOrderResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ModelCreateClientRequestOrderResponse{}, err
	}

	tx, err := config.DB.Begin()
	if err != nil {
		return models.ModelCreateClientRequestOrderResponse{}, err
	}
	defer tx.Rollback()

	contratoID, err := r.GetActiveContractID(clienteID)
	if err != nil {
		return models.ModelCreateClientRequestOrderResponse{}, err
	}
	if contratoID == nil {
		return models.ModelCreateClientRequestOrderResponse{}, errors.New("el cliente no tiene contrato vigente")
	}

	routeID, err := r.getAuthorizedRouteID(tx, *contratoID, req.Origen, req.Destino)
	if err != nil {
		return models.ModelCreateClientRequestOrderResponse{}, err
	}

	stateID, err := r.getRegisteredOrderStateID(tx)
	if err != nil {
		return models.ModelCreateClientRequestOrderResponse{}, err
	}

	query := `
		INSERT INTO ordenes_servicio (cliente_id, contrato_id, ruta_id, estado_id, peso, es_eliminado)
		VALUES ($1, $2, $3, $4, $5, FALSE)
		RETURNING id, fecha_creacion;
	`

	var orderID int
	var fechaCreacion time.Time
	err = tx.QueryRow(query, clienteID, *contratoID, routeID, stateID, req.Peso).Scan(&orderID, &fechaCreacion)
	if err != nil {
		return models.ModelCreateClientRequestOrderResponse{}, err
	}

	if err = tx.Commit(); err != nil {
		return models.ModelCreateClientRequestOrderResponse{}, err
	}

	return models.ModelCreateClientRequestOrderResponse{
		SolicitudID: orderID,
		Codigo:      "OS-" + fechaCreacion.Format("2006") + "-" + strings.TrimSpace(strconv.Itoa(orderID)),
		Fecha:       fechaCreacion.Format("2006-01-02"),
		Estado:      "Registrada",
	}, nil
}

func (r *ClientProfileRepository) GetClientAuthorizedRoutes(clienteID int) ([]models.ModelClientAuthorizedRouteItem, error) {
	if err := r.validateDBConnection(); err != nil {
		return nil, err
	}

	contratoID, err := r.GetActiveContractID(clienteID)
	if err != nil {
		return nil, err
	}
	if contratoID == nil {
		return nil, errors.New("el cliente no tiene contrato vigente")
	}

	query := `
		SELECT r.id, COALESCE(r.origen, ''), COALESCE(r.destino, '')
		FROM contrato_ruta cr
		INNER JOIN rutas r ON r.id = cr.ruta_id
		WHERE cr.contrato_id = $1
			AND r.es_eliminado = FALSE
		ORDER BY r.origen, r.destino;
	`

	rows, err := config.DB.Query(query, *contratoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	routes := make([]models.ModelClientAuthorizedRouteItem, 0)
	for rows.Next() {
		var item models.ModelClientAuthorizedRouteItem
		item.Contrato = *contratoID

		if err = rows.Scan(&item.RutaID, &item.Origen, &item.Destino); err != nil {
			return nil, err
		}

		routes = append(routes, item)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return routes, nil
}

func (r *ClientProfileRepository) GetClientRequestOrderHistory(clienteID int) ([]models.ModelClientRequestOrderHistoryItem, error) {
	if err := r.validateDBConnection(); err != nil {
		return nil, err
	}

	query := `
		SELECT
			os.id,
			COALESCE(r.origen, ''),
			COALESCE(r.destino, ''),
			COALESCE(os.peso, 0),
			COALESCE(eo.nombre, 'Registrada'),
			os.fecha_creacion
		FROM ordenes_servicio os
		LEFT JOIN rutas r ON r.id = os.ruta_id
		LEFT JOIN estados_orden eo ON eo.id = os.estado_id
		WHERE os.cliente_id = $1
			AND os.es_eliminado = FALSE
		ORDER BY os.fecha_creacion DESC, os.id DESC;
	`

	rows, err := config.DB.Query(query, clienteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.ModelClientRequestOrderHistoryItem, 0)
	for rows.Next() {
		var item models.ModelClientRequestOrderHistoryItem
		var fecha time.Time
		err = rows.Scan(
			&item.SolicitudID,
			&item.Origen,
			&item.Destino,
			&item.Peso,
			&item.Estado,
			&fecha,
		)
		if err != nil {
			return nil, err
		}

		item.TipoCarga = inferCargoType(item.Peso)
		item.Codigo = "OS-" + fecha.Format("2006") + "-" + strings.TrimSpace(strconv.Itoa(item.SolicitudID))
		item.Fecha = fecha.Format("2006-01-02")

		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func inferCargoType(peso float64) string {
	if peso <= 1500 {
		return "Unidad Ligera"
	}
	if peso <= 6000 {
		return "Unidad Pesada"
	}
	return "Cabezal"
}

func (r *ClientProfileRepository) GetClientTrackingRaw(clienteID int) ([]models.ModelClientTrackingRawItem, error) {
	if err := r.validateDBConnection(); err != nil {
		return nil, err
	}

	query := `
		SELECT
			os.id,
			os.fecha_creacion,
			COALESCE(eo.nombre, 'Registrada') AS estado,
			COALESCE(rt.origen, '') AS origen,
			COALESCE(rt.destino, '') AS destino,
			CASE WHEN EXISTS (
				SELECT 1
				FROM evidencia_entrega ee
				WHERE ee.orden_id = os.id
					AND ee.es_eliminado = FALSE
			) THEN TRUE ELSE FALSE END AS tiene_evidencia,
			CASE WHEN EXISTS (
				SELECT 1
				FROM bitacora_orden bo
				WHERE bo.orden_id = os.id
					AND bo.descripcion = 'RECEPCION_CONFIRMADA_CLIENTE'
			) THEN TRUE ELSE FALSE END AS recepcion_confirmada
		FROM ordenes_servicio os
		LEFT JOIN estados_orden eo ON eo.id = os.estado_id
		LEFT JOIN rutas rt ON rt.id = os.ruta_id
		WHERE os.cliente_id = $1
			AND os.es_eliminado = FALSE
		ORDER BY os.fecha_creacion DESC, os.id DESC;
	`

	rows, err := config.DB.Query(query, clienteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.ModelClientTrackingRawItem, 0)
	for rows.Next() {
		var item models.ModelClientTrackingRawItem
		var fecha time.Time
		err = rows.Scan(
			&item.SolicitudID,
			&fecha,
			&item.Estado,
			&item.Origen,
			&item.Destino,
			&item.TieneEvidencia,
			&item.RecepcionConfirmada,
		)
		if err != nil {
			return nil, err
		}

		item.FechaCreacion = fecha.Format("2006-01-02")
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (r *ClientProfileRepository) ConfirmClientReception(clienteID int, solicitudID int) error {
	if err := r.validateDBConnection(); err != nil {
		return err
	}

	queryOrder := `
		SELECT COALESCE(eo.nombre, '')
		FROM ordenes_servicio os
		LEFT JOIN estados_orden eo ON eo.id = os.estado_id
		WHERE os.id = $1
			AND os.cliente_id = $2
			AND os.es_eliminado = FALSE
		LIMIT 1;
	`

	var estado string
	err := config.DB.QueryRow(queryOrder, solicitudID, clienteID).Scan(&estado)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("solicitud no encontrada para el cliente")
		}
		return err
	}

	if strings.ToLower(strings.TrimSpace(estado)) != "entregado" {
		return errors.New("solo puedes confirmar recepcion de ordenes entregadas")
	}

	queryExists := `
		SELECT EXISTS (
			SELECT 1
			FROM bitacora_orden
			WHERE orden_id = $1
				AND descripcion = 'RECEPCION_CONFIRMADA_CLIENTE'
		);
	`

	var exists bool
	err = config.DB.QueryRow(queryExists, solicitudID).Scan(&exists)
	if err != nil {
		return err
	}

	if exists {
		return nil
	}

	queryInsert := `
		INSERT INTO bitacora_orden (orden_id, descripcion)
		VALUES ($1, $2);
	`

	_, err = config.DB.Exec(queryInsert, solicitudID, "RECEPCION_CONFIRMADA_CLIENTE")
	if err != nil {
		return err
	}

	return nil
}

func (r *ClientProfileRepository) GetClientPaymentsData(clienteID int) (models.ModelClientPaymentsResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ModelClientPaymentsResponse{}, err
	}

	pendingQuery := `
		SELECT
			f.id,
			f.fecha,
			((f.total + f.iva) - COALESCE(p.total_pagado, 0)) AS saldo
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
			AND ((f.total + f.iva) - COALESCE(p.total_pagado, 0)) > 0
		ORDER BY f.fecha DESC, f.id DESC;
	`

	pendingRows, err := config.DB.Query(pendingQuery, clienteID)
	if err != nil {
		return models.ModelClientPaymentsResponse{}, err
	}
	defer pendingRows.Close()

	response := models.ModelClientPaymentsResponse{
		FacturasPendientes: make([]models.ModelClientPendingInvoice, 0),
		PagosHistorial:     make([]models.ModelClientPaymentHistoryItem, 0),
		TotalPendiente:     0,
	}

	for pendingRows.Next() {
		var item models.ModelClientPendingInvoice
		var fecha time.Time
		err = pendingRows.Scan(&item.FacturaID, &fecha, &item.Monto)
		if err != nil {
			return models.ModelClientPaymentsResponse{}, err
		}

		item.Numero = "FEL-" + fecha.Format("2006") + "-" + strconv.Itoa(item.FacturaID)
		item.Fecha = fecha.Format("2006-01-02")
		if item.Monto < 0 {
			item.Monto = 0
		}

		response.TotalPendiente += item.Monto
		response.FacturasPendientes = append(response.FacturasPendientes, item)
	}

	if err = pendingRows.Err(); err != nil {
		return models.ModelClientPaymentsResponse{}, err
	}

	historyQuery := `
		SELECT
			p.id,
			p.factura_id,
			p.fecha,
			p.monto,
			COALESCE(p.metodo, ''),
			COALESCE(p.numero_autorizacion, '')
		FROM pagos p
		INNER JOIN facturas f ON f.id = p.factura_id
		WHERE f.cliente_id = $1
			AND f.es_eliminado = FALSE
			AND p.es_eliminado = FALSE
			AND LOWER(COALESCE(p.estado, 'pendiente')) = 'pagado'
		ORDER BY p.fecha DESC, p.id DESC;
	`

	historyRows, err := config.DB.Query(historyQuery, clienteID)
	if err != nil {
		return models.ModelClientPaymentsResponse{}, err
	}
	defer historyRows.Close()

	for historyRows.Next() {
		var item models.ModelClientPaymentHistoryItem
		var fecha time.Time
		err = historyRows.Scan(
			&item.PagoID,
			&item.FacturaID,
			&fecha,
			&item.Monto,
			&item.Metodo,
			&item.Referencia,
		)
		if err != nil {
			return models.ModelClientPaymentsResponse{}, err
		}

		item.Fecha = fecha.Format("2006-01-02")
		response.PagosHistorial = append(response.PagosHistorial, item)
	}

	if err = historyRows.Err(); err != nil {
		return models.ModelClientPaymentsResponse{}, err
	}

	return response, nil
}

func (r *ClientProfileRepository) RegisterClientPaymentIntent(clienteID int, facturaID int) error {
	if err := r.validateDBConnection(); err != nil {
		return err
	}

	queryFactura := `
		SELECT
			((f.total + f.iva) - COALESCE(p.total_pagado, 0)) AS saldo
		FROM facturas f
		LEFT JOIN (
			SELECT factura_id, SUM(monto) AS total_pagado
			FROM pagos
			WHERE es_eliminado = FALSE
				AND LOWER(COALESCE(estado, 'pendiente')) = 'pagado'
			GROUP BY factura_id
		) p ON p.factura_id = f.id
		WHERE f.id = $1
			AND f.cliente_id = $2
			AND f.es_eliminado = FALSE
		LIMIT 1;
	`

	var saldo float64
	err := config.DB.QueryRow(queryFactura, facturaID, clienteID).Scan(&saldo)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("factura no encontrada para el cliente")
		}
		return err
	}

	if saldo <= 0 {
		return errors.New("la factura seleccionada no tiene saldo pendiente")
	}

	now := time.Now().UTC()
	reference := "INTENCION-" + strconv.FormatInt(now.Unix(), 10)

	insertQuery := `
		INSERT INTO pagos (factura_id, monto, metodo, banco, numero_autorizacion, estado, es_eliminado)
		VALUES ($1, $2, $3, $4, $5, $6, FALSE);
	`

	_, err = config.DB.Exec(insertQuery, facturaID, saldo, "transferencia", "por definir", reference, "pendiente")
	if err != nil {
		return err
	}

	return nil
}
