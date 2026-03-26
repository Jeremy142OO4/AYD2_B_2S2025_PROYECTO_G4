package routes

import (
	/*"backend/internal/controllers"
	  middleware "backend/internal/middlewares"*/

	"backend/internal/controllers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Backend funcionando",
		})
	})

	// CLIENTES
	app.Get("/listado_clientes", controllers.ListaClientes)
	app.Post("/clientes/empresas", controllers.CrearClienteEmpresa)
	app.Put("/clientes/:id/riesgo", controllers.ActualizarRiesgoCliente)
	app.Get("/api/operativo/clientes", controllers.ListaClientes)
	app.Post("/api/operativo/clientes", controllers.CrearClienteEmpresa)
	app.Put("/api/operativo/clientes/:id/riesgo", controllers.ActualizarRiesgoCliente)
	app.Get("/clientes/:id/filtro-comercial", controllers.EvaluarFiltroComercial)
	app.Get("/api/clientes/me/dashboard", controllers.ObtenerDashboardCliente)
	app.Post("/api/clientes/me/solicitudes", controllers.CrearSolicitudClienteMe)
	app.Get("/api/clientes/me/rutas-autorizadas", controllers.ObtenerRutasAutorizadasClienteMe)
	app.Get("/api/clientes/me/solicitudes", controllers.ObtenerHistorialSolicitudesClienteMe)
	app.Get("/api/clientes/me/seguimiento", controllers.ObtenerSeguimientoClienteMe)
	app.Post("/api/clientes/me/seguimiento/:solicitudId/confirmar-recepcion", controllers.ConfirmarRecepcionClienteMe)
	app.Get("/api/clientes/me/pagos", controllers.ObtenerPagosClienteMe)
	app.Post("/api/clientes/me/pagos/intencion", controllers.RegistrarIntencionPagoClienteMe)
	app.Get("/api/clientes/me/estado-cuenta", controllers.ObtenerEstadoCuentaClienteMe)
	app.Get("/api/clientes/:clienteId/estado-cuenta", controllers.ObtenerEstadoCuentaClientePorID)
	app.Get("/api/clientes/me/alertas", controllers.ObtenerAlertasClienteMe)
	app.Get("/api/clientes/me/perfil", controllers.ObtenerPerfilClienteMe)
	app.Patch("/api/clientes/me/perfil", controllers.ActualizarPerfilClienteMe)
	app.Put("/api/clientes/me/contrasena", controllers.CambiarContrasenaClienteMe)
	app.Get("/api/clientes/:clienteId/alertas", controllers.ObtenerAlertasClientePorID)
	app.Get("/api/clientes/:clienteId/perfil", controllers.ObtenerPerfilCliente)
	app.Patch("/api/clientes/:clienteId/perfil", controllers.ActualizarPerfilCliente)
	app.Put("/api/clientes/:clienteId/contrasena", controllers.CambiarContrasenaCliente)

	// PILOTOS
	app.Post("/crear_pilotos", controllers.CrearPiloto)
	app.Get("/listar_pilotos", controllers.ListarPilotos)
	app.Get("/listar_piloto/:id", controllers.ObtenerPiloto)
	app.Put("/editar_pilotos/:id", controllers.ActualizarPiloto)
	app.Delete("/eliminar_pilotos/:id", controllers.EliminarPiloto)
	app.Get("/listar_piloto/usuario/:usuario_id", controllers.ObtenerPilotoPorUsuario)

	// CONTRATOS
	app.Get("/api/operativo/contratos", controllers.ObtenerContratos)
	app.Post("/api/operativo/contratos", controllers.CrearContratoDigital)
	app.Get("/api/operativo/clientes/opciones", controllers.ObtenerClientes)
	app.Get("/api/operativo/ordenes-servicio", controllers.ObtenerOrdenes)
	app.Post("/api/operativo/ordenes-servicio/generar", controllers.GenerarOrdenServicioOperativo)
	app.Get("/api/operativo/dashboard", controllers.ObtenerDashboardOperativo)

	app.Post("/login", controllers.Login) //Sin restriccion de acceso

	// app.Post("/agente/crear-propiedades", middleware.Authorize("ADMIN"), controllers.CreateProperty) //Con restriccion de acceso
	// FACTURACION
	app.Get("/facturas", controllers.ObtenerFacturas)
	app.Get("/facturas/pendientes", controllers.ObtenerFacturasPendientes)
	app.Get("/facturas/borrador", controllers.ObtenerFacturasBorrador)
	app.Get("/facturas/certificadas-pendiente", controllers.ObtenerFacturasCertificadasPendiente)
	app.Get("/facturas/:id", controllers.ObtenerDetalleFactura)

	// PAGOS
	app.Post("/pagos", controllers.RegistrarPago)
	app.Get("/pagos", controllers.ObtenerPagos)
	app.Get("/pagos/factura/:idFactura", controllers.ObtenerPagosPorFactura)
	app.Get("/pagos/pendientes", controllers.ObtenerPagosPendientes)

	// ESTADO DE CUENTA
	app.Get("/estado-cuenta/cliente/:idCliente", controllers.ObtenerEstadoCuentaPorCliente)
	app.Get("/estado-cuenta/nit/:nit", controllers.ObtenerEstadoCuentaPorNIT)
	app.Get("/clientes/creditos", controllers.ObtenerClientesConCredito)
	app.Get("/pagos/antiguedad-saldos/:idCliente", controllers.ObtenerAntiguedadSaldosCliente)

	// GERENCIA
	// ejemplo para la url /gerencia/operaciones-diarias?sede=Guatemala&fecha=2026-03-24
	app.Get("/gerencia/operaciones-diarias", controllers.MostrarOperacionesDiariasPorSede)

	// ejemplo para la url /gerencia/ingresos-vs-costos?fecha_inicio=2026-03-01&fecha_fin=2026-03-24
	app.Get("/gerencia/ingresos-vs-costos", controllers.MostrarIngresosVsCostos)

	// ejemplo para la url /gerencia/cumplimiento-tiempos?fecha_inicio=2026-03-01&fecha_fin=2026-03-24
	app.Get("/gerencia/cumplimiento-tiempos", controllers.MostrarCumplimientoTiempos)

	// ejemplo para la url /gerencia/alertas-desviacion?fecha_inicio=2026-03-01&fecha_fin=2026-03-24
	app.Get("/gerencia/alertas-desviacion", controllers.ObtenerAlertasDesviacion)

	app.Post("/gerencia/corte-diario", controllers.ImplementarCorteDiarioOperaciones)
	/*
		ejemplo para la url /gerencia/corte-diario con body
			{
			"fecha": "2026-03-24",
			"sede": "Guatemala",
			"observaciones": "Cierre automático del día"
			}
	*/

	/*

		NUEVO

	*/

	app.Get("/obtener_clientes_id", controllers.ObtenerClientes)
	app.Get("/obtener_contratos_id", controllers.ObtenerContratos)

	//Ordenes
	app.Post("/agente_logistico/ordenes/crear_orden", controllers.CrearOrden)
	app.Put("/agente_logistico/ordenes/:id/cerrar", controllers.CerrarOrden)
	app.Get("/agente_logistico/ordenes/obtener_ordenes", controllers.ObtenerOrdenes)
	app.Post("/agente_logistico/ordenes/asignar_viaje", controllers.AsignarViaje)

	//Vehiculos
	app.Post("/agente_logistico/vehiculos/crear_camion", controllers.CrearCamion)
	app.Get("/agente_logistico/vehiculos/obtener_camiones", controllers.ObtenerCamiones)

	//Pilotos
	app.Post("/agente_logistico/piloto/agregar_piloto", controllers.AgregarPiloto)
	app.Get("/agente_logistico/piloto/obtener_pilotos", controllers.ObtenerPilotos)
	app.Get("/agente_logistico/piloto/obtener_historial_piloto/:id", controllers.HistorialPilotos)
	app.Get("/agente_logistico/bitacora/obtener_bitacora", controllers.ObtenerBitacora)

	//Dashboard patio
	app.Get("/patio/viajes/por_salir", controllers.ObtenerViajesPorSalir)
	app.Post("/patio/vehiculos/validar_capacidad", controllers.ValidarCapacidad)

	app.Post("/validar_y_enviar_factura/:id_factura", controllers.ProcesarFactura)

	app.Post("/viajes/detalle/reportar_evento", controllers.ReportarEvento)

	app.Post("/viajes/detalle/cancelar/:id_orden", controllers.CancelarOrden)

	app.Post("/viajes/detalle/validar/:id_orden", controllers.ValidarOrden)

	app.Get("/agente_logistico/piloto/bitacora/:id", controllers.BitacoraPiloto)

}
