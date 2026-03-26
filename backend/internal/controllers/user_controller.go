package controllers

import (
	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

var authService = services.NewAuthService()

func ListaClientes(c *fiber.Ctx) error {
	clientes, err := repositories.ObtenerListaClientes()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "error al obtener usuarios",
		})
	}
	return c.JSON(clientes)
}

func Login(c *fiber.Ctx) error {
	var req models.ModelLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cuerpo de solicitud invalido"})
	}

	resp, err := authService.LoginClient(req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "inicio de sesion exitoso",
		"data":    resp,
	})
}
