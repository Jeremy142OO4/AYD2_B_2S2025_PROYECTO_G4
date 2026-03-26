package repositories

import (
	"backend/config"
	"backend/internal/models"
	"database/sql"
	"errors"
)

type PilotRepository struct{}

func NewPilotRepository() *PilotRepository {
	return &PilotRepository{}
}

func (r *PilotRepository) validateDBConnection() error {
	if config.DB == nil {
		return errors.New("la conexion a base de datos no esta disponible")
	}
	return nil
}

// CreatePilot creates a new user and pilot in a transaction
func (r *PilotRepository) CreatePilot(req models.ModelCreatePilotRequest) (models.ModelPilotResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ModelPilotResponse{}, err
	}

	tx, err := config.DB.Begin()
	if err != nil {
		return models.ModelPilotResponse{}, errors.New("error al iniciar transaccion: " + err.Error())
	}
	defer tx.Rollback()

	// 1. Create user
	var userID int
	queryUser := `
		INSERT INTO usuarios (nombre, correo, password, foto_perfil, es_eliminado)
		VALUES ($1, $2, $3, $4, FALSE)
		RETURNING id;
	`
	err = tx.QueryRow(queryUser, req.Nombre, req.Correo, req.Password, req.FotoPerfil).Scan(&userID)

	if err != nil {
		if err.Error() == "pq: duplicate key value violates unique constraint \"usuarios_correo_key\"" {
			return models.ModelPilotResponse{}, errors.New("el correo ya esta registrado")
		}
		return models.ModelPilotResponse{}, errors.New("error al crear usuario: " + err.Error())
	}

	// 2. Create pilot
	var pilotID int
	queryPilot := `
		INSERT INTO pilotos (usuario_id, licencia, es_eliminado)
		VALUES ($1, $2, FALSE)
		RETURNING id;
	`
	err = tx.QueryRow(queryPilot, userID, req.Licencia).Scan(&pilotID)

	if err != nil {
		return models.ModelPilotResponse{}, errors.New("error al crear piloto: " + err.Error())
	}

	// 3. Assign "Piloto" role (role_id = 7)
	queryRole := `
		INSERT INTO usuario_rol (usuario_id, rol_id)
		VALUES ($1, 7);
	`
	_, err = tx.Exec(queryRole, userID)
	if err != nil {
		return models.ModelPilotResponse{}, errors.New("error al asignar rol: " + err.Error())
	}

	if err := tx.Commit(); err != nil {
		return models.ModelPilotResponse{}, errors.New("error al confirmar transaccion: " + err.Error())
	}

	response := models.ModelPilotResponse{
		IDPiloto:         pilotID,
		IDUsuario:        userID,
		Nombre:           req.Nombre,
		Correo:           req.Correo,
		FotoPerfil:       req.FotoPerfil,
		Licencia:         req.Licencia,
		UsuarioEliminado: false,
		PilotoEliminado:  false,
	}

	return response, nil
}

// GetPilotByID retrieves a pilot by ID
func (r *PilotRepository) GetPilotByID(pilotID int) (models.ModelPilotResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ModelPilotResponse{}, err
	}

	var response models.ModelPilotResponse
	var fotoPerfil sql.NullString

	query := `
		SELECT p.id, u.id, u.nombre, u.correo, u.foto_perfil, p.licencia, u.es_eliminado, p.es_eliminado
		FROM pilotos p
		INNER JOIN usuarios u ON p.usuario_id = u.id
		WHERE p.id = $1 AND p.es_eliminado = FALSE;
	`
	err := config.DB.QueryRow(query, pilotID).Scan(
		&response.IDPiloto,
		&response.IDUsuario,
		&response.Nombre,
		&response.Correo,
		&fotoPerfil,
		&response.Licencia,
		&response.UsuarioEliminado,
		&response.PilotoEliminado,
	)

	if err == sql.ErrNoRows {
		return models.ModelPilotResponse{}, errors.New("piloto no encontrado")
	}
	if err != nil {
		return models.ModelPilotResponse{}, errors.New("error al obtener piloto: " + err.Error())
	}

	if fotoPerfil.Valid {
		response.FotoPerfil = &fotoPerfil.String
	}

	return response, nil
}

