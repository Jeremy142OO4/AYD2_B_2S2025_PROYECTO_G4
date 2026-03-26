package controllers

import (
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

func ObtenerAlertasDesviacion(c *fiber.Ctx) error {
	fechaInicio := c.Query("fecha_inicio")
	fechaFin := c.Query("fecha_fin")

	if fechaInicio == "" || fechaFin == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "debe enviar fecha_inicio y fecha_fin",
		})
	}

	data, err := services.ObtenerAlertasDesviacion(fechaInicio, fechaFin)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no se pudieron obtener las alertas de desviación",
		})
	}

	return c.JSON(data)
}
