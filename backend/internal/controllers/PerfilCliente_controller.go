package controllers

import (
	"backend/internal/models"
	"backend/internal/services"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

var clientProfileService = services.NewClientProfileService()

func getClientReferenceID(c *fiber.Ctx) (int, error) {
	referenceIDStr := c.Query("user_id")
	if referenceIDStr == "" {
		referenceIDStr = c.Query("cliente_id")
	}
	if referenceIDStr == "" {
		return 0, fiber.NewError(fiber.StatusBadRequest, "user_id es requerido")
	}

	referenceID, err := strconv.Atoi(referenceIDStr)
	if err != nil {
		return 0, fiber.NewError(fiber.StatusBadRequest, "user_id invalido")
	}

	return referenceID, nil
}

func CrearClienteEmpresa(c *fiber.Ctx) error {
	var req models.ModelCreateClientProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cuerpo de solicitud invalido"})
	}

	resp, err := clientProfileService.CreateClientProfile(req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "cliente empresarial perfilado correctamente",
		"data":    resp,
	})
}

func ActualizarRiesgoCliente(c *fiber.Ctx) error {
	clienteID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id invalido"})
	}

	var req models.ModelUpdateClientRiskRequest
	if err = c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cuerpo de solicitud invalido"})
	}

	resp, err := clientProfileService.UpdateClientRiskProfile(clienteID, req)
	if err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "cliente no encontrado" {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "perfil de riesgo actualizado",
		"data":    resp,
	})
}

func EvaluarFiltroComercial(c *fiber.Ctx) error {
	clienteID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id invalido"})
	}

	resp, err := clientProfileService.EvaluateCommercialFilter(clienteID)
	if err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "cliente no encontrado" {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": resp})
}

// ObtenerDashboardCliente obtiene el dashboard del cliente autenticado
func ObtenerDashboardCliente(c *fiber.Ctx) error {
	// Aquí asumimos que el clienteID viene del contexto de autenticación
	// Por ahora, lo extraemos del query param o del JWT (depende de tu estrategia de auth)
	clienteIDStr := c.Query("cliente_id")
	if clienteIDStr == "" {
		// Si no hay query param, intenta obtenerlo del contexto
		// Esto dependerá de tu middleware de autenticación
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "cliente_id es requerido",
		})
	}

	clienteID, err := strconv.Atoi(clienteIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "cliente_id invalido",
		})
	}

	dashboard, err := clientProfileService.GetClientDashboard(clienteID)
	if err != nil {
		status := fiber.StatusInternalServerError
		if strings.Contains(strings.ToLower(err.Error()), "cliente no encontrado") {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(dashboard)
}

func ObtenerPerfilCliente(c *fiber.Ctx) error {
	clienteID, err := strconv.Atoi(c.Params("clienteId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id de cliente invalido"})
	}

	resp, err := clientProfileService.GetClientProfile(clienteID)
	if err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "cliente no encontrado" {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp)
}

func ObtenerPerfilClienteMe(c *fiber.Ctx) error {
	referenceID, err := getClientReferenceID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	resp, err := clientProfileService.GetClientProfileByReference(referenceID)
	if err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "cliente no encontrado" {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(resp)
}

func ActualizarPerfilCliente(c *fiber.Ctx) error {
	clienteID, err := strconv.Atoi(c.Params("clienteId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id de cliente invalido"})
	}

	var req models.ModelPatchClientProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cuerpo de solicitud invalido"})
	}

	err = clientProfileService.PatchClientProfile(clienteID, req)
	if err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "cliente no encontrado" {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(models.ModelBasicOkResponse{
		OK:      true,
		Message: "Perfil de empresa actualizado correctamente.",
	})
}

func ActualizarPerfilClienteMe(c *fiber.Ctx) error {
	referenceID, err := getClientReferenceID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var req models.ModelPatchClientProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cuerpo de solicitud invalido"})
	}

	err = clientProfileService.PatchClientProfileByReference(referenceID, req)
	if err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "cliente no encontrado" {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(models.ModelBasicOkResponse{
		OK:      true,
		Message: "Perfil de empresa actualizado correctamente.",
	})
}

func CambiarContrasenaCliente(c *fiber.Ctx) error {
	clienteID, err := strconv.Atoi(c.Params("clienteId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id de cliente invalido"})
	}

	var req models.ModelUpdateClientPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cuerpo de solicitud invalido"})
	}

	err = clientProfileService.UpdateClientPassword(clienteID, req)
	if err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "cliente no encontrado" {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(models.ModelBasicOkResponse{
		OK:      true,
		Message: "Contrasena actualizada correctamente.",
	})
}

func CambiarContrasenaClienteMe(c *fiber.Ctx) error {
	referenceID, err := getClientReferenceID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var req models.ModelUpdateClientPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cuerpo de solicitud invalido"})
	}

	err = clientProfileService.UpdateClientPasswordByReference(referenceID, req)
	if err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "cliente no encontrado" {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(models.ModelBasicOkResponse{
		OK:      true,
		Message: "Contrasena actualizada correctamente.",
	})
}

