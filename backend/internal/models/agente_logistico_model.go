package models

type OrdenResponse struct {
	ID            int     `json:"id"`
	ClienteID     int     `json:"cliente_id"`
	ContratoID    int     `json:"contrato_id"`
	NombreCliente string  `json:"nombre_cliente"`
	Origen        string  `json:"origen"`
	Destino       string  `json:"destino"`
	Peso          float64 `json:"peso"`
	Estado        string  `json:"estado"`
}

type AsignarViajeRequest struct {
	OrdenID     int    `json:"orden_id"`
	VehiculoID  int    `json:"vehiculo_id"`
	PilotoID    int    `json:"piloto_id"`
	FechaSalida string `json:"fecha_salida"`
}

type CrearCamionRequest struct {
	Placa     string  `json:"placa"`
	Tipo      string  `json:"tipo"`
	Capacidad float64 `json:"capacidad"`
}

type VehiculoResponse struct {
	ID        int     `json:"id"`
	Placa     string  `json:"placa"`
	Tipo      string  `json:"tipo"`
	Capacidad float64 `json:"capacidad"`
}

type AgregarPilotoRequest struct {
	Nombre     string `json:"nombre"`
	Correo     string `json:"correo"`
	Password   string `json:"password"`
	FotoPerfil string `json:"foto_perfil"`
	Licencia   string `json:"licencia"`
}

type CrearOrdenRequest struct {
	ClienteID  int     `json:"cliente_id"`
	ContratoID int     `json:"contrato_id"`
	RutaID     int     `json:"ruta_id"`
	EstadoID   int     `json:"estado_id"`
	Peso       float64 `json:"peso"`
}

type PilotoResponse struct {
	PilotoID   int    `json:"piloto_id"`
	UsuarioID  int    `json:"usuario_id"`
	Licencia   string `json:"licencia"`
	Nombre     string `json:"nombre"`
	FotoPerfil string `json:"foto_perfil"`
}

type ViajePiloto struct {
	ID        int     `json:"id"`
	Fecha     string  `json:"fecha"`
	Origen    string  `json:"origen"`
	Destino   string  `json:"destino"`
	Distancia float64 `json:"distancia"`
	Peso      float64 `json:"peso"`
	Placa     string  `json:"placa"`
}

type HistorialPilotoResponse struct {
	Nombre string        `json:"nombre"`
	Viajes []ViajePiloto `json:"viajes"`
}

type BitacoraViajeResponse struct {
	ID           int     `json:"id"`
	Fecha        string  `json:"fecha"`
	Origen       string  `json:"origen"`
	Destino      string  `json:"destino"`
	Distancia    float64 `json:"distancia"`
	Peso         float64 `json:"peso"`
	PilotoID     int     `json:"piloto_id"`
	NombrePiloto string  `json:"nombre_piloto"`
	Placa        string  `json:"placa"`
}

type CerrarOrdenResponse struct {
	OrdenID          int     `json:"orden_id"`
	Estado           string  `json:"estado"`
	BorradorGenerado bool    `json:"borrador_generado"`
	FacturaID        *int    `json:"factura_id,omitempty"`
	Subtotal         float64 `json:"subtotal"`
	IVA              float64 `json:"iva"`
	MontoTotal       float64 `json:"monto_total"`
	Mensaje          string  `json:"mensaje"`
}

type ContratoResponse struct {
	ID            int    `json:"id"`
	NombreCliente string `json:"nombre_cliente"`
	Origen        string `json:"origen"`
	Destino       string `json:"destino"`
	Activo        bool   `json:"activo"`
}

type ClienteResponse struct {
	ClienteID int    `json:"cliente_id"`
	UsuarioID int    `json:"usuario_id"`
	Nombre    string `json:"nombre"`
	Correo    string `json:"correo"`
	Telefono  string `json:"telefono"`
}

type ValidarCapacidadRequest struct {
	Placa string  `json:"placa"`
	Peso  float64 `json:"peso"`
}

type GenerarOrdenOperativoRequest struct {
	ClienteID int     `json:"cliente_id"`
	Origen    string  `json:"origen"`
	Destino   string  `json:"destino"`
	Peso      float64 `json:"peso"`
}

type GenerarOrdenOperativoResponse struct {
	OrdenID       int     `json:"orden_id"`
	Codigo        string  `json:"codigo"`
	ClienteID     int     `json:"cliente_id"`
	ContratoID    int     `json:"contrato_id"`
	RutaID        int     `json:"ruta_id"`
	Estado        string  `json:"estado"`
	Peso          float64 `json:"peso"`
	MotivoBloqueo string  `json:"motivo_bloqueo,omitempty"`
}

type ValidarCapacidadResponse struct {
	Valido bool `json:"valido"`
}

type ProcesarFacturaRequest struct {
	FacturaID int `json:"factura_id"`
}

type FacturaEnvio struct {
	ID              int
	Total           float64
	IVA             float64
	Estado          string
	NIT             string
	Correo          string
	Nombre          string
	DireccionFiscal string
	Fecha           string
}

type ReportarEventoRequest struct {
	Placa       string `json:"placa"`
	Tipo        string `json:"tipo"`
	Descripcion string `json:"descripcion"`
	Foto        string `json:"foto"`
}

type ReportarEventoResponse struct {
	Mensaje string `json:"mensaje"`
}

type CancelarOrdenResponse struct {
	Mensaje string `json:"mensaje"`
}

type ValidarOrdenResponse struct {
	Mensaje string `json:"mensaje"`
	Estado  string `json:"estado"`
}

type EventoPiloto struct {
	OrdenID     int    `json:"orden_id"`
	Descripcion string `json:"descripcion"`
	Fecha       string `json:"fecha"`
	Tipo        string `json:"tipo"`
}

type BitacoraPilotoResponse struct {
	Nombre  string         `json:"nombre"`
	Eventos []EventoPiloto `json:"eventos"`
}
