package controllers

import (
	"backend/internal/models"
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

var contractDigitalService = services.NewContractDigitalService()

func CrearContratoDigital(c *fiber.Ctx) error {
	var req models.ModelCreateDigitalContractRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cuerpo de solicitud invalido"})
	}

	resp, err := contractDigitalService.CreateDigitalContract(req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "contrato digital formalizado correctamente",
		"data":    resp,
	})
}
