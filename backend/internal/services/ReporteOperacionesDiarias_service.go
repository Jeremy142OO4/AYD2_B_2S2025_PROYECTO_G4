package services

import (
	"backend/internal/models"
	"backend/internal/repositories"
)

func ObtenerDashboardOperativo() (*models.DashboardOperativoResponse, error) {
	return repositories.ObtenerDashboardOperativo()
}

func MostrarOperacionesDiariasPorSede(sede string, fecha string) (*models.OperacionesDiarias, error) {
	return repositories.MostrarOperacionesDiariasPorSede(sede, fecha)
}

func ImplementarCorteDiarioOperaciones(fecha string, sede string, observaciones string) (*models.CorteDiarioResponse, error) {
	return repositories.ImplementarCorteDiarioOperaciones(fecha, sede, observaciones)
}
