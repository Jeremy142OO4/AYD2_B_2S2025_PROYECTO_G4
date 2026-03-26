package repositories

import (
	"backend/config"
	"backend/internal/models"
	"database/sql"
	"errors"
	"strings"
)

type ContractDigitalRepository struct{}

func NewContractDigitalRepository() *ContractDigitalRepository {
	return &ContractDigitalRepository{}
}

func (r *ContractDigitalRepository) validateDBConnection() error {
	if config.DB == nil {
		return errors.New("la conexion a base de datos no esta disponible")
	}

	return nil
}

func (r *ContractDigitalRepository) CreateDigitalContract(req models.ModelCreateDigitalContractRequest) (models.ModelDigitalContractResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ModelDigitalContractResponse{}, err
	}

	tx, err := config.DB.Begin()
	if err != nil {
		return models.ModelDigitalContractResponse{}, err
	}
	defer tx.Rollback()

	if _, err = tx.Exec(`
		UPDATE clientes
		SET limite_credito = $1,
			dias_credito = $2
		WHERE id = $3 AND es_eliminado = FALSE;
	`, req.LimiteCredito, req.DiasCredito, req.ClienteID); err != nil {
		return models.ModelDigitalContractResponse{}, err
	}

	if _, err = tx.Exec(`
		UPDATE contratos
		SET activo = FALSE
		WHERE cliente_id = $1 AND es_eliminado = FALSE;
	`, req.ClienteID); err != nil {
		return models.ModelDigitalContractResponse{}, err
	}

	var contratoID int
	err = tx.QueryRow(`
		INSERT INTO contratos (cliente_id, fecha_inicio, fecha_fin, descuento, activo, es_eliminado)
		VALUES ($1, $2, $3, $4, TRUE, FALSE)
		RETURNING id;
	`, req.ClienteID, req.FechaInicio, req.FechaFin, req.Descuento).Scan(&contratoID)
	if err != nil {
		return models.ModelDigitalContractResponse{}, err
	}

	routes := make([]models.ModelDigitalContractRouteResponse, 0, len(req.RutasAutorizadas))
	for _, item := range req.RutasAutorizadas {
		rutaID, errRoute := r.getOrCreateRoute(tx, item)
		if errRoute != nil {
			return models.ModelDigitalContractResponse{}, errRoute
		}

		precio := 0.0
		if item.PrecioKm != nil {
			precio = *item.PrecioKm
		}

		var tarifarioID int
		errRoute = tx.QueryRow(`
			INSERT INTO tarifarios (tipo_unidad, peso_min, peso_max, precio_km, es_eliminado)
			VALUES ($1, $2, $3, $4, FALSE)
			RETURNING id;
		`, strings.ToUpper(strings.TrimSpace(item.TipoUnidad)), item.PesoMin, item.PesoMax, precio).Scan(&tarifarioID)
		if errRoute != nil {
			return models.ModelDigitalContractResponse{}, errRoute
		}

		if _, errRoute = tx.Exec(`
			INSERT INTO contrato_ruta (contrato_id, ruta_id, tarifario_id)
			VALUES ($1, $2, $3);
		`, contratoID, rutaID, tarifarioID); errRoute != nil {
			return models.ModelDigitalContractResponse{}, errRoute
		}

		routes = append(routes, models.ModelDigitalContractRouteResponse{
			RutaID:     rutaID,
			Origen:     item.Origen,
			Destino:    item.Destino,
			TipoUnidad: strings.ToUpper(strings.TrimSpace(item.TipoUnidad)),
			PesoMin:    item.PesoMin,
			PesoMax:    item.PesoMax,
			PrecioKm:   precio,
		})
	}

	if err = tx.Commit(); err != nil {
		return models.ModelDigitalContractResponse{}, err
	}

	return models.ModelDigitalContractResponse{
		ContratoID:       contratoID,
		ClienteID:        req.ClienteID,
		FechaInicio:      req.FechaInicio,
		FechaFin:         req.FechaFin,
		Descuento:        req.Descuento,
		LimiteCredito:    req.LimiteCredito,
		DiasCredito:      req.DiasCredito,
		RutasAutorizadas: routes,
	}, nil
}

func (r *ContractDigitalRepository) getOrCreateRoute(tx *sql.Tx, item models.ModelRouteAuthorizationInput) (int, error) {
	var rutaID int
	err := tx.QueryRow(`
		SELECT id
		FROM rutas
		WHERE LOWER(origen) = LOWER($1)
			AND LOWER(destino) = LOWER($2)
			AND es_eliminado = FALSE
		LIMIT 1;
	`, item.Origen, item.Destino).Scan(&rutaID)
	if err == nil {
		return rutaID, nil
	}

	if !errors.Is(err, sql.ErrNoRows) {
		return 0, err
	}

	distancia := 0.0
	if item.DistanciaKm != nil {
		distancia = *item.DistanciaKm
	}

	err = tx.QueryRow(`
		INSERT INTO rutas (origen, destino, distancia_km, es_eliminado)
		VALUES ($1, $2, $3, FALSE)
		RETURNING id;
	`, item.Origen, item.Destino, distancia).Scan(&rutaID)
	if err != nil {
		return 0, err
	}

	return rutaID, nil
}
