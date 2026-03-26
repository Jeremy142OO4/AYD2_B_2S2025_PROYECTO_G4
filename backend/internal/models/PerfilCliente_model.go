package models

type ModelCreateClientProfileRequest struct {
	Nombre           string  `json:"nombre"`
	Correo           string  `json:"correo"`
	Password         string  `json:"password"`
	FotoPerfil       *string `json:"foto_perfil"`
	Nit              string  `json:"nit"`
	Direccion        string  `json:"direccion"`
	Telefono         string  `json:"telefono"`
	LimiteCredito    float64 `json:"limite_credito"`
	DiasCredito      int     `json:"dias_credito"`
	CapacidadPago    string  `json:"capacidad_pago"`
	LavadoDinero     string  `json:"lavado_dinero"`
	RiesgoAduanas    string  `json:"aduanas"`
	RiesgoGlobal     string  `json:"riesgo_global"`
	ClienteActivo    bool    `json:"cliente_activo"`
	UsuarioEliminado bool    `json:"usuario_eliminado"`
}

type ModelUpdateClientRiskRequest struct {
	Direccion     string  `json:"direccion"`
	Telefono      string  `json:"telefono"`
	LimiteCredito float64 `json:"limite_credito"`
	DiasCredito   int     `json:"dias_credito"`
	CapacidadPago string  `json:"capacidad_pago"`
	LavadoDinero  string  `json:"lavado_dinero"`
	RiesgoAduanas string  `json:"aduanas"`
}

type ModelClientRiskProfileResponse struct {
	IDCliente     int     `json:"id_cliente"`
	IDUsuario     int     `json:"id_usuario"`
	NombreEmpresa string  `json:"nombre_empresa"`
	Correo        string  `json:"correo"`
	Nit           string  `json:"nit"`
	Direccion     string  `json:"direccion"`
	Telefono      string  `json:"telefono"`
	LimiteCredito float64 `json:"limite_credito"`
	DiasCredito   int     `json:"dias_credito"`
	CapacidadPago string  `json:"capacidad_pago"`
	LavadoDinero  string  `json:"lavado_dinero"`
	RiesgoAduanas string  `json:"aduanas"`
	RiesgoGlobal  string  `json:"riesgo_global"`
}

type ModelCommercialFilterResponse struct {
	Cliente                ModelClientRiskProfileResponse `json:"cliente"`
	TieneContratoVigente   bool                           `json:"tiene_contrato_vigente"`
	ContratoID             *int                           `json:"contrato_id"`
	AutorizadoParaServicio bool                           `json:"autorizado_para_servicio"`
	Motivos                []string                       `json:"motivos"`
}

type ResumenOperativo struct {
	OrdenesActivas     int `json:"ordenes_activas"`
	OrdenesEnTransito  int `json:"ordenes_en_transito"`
	OrdenesCompletadas int `json:"ordenes_completadas"`
}

type ResumenFinanciero struct {
	FacturasPendientesMonto float64 `json:"facturas_pendientes_monto"`
	FacturasVencidasMonto   float64 `json:"facturas_vencidas_monto"`
	LimiteCredito           float64 `json:"limite_credito"`
	CreditoDisponible       float64 `json:"credito_disponible"`
}

type Alerta struct {
	ID        int    `json:"id"`
	Tipo      string `json:"tipo"`
	Mensaje   string `json:"mensaje"`
	Severidad string `json:"severidad"`
	Fecha     string `json:"fecha"`
}

type ModelClientDashboardResponse struct {
	ResumenOperativo  ResumenOperativo  `json:"resumenOperativo"`
	ResumenFinanciero ResumenFinanciero `json:"resumenFinanciero"`
	Alertas           []Alerta          `json:"alertas"`
	DashboardCliente  DashboardCliente  `json:"dashboard_cliente"`
}

type DashboardResumenServicios struct {
	ServiciosActivos     int `json:"servicios_activos"`
	ServiciosCompletados int `json:"servicios_completados"`
}

type DashboardEstadoGeneral struct {
	OrdenesEnTransito int    `json:"ordenes_en_transito"`
	UltimaEntrega     string `json:"ultima_entrega"`
}

type DashboardResumenFinanciero struct {
	DeudaActual       float64 `json:"deuda_actual"`
	CreditoDisponible float64 `json:"credito_disponible"`
}

