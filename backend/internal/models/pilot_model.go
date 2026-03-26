package models

type ModelCreatePilotRequest struct {
	Nombre     string  `json:"nombre"`
	Correo     string  `json:"correo"`
	Password   string  `json:"password"`
	FotoPerfil *string `json:"foto_perfil"`
	Licencia   string  `json:"licencia"`
}

type ModelUpdatePilotRequest struct {
	Nombre     string  `json:"nombre"`
	Correo     string  `json:"correo"`
	FotoPerfil *string `json:"foto_perfil"`
	Licencia   string  `json:"licencia"`
}

type ModelPilotResponse struct {
	IDPiloto         int     `json:"id_piloto"`
	IDUsuario        int     `json:"id_usuario"`
	Nombre           string  `json:"nombre"`
	Correo           string  `json:"correo"`
	FotoPerfil       *string `json:"foto_perfil"`
	Licencia         string  `json:"licencia"`
	UsuarioEliminado bool    `json:"usuario_eliminado"`
	PilotoEliminado  bool    `json:"piloto_eliminado"`
}

type ModelListPilotResponse struct {
	IDPiloto  int    `json:"id_piloto"`
	IDUsuario int    `json:"id_usuario"`
	Nombre    string `json:"nombre"`
	Correo    string `json:"correo"`
	Licencia  string `json:"licencia"`
}
