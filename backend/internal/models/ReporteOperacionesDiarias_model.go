package models

import "time"

type OperacionesDiarias struct {
	TotalOrdenes   int     `json:"total_ordenes"`
	TotalFacturado float64 `json:"total_facturado"`
	TotalCostos    float64 `json:"total_costos"`
	Utilidad       float64 `json:"utilidad"`
}

type CorteDiarioRequest struct {
	Fecha         string `json:"fecha"`
	Sede          string `json:"sede"`
	Observaciones string `json:"observaciones"`
}

type CorteDiarioResponse struct {
	ID             int       `json:"id"`
	Fecha          time.Time `json:"fecha"`
	Sede           string    `json:"sede"`
	TotalOrdenes   int       `json:"total_ordenes"`
	TotalFacturado float64   `json:"total_facturado"`
	TotalCostos    float64   `json:"total_costos"`
	TotalUtilidad  float64   `json:"total_utilidad"`
	Observaciones  string    `json:"observaciones"`
}

type OperativoClienteBloqueado struct {
	ClienteID int    `json:"cliente_id"`
	Nombre    string `json:"nombre"`
	Riesgo    string `json:"riesgo"`
}

type OperativoContratoVencido struct {
	ContratoID int    `json:"contrato_id"`
	Cliente    string `json:"cliente"`
	FechaFin   string `json:"fecha_fin"`
}

type DashboardOperativoResponse struct {
	OrdenesDelDia int `json:"ordenes_del_dia"`
	Estados       struct {
		Registradas        int `json:"registradas"`
		ListasParaDespacho int `json:"listas_para_despacho"`
	} `json:"estados"`
	Alertas struct {
		ClientesBloqueados []OperativoClienteBloqueado `json:"clientes_bloqueados"`
		ContratosVencidos  []OperativoContratoVencido  `json:"contratos_vencidos"`
	} `json:"alertas"`
}
