package models

type AlertaDesviacionCliente struct {
	ClienteID           int     `json:"cliente_id"`
	NombreCliente       string  `json:"nombre_cliente"`
	TotalOrdenes        int     `json:"total_ordenes"`
	PesoPromedioReal    float64 `json:"peso_promedio_real"`
	PesoPromedioPactado float64 `json:"peso_promedio_pactado"`
	Desviacion          float64 `json:"desviacion_porcentaje"`
	Severidad           string  `json:"severidad"`
}

type AlertaDesviacionRuta struct {
	RutaID             int     `json:"ruta_id"`
	Origen             string  `json:"origen"`
	Destino            string  `json:"destino"`
	DistanciaKm        float64 `json:"distancia_km"`
	TotalOrdenes       int     `json:"total_ordenes"`
	PesoTotalConsumido float64 `json:"peso_total_consumido"`
	ConsumoPromedio    float64 `json:"consumo_promedio"`
	Severidad          string  `json:"severidad"`
}

type AlertasDesviacionResponse struct {
	ClientesConBajaCarga []AlertaDesviacionCliente `json:"clientes_baja_carga"`
	RutasAltoConsumo     []AlertaDesviacionRuta    `json:"rutas_alto_consumo"`
	TotalAlertasClientes int                       `json:"total_alertas_clientes"`
	TotalAlertasRutas    int                       `json:"total_alertas_rutas"`
}
