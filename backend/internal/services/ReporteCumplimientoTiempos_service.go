package services

import (
	"backend/internal/models"
	"backend/internal/repositories"
)

func MostrarCumplimientoTiempos(fechaInicio string, fechaFin string) (*models.CumplimientoTiempos, error) {
	return repositories.MostrarCumplimientoTiempos(fechaInicio, fechaFin)
}
