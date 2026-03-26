package controllers

import (
	"backend/internal/models"
	"backend/internal/services"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

var pilotService = services.NewPilotService()

// CrearPiloto creates a new pilot
func CrearPiloto(c *fiber.Ctx) error {
	var req models.ModelCreatePilotRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "formato de solicitud invalido",
		})
	}

	response, err := pilotService.CreatePilot(req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"mensaje": "piloto creado exitosamente",
		"datos":   response,
	})
}

// ObtenerPiloto retrieves a pilot by ID
func ObtenerPiloto(c *fiber.Ctx) error {
	pilotoIDStr := c.Params("id")
	pilotoID, err := strconv.Atoi(pilotoIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id de piloto invalido",
		})
	}

	response, err := pilotService.GetPilotByID(pilotoID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(response)
}

// ListarPilotos retrieves all active pilots
func ListarPilotos(c *fiber.Ctx) error {
	pilots, err := pilotService.GetAllPilots()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if pilots == nil {
		pilots = []models.ModelListPilotResponse{}
	}

	return c.JSON(pilots)
}

// ActualizarPiloto updates a pilot's information
func ActualizarPiloto(c *fiber.Ctx) error {
	pilotoIDStr := c.Params("id")
	pilotoID, err := strconv.Atoi(pilotoIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id de piloto invalido",
		})
	}

	var req models.ModelUpdatePilotRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "formato de solicitud invalido",
		})
	}

	response, err := pilotService.UpdatePilot(pilotoID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"mensaje": "piloto actualizado exitosamente",
		"datos":   response,
	})
}

// EliminarPiloto soft-deletes a pilot
func EliminarPiloto(c *fiber.Ctx) error {
	pilotoIDStr := c.Params("id")
	pilotoID, err := strconv.Atoi(pilotoIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id de piloto invalido",
		})
	}

	err = pilotService.DeletePilot(pilotoID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"mensaje": "piloto eliminado exitosamente",
	})
}

// ObtenerPilotoPorUsuario retrieves a pilot by user ID
func ObtenerPilotoPorUsuario(c *fiber.Ctx) error {
	usuarioIDStr := c.Params("usuario_id")
	usuarioID, err := strconv.Atoi(usuarioIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id de usuario invalido",
		})
	}

	response, err := pilotService.GetPilotByUserID(usuarioID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(response)
}
