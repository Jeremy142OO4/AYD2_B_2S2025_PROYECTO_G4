package models

type IngresosVsCostos struct {
	Ingresos float64 `json:"ingresos"`
	Costos   float64 `json:"costos"`
	Utilidad float64 `json:"utilidad"`
}
