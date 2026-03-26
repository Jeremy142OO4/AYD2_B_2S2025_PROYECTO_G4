package controllers

import (
	"backend/internal/models"
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

func ObtenerDashboardOperativo(c *fiber.Ctx) error {
	data, err := services.ObtenerDashboardOperativo()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no se pudo obtener el dashboard operativo",
		})
	}

	return c.JSON(data)
}

func MostrarOperacionesDiariasPorSede(c *fiber.Ctx) error {

	sede := c.Query("sede")
	fecha := c.Query("fecha")

	if sede == "" || fecha == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "debe enviar sede y fecha",
		})
	}

	data, err := services.MostrarOperacionesDiariasPorSede(sede, fecha)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "no se pudieron obtener las operaciones",
		})
	}

	return c.JSON(data)
}

func ImplementarCorteDiarioOperaciones(c *fiber.Ctx) error {
	var body models.CorteDiarioRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "body invalido",
		})
	}

	if body.Fecha == "" || body.Sede == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "debe enviar fecha y sede",
		})
	}

	data, err := services.ImplementarCorteDiarioOperaciones(body.Fecha, body.Sede, body.Observaciones)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(data)
}