func CrearSolicitudClienteMe(c *fiber.Ctx) error {
	clienteIDStr := c.Query("cliente_id")
	if clienteIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "cliente_id es requerido",
		})
	}

	clienteID, err := strconv.Atoi(clienteIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "cliente_id invalido",
		})
	}

	var req models.ModelCreateClientRequestOrder
	if err = c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "cuerpo de solicitud invalido",
		})
	}

	resp, err := clientProfileService.CreateClientRequestOrder(clienteID, req)
	if err != nil {
		status := fiber.StatusBadRequest
		if strings.Contains(strings.ToLower(err.Error()), "no encontrado") {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "solicitud creada correctamente",
		"data":    resp,
	})
}

func ObtenerHistorialSolicitudesClienteMe(c *fiber.Ctx) error {
	clienteIDStr := c.Query("cliente_id")
	if clienteIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "cliente_id es requerido",
		})
	}

	clienteID, err := strconv.Atoi(clienteIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "cliente_id invalido",
		})
	}

	items, err := clientProfileService.GetClientRequestOrderHistory(clienteID)
	if err != nil {
		status := fiber.StatusBadRequest
		if strings.Contains(strings.ToLower(err.Error()), "no encontrado") {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": items,
	})
}

func ObtenerRutasAutorizadasClienteMe(c *fiber.Ctx) error {
	clienteIDStr := c.Query("cliente_id")
	if clienteIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "cliente_id es requerido",
		})
	}

	clienteID, err := strconv.Atoi(clienteIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "cliente_id invalido",
		})
	}

	routes, err := clientProfileService.GetClientAuthorizedRoutes(clienteID)
	if err != nil {
		status := fiber.StatusBadRequest
		if strings.Contains(strings.ToLower(err.Error()), "no encontrado") {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": routes,
	})
}

func ObtenerSeguimientoClienteMe(c *fiber.Ctx) error {
	referenceID, err := getClientReferenceID(c)
	if err != nil {
		if fiberErr, ok := err.(*fiber.Error); ok {
			return c.Status(fiberErr.Code).JSON(fiber.Map{"error": fiberErr.Message})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	items, err := clientProfileService.GetClientTracking(referenceID)
	if err != nil {
		status := fiber.StatusBadRequest
		if strings.Contains(strings.ToLower(err.Error()), "no encontrado") {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": items})
}

func ConfirmarRecepcionClienteMe(c *fiber.Ctx) error {
	referenceID, err := getClientReferenceID(c)
	if err != nil {
		if fiberErr, ok := err.(*fiber.Error); ok {
			return c.Status(fiberErr.Code).JSON(fiber.Map{"error": fiberErr.Message})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	solicitudID, err := strconv.Atoi(c.Params("solicitudId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "solicitudId invalido"})
	}

	err = clientProfileService.ConfirmClientReception(referenceID, solicitudID)
	if err != nil {
		status := fiber.StatusBadRequest
		if strings.Contains(strings.ToLower(err.Error()), "no encontrada") || strings.Contains(strings.ToLower(err.Error()), "no encontrado") {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(models.ModelBasicOkResponse{
		OK:      true,
		Message: "Recepcion confirmada correctamente.",
	})
}

func ObtenerPagosClienteMe(c *fiber.Ctx) error {
	referenceID, err := getClientReferenceID(c)
	if err != nil {
		if fiberErr, ok := err.(*fiber.Error); ok {
			return c.Status(fiberErr.Code).JSON(fiber.Map{"error": fiberErr.Message})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	data, err := clientProfileService.GetClientPayments(referenceID)
	if err != nil {
		status := fiber.StatusBadRequest
		if strings.Contains(strings.ToLower(err.Error()), "no encontrado") {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(data)
}

func RegistrarIntencionPagoClienteMe(c *fiber.Ctx) error {
	referenceID, err := getClientReferenceID(c)
	if err != nil {
		if fiberErr, ok := err.(*fiber.Error); ok {
			return c.Status(fiberErr.Code).JSON(fiber.Map{"error": fiberErr.Message})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var req models.ModelRegisterClientPaymentIntentRequest
	if err = c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cuerpo de solicitud invalido"})
	}

	err = clientProfileService.RegisterClientPaymentIntent(referenceID, req)
	if err != nil {
		status := fiber.StatusBadRequest
		if strings.Contains(strings.ToLower(err.Error()), "no encontrada") || strings.Contains(strings.ToLower(err.Error()), "no encontrado") {
			status = fiber.StatusNotFound
		}
		return c.Status(status).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(models.ModelBasicOkResponse{
		OK:      true,
		Message: "Intencion de pago registrada correctamente.",
	})
}
