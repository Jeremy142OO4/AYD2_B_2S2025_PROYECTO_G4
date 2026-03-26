package services

import (
	"backend/internal/models"
	"backend/internal/repositories"
)

func MostrarIngresosVsCostos(fechaInicio string, fechaFin string) (*models.IngresosVsCostos, error) {
	return repositories.MostrarIngresosVsCostos(fechaInicio, fechaFin)
}
