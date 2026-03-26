package controllers

import (
	"backend/internal/models"
	"backend/internal/services"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func RegistrarPago(c *fiber.Ctx) error {
	var body models.RegistrarPagoRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "body invalido",
		})
	}

	err := services.RegistrarPago(body)
	if err != nil {
		switch err.Error() {
		case "factura_id invalido",
			"el monto debe ser mayor a 0",
			"metodo invalido",
			"el banco es obligatorio",
			"el numero de autorizacion es obligatorio",
			"solo se pueden registrar pagos a facturas certificadas",
			"el monto excede el saldo pendiente de la factura":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		case "factura no encontrada":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "no se pudo registrar el pago",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "pago registrado correctamente",
	})
}

func ObtenerPagos(c *fiber.Ctx) error {
	pagos, err := services.ObtenerPagos()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no se pudieron obtener los pagos",
		})
	}

	return c.JSON(pagos)
}

func ObtenerPagosPorFactura(c *fiber.Ctx) error {
	idFactura, err := strconv.Atoi(c.Params("idFactura"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id de factura invalido",
		})
	}

	pagos, err := services.ObtenerPagosPorFactura(idFactura)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(pagos)
}

func ObtenerPagosPendientes(c *fiber.Ctx) error {
	pagos, err := services.ObtenerPagosPendientes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(pagos)
}

func ObtenerEstadoCuentaPorCliente(c *fiber.Ctx) error {
	idCliente, err := strconv.Atoi(c.Params("idCliente"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id de cliente invalido",
		})
	}

	estadoCuenta, err := services.ObtenerEstadoCuentaPorCliente(idCliente)
	if err != nil {
		if err.Error() == "cliente no encontrado" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(estadoCuenta)
}

func ObtenerAntiguedadSaldosCliente(c *fiber.Ctx) error {
	idCliente, err := strconv.Atoi(c.Params("idCliente"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id de cliente invalido",
		})
	}

	data, err := services.ObtenerAntiguedadSaldosCliente(idCliente)
	if err != nil {
		if err.Error() == "cliente no encontrado" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(data)
}

func ObtenerEstadoCuentaClienteMe(c *fiber.Ctx) error {
	// Cuando exista middleware JWT, este valor debe venir desde c.Locals("cliente_id").
	clienteIDRaw := c.Locals("cliente_id")
	var idCliente int

	if clienteIDRaw != nil {
		switch v := clienteIDRaw.(type) {
		case int:
			idCliente = v
		case string:
			parsed, err := strconv.Atoi(v)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cliente_id invalido en token"})
			}
			idCliente = parsed
		default:
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cliente_id invalido en token"})
		}
	} else {
		// Fallback temporal para ambientes sin auth (ej: pruebas locales).
		clienteIDQuery := c.Query("cliente_id")
		if clienteIDQuery == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cliente_id no disponible"})
		}

		parsed, err := strconv.Atoi(clienteIDQuery)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cliente_id invalido"})
		}
		idCliente = parsed
	}

	data, err := services.ObtenerEstadoCuentaClienteFormatoFrontend(idCliente)
	if err != nil {
		if err.Error() == "cliente no encontrado" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		if err.Error() == "id de cliente invalido" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(data)
}

func ObtenerEstadoCuentaClientePorID(c *fiber.Ctx) error {
	idCliente, err := strconv.Atoi(c.Params("clienteId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id de cliente invalido"})
	}

	data, err := services.ObtenerEstadoCuentaClienteFormatoFrontend(idCliente)
	if err != nil {
		if err.Error() == "cliente no encontrado" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		if err.Error() == "id de cliente invalido" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(data)
}

func ObtenerAlertasClienteMe(c *fiber.Ctx) error {
	clienteIDRaw := c.Locals("cliente_id")
	var idCliente int

	if clienteIDRaw != nil {
		switch v := clienteIDRaw.(type) {
		case int:
			idCliente = v
		case string:
			parsed, err := strconv.Atoi(v)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cliente_id invalido en token"})
			}
			idCliente = parsed
		default:
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cliente_id invalido en token"})
		}
	} else {
		clienteIDQuery := c.Query("cliente_id")
		if clienteIDQuery == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cliente_id no disponible"})
		}

		parsed, err := strconv.Atoi(clienteIDQuery)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cliente_id invalido"})
		}
		idCliente = parsed
	}

	data, err := services.ObtenerAlertasCliente(idCliente)
	if err != nil {
		if err.Error() == "cliente no encontrado" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		if err.Error() == "id de cliente invalido" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(data)
}

func ObtenerAlertasClientePorID(c *fiber.Ctx) error {
	idCliente, err := strconv.Atoi(c.Params("clienteId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id de cliente invalido"})
	}

	data, err := services.ObtenerAlertasCliente(idCliente)
	if err != nil {
		if err.Error() == "cliente no encontrado" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		if err.Error() == "id de cliente invalido" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(data)
}