// GetAllPilots retrieves all active pilots
func (r *PilotRepository) GetAllPilots() ([]models.ModelListPilotResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return nil, err
	}

	query := `
		SELECT p.id, u.id, u.nombre, u.correo, p.licencia
		FROM pilotos p
		INNER JOIN usuarios u ON p.usuario_id = u.id
		WHERE p.es_eliminado = FALSE
		ORDER BY u.nombre ASC;
	`
	rows, err := config.DB.Query(query)

	if err != nil {
		return nil, errors.New("error al obtener pilotos: " + err.Error())
	}
	defer rows.Close()

	var pilots []models.ModelListPilotResponse
	for rows.Next() {
		var pilot models.ModelListPilotResponse
		err := rows.Scan(
			&pilot.IDPiloto,
			&pilot.IDUsuario,
			&pilot.Nombre,
			&pilot.Correo,
			&pilot.Licencia,
		)
		if err != nil {
			return nil, errors.New("error al analizar pilotos: " + err.Error())
		}
		pilots = append(pilots, pilot)
	}

	if err = rows.Err(); err != nil {
		return nil, errors.New("error en consulta de pilotos: " + err.Error())
	}

	return pilots, nil
}

// UpdatePilot updates a pilot's information
func (r *PilotRepository) UpdatePilot(pilotID int, req models.ModelUpdatePilotRequest) (models.ModelPilotResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ModelPilotResponse{}, err
	}

	tx, err := config.DB.Begin()
	if err != nil {
		return models.ModelPilotResponse{}, errors.New("error al iniciar transaccion: " + err.Error())
	}
	defer tx.Rollback()

	// 1. Get user_id from pilot
	var userID int
	queryGetUser := `
		SELECT usuario_id FROM pilotos WHERE id = $1 AND es_eliminado = FALSE;
	`
	err = tx.QueryRow(queryGetUser, pilotID).Scan(&userID)

	if err == sql.ErrNoRows {
		return models.ModelPilotResponse{}, errors.New("piloto no encontrado")
	}
	if err != nil {
		return models.ModelPilotResponse{}, errors.New("error al obtener piloto: " + err.Error())
	}

	// 2. Update usuario
	queryUpdateUser := `
		UPDATE usuarios
		SET nombre = $1, correo = $2, foto_perfil = $3
		WHERE id = $4;
	`
	_, err = tx.Exec(queryUpdateUser, req.Nombre, req.Correo, req.FotoPerfil, userID)

	if err != nil {
		return models.ModelPilotResponse{}, errors.New("error al actualizar usuario: " + err.Error())
	}

	// 3. Update piloto
	queryUpdatePilot := `
		UPDATE pilotos
		SET licencia = $1
		WHERE id = $2;
	`
	_, err = tx.Exec(queryUpdatePilot, req.Licencia, pilotID)

	if err != nil {
		return models.ModelPilotResponse{}, errors.New("error al actualizar piloto: " + err.Error())
	}

	if err := tx.Commit(); err != nil {
		return models.ModelPilotResponse{}, errors.New("error al confirmar transaccion: " + err.Error())
	}

	// Return updated pilot
	return r.GetPilotByID(pilotID)
}

// DeletePilot soft-deletes a pilot
func (r *PilotRepository) DeletePilot(pilotID int) error {
	if err := r.validateDBConnection(); err != nil {
		return err
	}

	query := `
		UPDATE pilotos SET es_eliminado = TRUE WHERE id = $1;
	`
	result, err := config.DB.Exec(query, pilotID)

	if err != nil {
		return errors.New("error al eliminar piloto: " + err.Error())
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.New("error al verificar eliminacion: " + err.Error())
	}

	if rowsAffected == 0 {
		return errors.New("piloto no encontrado")
	}

	return nil
}

// GetPilotByUserID retrieves a pilot by user ID
func (r *PilotRepository) GetPilotByUserID(userID int) (models.ModelPilotResponse, error) {
	if err := r.validateDBConnection(); err != nil {
		return models.ModelPilotResponse{}, err
	}

	var response models.ModelPilotResponse
	var fotoPerfil sql.NullString

	query := `
		SELECT p.id, u.id, u.nombre, u.correo, u.foto_perfil, p.licencia, u.es_eliminado, p.es_eliminado
		FROM pilotos p
		INNER JOIN usuarios u ON p.usuario_id = u.id
		WHERE u.id = $1 AND p.es_eliminado = FALSE;
	`
	err := config.DB.QueryRow(query, userID).Scan(
		&response.IDPiloto,
		&response.IDUsuario,
		&response.Nombre,
		&response.Correo,
		&fotoPerfil,
		&response.Licencia,
		&response.UsuarioEliminado,
		&response.PilotoEliminado,
	)

	if err == sql.ErrNoRows {
		return models.ModelPilotResponse{}, errors.New("piloto no encontrado")
	}
	if err != nil {
		return models.ModelPilotResponse{}, errors.New("error al obtener piloto: " + err.Error())
	}

	if fotoPerfil.Valid {
		response.FotoPerfil = &fotoPerfil.String
	}

	return response, nil
}