type DashboardAlertas struct {
	FacturasVencidas int  `json:"facturas_vencidas"`
	BloqueoCredito   bool `json:"bloqueo_por_credito"`
}

type DashboardCliente struct {
	ResumenServicios  DashboardResumenServicios  `json:"resumen_servicios"`
	EstadoGeneral     DashboardEstadoGeneral     `json:"estado_general"`
	ResumenFinanciero DashboardResumenFinanciero `json:"resumen_financiero"`
	Alertas           DashboardAlertas           `json:"alertas"`
}

type ModelClientProfileViewResponse struct {
	ClienteID     int    `json:"clienteId"`
	NombreEmpresa string `json:"nombreEmpresa"`
	Correo        string `json:"correo"`
	Nit           string `json:"nit"`
	Direccion     string `json:"direccion"`
	Telefono      string `json:"telefono"`
}

type ModelPatchClientProfileRequest struct {
	NombreEmpresa string `json:"nombreEmpresa"`
	Correo        string `json:"correo"`
	Nit           string `json:"nit"`
	Direccion     string `json:"direccion"`
	Telefono      string `json:"telefono"`
}

type ModelUpdateClientPasswordRequest struct {
	PasswordActual       string `json:"passwordActual"`
	PasswordNueva        string `json:"passwordNueva"`
	PasswordConfirmacion string `json:"passwordConfirmacion"`
}

type ModelBasicOkResponse struct {
	OK      bool   `json:"ok"`
	Message string `json:"message"`
}

type ModelCreateClientRequestOrder struct {
	Origen    string  `json:"origen"`
	Destino   string  `json:"destino"`
	TipoCarga string  `json:"tipo_carga"`
	Peso      float64 `json:"peso"`
}

type ModelCreateClientRequestOrderResponse struct {
	SolicitudID int    `json:"solicitud_id"`
	Codigo      string `json:"codigo"`
	Fecha       string `json:"fecha"`
	Estado      string `json:"estado"`
}

type ModelClientRequestOrderHistoryItem struct {
	SolicitudID int     `json:"solicitud_id"`
	Codigo      string  `json:"codigo"`
	Origen      string  `json:"origen"`
	Destino     string  `json:"destino"`
	TipoCarga   string  `json:"tipo_carga"`
	Fecha       string  `json:"fecha"`
	Estado      string  `json:"estado"`
	Peso        float64 `json:"peso"`
}

type ModelClientAuthorizedRouteItem struct {
	RutaID   int    `json:"ruta_id"`
	Origen   string `json:"origen"`
	Destino  string `json:"destino"`
	Contrato int    `json:"contrato_id"`
}

type ModelClientTrackingItem struct {
	SolicitudID         int      `json:"solicitud_id"`
	Codigo              string   `json:"codigo"`
	Estado              string   `json:"estado"`
	PuntosControl       []string `json:"puntos_control"`
	EventosRuta         []string `json:"eventos_ruta"`
	EvidenciaEntrega    string   `json:"evidencia_entrega"`
	RecepcionConfirmada bool     `json:"recepcion_confirmada"`
}

type ModelClientTrackingRawItem struct {
	SolicitudID         int
	FechaCreacion       string
	Estado              string
	Origen              string
	Destino             string
	TieneEvidencia      bool
	RecepcionConfirmada bool
}

type ModelClientPendingInvoice struct {
	FacturaID int     `json:"factura_id"`
	Numero    string  `json:"numero"`
	Fecha     string  `json:"fecha"`
	Monto     float64 `json:"monto"`
}

type ModelClientPaymentHistoryItem struct {
	PagoID     int     `json:"pago_id"`
	FacturaID  int     `json:"factura_id"`
	Fecha      string  `json:"fecha"`
	Monto      float64 `json:"monto"`
	Metodo     string  `json:"metodo"`
	Referencia string  `json:"referencia"`
}

type ModelClientPaymentsResponse struct {
	FacturasPendientes []ModelClientPendingInvoice     `json:"facturas_pendientes"`
	PagosHistorial     []ModelClientPaymentHistoryItem `json:"pagos_historial"`
	TotalPendiente     float64                         `json:"total_pendiente"`
}

type ModelRegisterClientPaymentIntentRequest struct {
	FacturaID int `json:"factura_id"`
}
