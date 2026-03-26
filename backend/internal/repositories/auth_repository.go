package repositories

import (
	"backend/config"
	"errors"
	"strings"
)

type AuthenticatedClient struct {
	UserID   int
	ClientID *int
	PilotID  *int
	Nombre   string
	Correo   string
	Role     string
}

type AuthRepository struct{}

func NewAuthRepository() *AuthRepository {
	return &AuthRepository{}
}

func (r *AuthRepository) AuthenticateClient(email string, password string) (AuthenticatedClient, error) {
	if config.DB == nil {
		return AuthenticatedClient{}, errors.New("la conexion a base de datos no esta disponible")
	}

	normalizedEmail := strings.TrimSpace(strings.ToLower(email))
	cleanPassword := strings.TrimSpace(password)

	if normalizedEmail == "" || cleanPassword == "" {
		return AuthenticatedClient{}, errors.New("correo y password son obligatorios")
	}

	query := `
		SELECT 
			u.id,
			c.id AS cliente_id,
			p.id AS piloto_id,
			u.nombre,
			u.correo,
			COALESCE(r.nombre,
				CASE
					WHEN c.id IS NOT NULL THEN 'Cliente'
					WHEN p.id IS NOT NULL THEN 'Piloto'
					ELSE NULL
				END
			) AS role
		FROM usuarios u
		LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
		LEFT JOIN roles r ON r.id = ur.rol_id
		LEFT JOIN clientes c ON c.usuario_id = u.id
		LEFT JOIN pilotos p ON p.usuario_id = u.id
		WHERE LOWER(u.correo) = LOWER($1)
			AND u.password = $2
			AND u.es_eliminado = FALSE
			AND (r.id IS NULL OR r.es_eliminado = FALSE)
			AND (c.id IS NULL OR c.es_eliminado = FALSE)
			AND (p.id IS NULL OR p.es_eliminado = FALSE)
		LIMIT 1;
	`

	var authUser AuthenticatedClient
	err := config.DB.QueryRow(query, normalizedEmail, cleanPassword).Scan(
		&authUser.UserID,
		&authUser.ClientID,
		&authUser.PilotID,
		&authUser.Nombre,
		&authUser.Correo,
		&authUser.Role,
	)
	if err != nil {
		return AuthenticatedClient{}, errors.New("credenciales invalidas")
	}

	return authUser, nil
}
