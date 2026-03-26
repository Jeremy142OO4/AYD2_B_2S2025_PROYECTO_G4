package controllers

import (
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

func ObtenerFacturas(c *fiber.Ctx) error {
	facturas, err := services.ObtenerFacturas()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "No se pudieron obtener las facturas",
		})
	}

	return c.JSON(facturas)
}

func ObtenerDetalleFactura(c *fiber.Ctx) error {
	id := c.Params("id")

	respuesta, err := services.ObtenerDetalleFactura(id)
	if err != nil {
		if err.Error() == "factura no encontrada" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "No se pudo obtener el detalle de la factura",
		})
	}

	return c.JSON(respuesta)
}

func ObtenerFacturasPendientes(c *fiber.Ctx) error {
	facturas, err := services.ObtenerFacturasPendientes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "No se pudieron obtener las facturas pendientes",
		})
	}

	return c.JSON(facturas)
}

func ObtenerFacturasBorrador(c *fiber.Ctx) error {
	facturas, err := services.ObtenerFacturasBorrador()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "No se pudieron obtener las facturas en borrador",
		})
	}

	return c.JSON(facturas)
}

func ObtenerFacturasCertificadasPendiente(c *fiber.Ctx) error {
	facturas, err := services.ObtenerFacturasCertificadasPendiente()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "No se pudieron obtener las facturas certificadas pendiente de pago",
		})
	}

	return c.JSON(facturas)
}
