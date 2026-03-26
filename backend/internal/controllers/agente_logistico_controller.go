package controllers

import (
	"backend/internal/models"
	"backend/internal/services"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func CrearOrden(c *fiber.Ctx) error {
	var body models.CrearOrdenRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "body invalido",
		})
	}

	err := services.CrearOrden(body)
	if err != nil {
		switch err.Error() {
		case "cliente_id invalido",
			"contrato_id invalido",
			"ruta_id invalido",
			"estado_id invalido",
			"el peso debe ser mayor a 0",
			"cliente no encontrado",
			"contrato no encontrado",
			"el contrato no pertenece al cliente",
			"el contrato no esta activo",
			"ruta no encontrada",
			"estado invalido":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "no se pudo crear la orden",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "orden creada correctamente",
	})
}

func CerrarOrden(c *fiber.Ctx) error {
	idParam := c.Params("id")
	ordenID, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "orden_id invalido",
		})
	}

	resp, err := services.CerrarOrden(ordenID)
	if err != nil {
		switch err.Error() {
		case "orden_id invalido":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		case "sql: no rows in result set":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "orden no encontrada"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "no se pudo cerrar la orden y generar el borrador FEL",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(resp)
}

func ObtenerOrdenes(c *fiber.Ctx) error {
	ordenes, err := services.ObtenerOrdenes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no se pudieron obtener las ordenes",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": ordenes,
	})
}

func GenerarOrdenServicioOperativo(c *fiber.Ctx) error {
	var body models.GenerarOrdenOperativoRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "body invalido",
		})
	}

	resp, err := services.GenerarOrdenServicioOperativo(body)
	if err != nil {
		switch err.Error() {
		case "cliente_id invalido",
			"origen y destino son obligatorios",
			"el peso debe ser mayor a 0",
			"cliente no encontrado",
			"cliente bloqueado por riesgo alto",
			"cliente sin contrato vigente",
			"ruta no autorizada por contrato",
			"credito no disponible",
			"estado operativo no configurado":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "no se pudo generar la orden de servicio",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "orden de servicio generada correctamente",
		"data":    resp,
	})
}

func AsignarViaje(c *fiber.Ctx) error {
	var body models.AsignarViajeRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "body invalido",
		})
	}

	err := services.AsignarViaje(body)
	if err != nil {
		switch err.Error() {
		case "orden_id invalido",
			"vehiculo_id invalido",
			"piloto_id invalido",
			"fecha_salida es obligatoria",
			"formato de fecha invalido, usar dd/mm/yyyy",
			"la orden ya tiene un viaje asignado":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "no se pudo asignar el viaje",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "viaje asignado correctamente",
	})
}

func CrearCamion(c *fiber.Ctx) error {
	var body models.CrearCamionRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "body invalido",
		})
	}

	err := services.CrearCamion(body)
	if err != nil {
		switch err.Error() {
		case "la placa es obligatoria",
			"el tipo es obligatorio",
			"la capacidad debe ser mayor a 0",
			"ya existe un vehiculo con esa placa":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "no se pudo crear el camion",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "camion creado correctamente",
	})
}

func ObtenerCamiones(c *fiber.Ctx) error {
	vehiculos, err := services.ObtenerCamiones()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no se pudieron obtener los camiones",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": vehiculos,
	})
}

func AgregarPiloto(c *fiber.Ctx) error {
	var body models.AgregarPilotoRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "body invalido",
		})
	}

	err := services.AgregarPiloto(body)
	if err != nil {
		switch err.Error() {
		case "el nombre es obligatorio",
			"el correo es obligatorio",
			"el password es obligatorio",
			"la licencia es obligatoria",
			"ya existe un usuario con ese correo":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "no se pudo agregar el piloto",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "piloto agregado correctamente",
	})
}

func ObtenerPilotos(c *fiber.Ctx) error {
	pilotos, err := services.ObtenerPilotos()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no se pudieron obtener los pilotos",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": pilotos,
	})
}

func HistorialPilotos(c *fiber.Ctx) error {
	idParam := c.Params("id")

	pilotoID, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id invalido",
		})
	}

	data, err := services.ObtenerHistorialPiloto(pilotoID)
	if err != nil {
		switch err.Error() {
		case "piloto_id invalido", "piloto no encontrado":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "no se pudo obtener el historial",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(data)
}

func ObtenerBitacora(c *fiber.Ctx) error {
	viajes, err := services.ObtenerBitacora()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no se pudo obtener la bitacora",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": viajes,
	})
}

func ObtenerContratos(c *fiber.Ctx) error {
	contratos, err := services.ObtenerContratos()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no se pudieron obtener los contratos",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": contratos,
	})
}

func ObtenerClientes(c *fiber.Ctx) error {
	clientes, err := services.ObtenerClientes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no se pudieron obtener los clientes",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": clientes,
	})
}

func ObtenerViajesPorSalir(c *fiber.Ctx) error {
	viajes, err := services.ObtenerViajesPorSalir()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no se pudieron obtener los viajes",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": viajes,
	})
}

func ValidarCapacidad(c *fiber.Ctx) error {
	var body models.ValidarCapacidadRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "body invalido",
		})
	}

	valido, err := services.ValidarCapacidad(body)
	if err != nil {
		switch err.Error() {
		case "la placa es obligatoria",
			"el peso debe ser mayor a 0",
			"vehiculo no encontrado":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "error al validar capacidad",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"valido": valido,
	})
}

func ProcesarFactura(c *fiber.Ctx) error {
	idParam := c.Params("id_factura")

	facturaID, err := strconv.Atoi(idParam)
	if err != nil || facturaID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "factura_id invalido",
		})
	}

	req := models.ProcesarFacturaRequest{
		FacturaID: facturaID,
	}

	resp, err := services.ProcesarFactura(req)
	if err != nil {
		switch err.Error() {
		case "factura_id invalido",
			"factura no encontrada",
			"la factura no esta en estado borrador",
			"nit invalido",
			"correo no disponible":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "no se pudo procesar la factura",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(resp)
}

func ReportarEvento(c *fiber.Ctx) error {
	var req models.ReportarEventoRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	resp, err := services.ReportarEvento(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(resp)
}

func CancelarOrden(c *fiber.Ctx) error {
	idParam := c.Params("id_orden")

	idOrden, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id de orden invalido",
		})
	}

	resp, err := services.CancelarOrden(idOrden)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(resp)
}

func ValidarOrden(c *fiber.Ctx) error {
	idParam := c.Params("id_orden")

	idOrden, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id de orden invalido",
		})
	}

	resp, err := services.ValidarOrden(idOrden)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(resp)
}

func BitacoraPiloto(c *fiber.Ctx) error {
	idParam := c.Params("id")

	pilotoID, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id invalido",
		})
	}

	data, err := services.ObtenerBitacoraPiloto(pilotoID)
	if err != nil {
		switch err.Error() {
		case "piloto_id invalido", "piloto no encontrado":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "no se pudo obtener la bitacora",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(data)
}
