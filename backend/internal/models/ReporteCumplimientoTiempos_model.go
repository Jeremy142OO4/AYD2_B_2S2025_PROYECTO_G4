package models

type CumplimientoTiempos struct {
	TotalContratos            int     `json:"total_contratos"`
	ContratosEnTiempo         int     `json:"contratos_en_tiempo"`
	ContratosFueraDeTiempo    int     `json:"contratos_fuera_de_tiempo"`
	PorcentajeCumplimiento    float64 `json:"porcentaje_cumplimiento"`
	PromedioTiempoPactadoDias float64 `json:"promedio_tiempo_pactado_dias"`
	PromedioTiempoRealDias    float64 `json:"promedio_tiempo_real_dias"`
}
