package models

type ModelRouteAuthorizationInput struct {
	Origen      string   `json:"origen"`
	Destino     string   `json:"destino"`
	DistanciaKm *float64 `json:"distancia_km"`
	TipoUnidad  string   `json:"tipo_unidad"`
	PesoMin     float64  `json:"peso_min"`
	PesoMax     float64  `json:"peso_max"`
	PrecioKm    *float64 `json:"precio_km"`
}

type ModelCreateDigitalContractRequest struct {
	ClienteID        int                            `json:"cliente_id"`
	FechaInicio      string                         `json:"fecha_inicio"`
	FechaFin         string                         `json:"fecha_fin"`
	Descuento        float64                        `json:"descuento"`
	LimiteCredito    float64                        `json:"limite_credito"`
	DiasCredito      int                            `json:"dias_credito"`
	RutasAutorizadas []ModelRouteAuthorizationInput `json:"rutas_autorizadas"`
}

type ModelDigitalContractRouteResponse struct {
	RutaID     int     `json:"ruta_id"`
	Origen     string  `json:"origen"`
	Destino    string  `json:"destino"`
	TipoUnidad string  `json:"tipo_unidad"`
	PesoMin    float64 `json:"peso_min"`
	PesoMax    float64 `json:"peso_max"`
	PrecioKm   float64 `json:"precio_km"`
}

type ModelDigitalContractResponse struct {
	ContratoID       int                                 `json:"contrato_id"`
	ClienteID        int                                 `json:"cliente_id"`
	FechaInicio      string                              `json:"fecha_inicio"`
	FechaFin         string                              `json:"fecha_fin"`
	Descuento        float64                             `json:"descuento"`
	LimiteCredito    float64                             `json:"limite_credito"`
	DiasCredito      int                                 `json:"dias_credito"`
	TarifasBase      map[string]float64                  `json:"tarifas_base"`
	RutasAutorizadas []ModelDigitalContractRouteResponse `json:"rutas_autorizadas"`
}
