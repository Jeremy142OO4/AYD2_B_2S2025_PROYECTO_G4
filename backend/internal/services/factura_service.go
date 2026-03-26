package services

import (
	"backend/internal/models"
	"backend/internal/repositories"
)

func ObtenerFacturas() ([]models.Factura, error) {
	return repositories.ObtenerFacturas()
}

func ObtenerDetalleFactura(id string) (*models.FacturaDetalleResponse, error) {
	return repositories.ObtenerDetalleFactura(id)
}

func ObtenerFacturasPendientes() ([]models.Factura, error) {
	return repositories.ObtenerFacturasPendientes()
}
func ObtenerFacturasBorrador() ([]models.Factura, error) {
	return repositories.ObtenerFacturasBorrador()
}
func ObtenerFacturasCertificadasPendiente() ([]models.Factura, error) {
	return repositories.ObtenerFacturasCertificadasPendiente()
}
