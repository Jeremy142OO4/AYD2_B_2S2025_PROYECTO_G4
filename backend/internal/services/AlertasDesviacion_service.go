package services

import (
	"backend/internal/models"
	"backend/internal/repositories"
)

func ObtenerAlertasDesviacion(fechaInicio string, fechaFin string) (*models.AlertasDesviacionResponse, error) {
	return repositories.ObtenerAlertasDesviacion(fechaInicio, fechaFin)
}
