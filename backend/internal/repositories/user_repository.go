package repositories

import (
	"backend/config"
	"backend/internal/models"
)

func ObtenerListaClientes() ([]models.ModelClientResponse, error) {
	query := `
		SELECT 
			usuarios.id,
			usuarios.nombre,
			usuarios.correo,
			COALESCE(roles.nombre, 'Sin rol') AS rol,
			clientes.id,
			pilotos.id,
			clientes.nit,
			clientes.direccion,
			clientes.telefono,
			clientes.riesgo,
			clientes.limite_credito,
			clientes.dias_credito,
			usuarios.es_eliminado,
			usuarios.foto_perfil
		FROM usuarios
		LEFT JOIN usuario_rol ON usuario_rol.usuario_id = usuarios.id
		LEFT JOIN roles ON roles.id = usuario_rol.rol_id
		LEFT JOIN clientes ON clientes.usuario_id = usuarios.id
		LEFT JOIN pilotos ON pilotos.usuario_id = usuarios.id;
	`

	rows, err := config.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.ModelClientResponse

	for rows.Next() {
		var user models.ModelClientResponse
		err := rows.Scan(
			&user.IDUsuario,
			&user.Nombre,
			&user.Correo,
			&user.Rol,
			&user.IDCliente,
			&user.IDPiloto,
			&user.Nit,
			&user.Direccion,
			&user.Telefono,
			&user.Riesgo,
			&user.LimiteCredito,
			&user.DiasCredito,
			&user.UsuarioEsEliminado,
			&user.FotoPerfil,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}
