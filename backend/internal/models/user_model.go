package models

type ModelLoginRequest struct {
	Correo   string `json:"correo"`
	Password string `json:"password"`
}

type ModelLoginUser struct {
	UserID   int    `json:"user_id"`
	ClientID *int   `json:"cliente_id,omitempty"`
	PilotID  *int   `json:"piloto_id,omitempty"`
	Nombre   string `json:"nombre"`
	Correo   string `json:"correo"`
	Role     string `json:"role"`
}

type ModelLoginResponse struct {
	User ModelLoginUser `json:"user"`
}

type ModelClientResponse struct {
	IDUsuario          int      `json:"id_usuario"`
	Nombre             string   `json:"nombre"`
	Correo             string   `json:"correo"`
	Rol                string   `json:"rol"`
	IDCliente          *int     `json:"id_cliente,omitempty"`
	IDPiloto           *int     `json:"id_piloto,omitempty"`
	Nit                *string  `json:"nit,omitempty"`
	Direccion          *string  `json:"direccion,omitempty"`
	Telefono           *string  `json:"telefono,omitempty"`
	Riesgo             *string  `json:"riesgo,omitempty"`
	LimiteCredito      *float64 `json:"limite_credito,omitempty"`
	DiasCredito        *int     `json:"dias_credito,omitempty"`
	UsuarioEsEliminado bool     `json:"usuario_eliminado"`
	FotoPerfil         *string  `json:"foto"`
}
