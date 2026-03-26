package services

import (
	"backend/internal/models"
	"backend/internal/repositories"
	"errors"
	"math"
	"strings"
	"time"
)

func redondear2(valor float64) float64 {
	return math.Round(valor*100) / 100
}

func RegistrarPago(req models.RegistrarPagoRequest) (*models.RegistrarPagoResponse, error) {
	if req.FacturaID <= 0 {
		return nil, errors.New("factura_id invalido")
	}

	if req.Monto <= 0 {
		return nil, errors.New("el monto debe ser mayor a 0")
	}

	req.Metodo = strings.ToLower(strings.TrimSpace(req.Metodo))
	if req.Metodo != "cheque" && req.Metodo != "transferencia" && req.Metodo != "tarjeta" {
		return nil, errors.New("metodo invalido")
	}

	req.Banco = strings.TrimSpace(req.Banco)
	// El banco es obligatorio excepto para pagos con tarjeta
	if req.Metodo != "tarjeta" && req.Banco == "" {
		return nil, errors.New("el banco es obligatorio")
	}

	req.NumeroAutorizacion = strings.TrimSpace(req.NumeroAutorizacion)
	if req.NumeroAutorizacion == "" {
		return nil, errors.New("el numero de autorizacion es obligatorio")
	}

	factura, err := repositories.ObtenerFacturaActivaPorID(req.FacturaID)
	if err != nil {
		return nil, err
	}

	estadoNormalizado := strings.ToLower(strings.TrimSpace(factura.Estado))
	if estadoNormalizado != "certificada pendiente de pago" && estadoNormalizado != "certificado" {
		return nil, errors.New("solo se pueden registrar pagos a facturas certificadas")
	}

	totalPagadoAntes, err := repositories.ObtenerTotalPagadoPorFactura(req.FacturaID)
	if err != nil {
		return nil, err
	}

	saldoAntes := redondear2((factura.Total + factura.IVA) - totalPagadoAntes)
	if redondear2(req.Monto) > saldoAntes {
		return nil, errors.New("el monto excede el saldo pendiente de la factura")
	}

	limiteCredito, err := repositories.ObtenerLimiteCreditoCliente(factura.ClienteID)
	if err != nil {
		return nil, err
	}

	deudaAntes, err := repositories.ObtenerDeudaTotalCliente(factura.ClienteID)
	if err != nil {
		return nil, err
	}

	err = repositories.InsertarPago(req, "pagado")
	if err != nil {
		return nil, err
	}

	totalPagadoDespues, err := repositories.ObtenerTotalPagadoPorFactura(req.FacturaID)
	if err != nil {
		return nil, err
	}

	saldoFacturaRestante := redondear2((factura.Total + factura.IVA) - totalPagadoDespues)

	// Solo cambiar a 'pagada' si el saldo pendiente es 0 (toleancia de redondeo)
	if saldoFacturaRestante <= 0 {
		err = repositories.ActualizarEstadoFacturaPagada(req.FacturaID)
		if err != nil {
			return nil, err
		}
	}

	if saldoFacturaRestante < 0 {
		saldoFacturaRestante = 0
	}

	deudaDespues, err := repositories.ObtenerDeudaTotalCliente(factura.ClienteID)
	if err != nil {
		return nil, err
	}

	creditoDisponible := limiteCredito - deudaDespues
	if creditoDisponible < 0 {
		creditoDisponible = 0
	}

	creditoLiberado := deudaAntes - deudaDespues
	if creditoLiberado < 0 {
		creditoLiberado = 0
	}

	return &models.RegistrarPagoResponse{
		Message:              "pago registrado correctamente y credito liberado",
		FacturaID:            factura.ID,
		ClienteID:            factura.ClienteID,
		MontoRegistrado:      redondear2(req.Monto),
		SaldoFacturaRestante: redondear2(saldoFacturaRestante),
		DeudaTotalCliente:    redondear2(deudaDespues),
		LimiteCredito:        redondear2(limiteCredito),
		CreditoDisponible:    redondear2(creditoDisponible),
		CreditoLiberado:      redondear2(creditoLiberado),
		Metodo:               req.Metodo,
		Banco:                req.Banco,
		NumeroAutorizacion:   req.NumeroAutorizacion,
		EstadoPago:           "pagado",
	}, nil
}
func ObtenerPagos() ([]models.Pago, error) {
	return repositories.ObtenerPagos()
}

func ObtenerPagosPorFactura(facturaID int) ([]models.Pago, error) {
	return repositories.ObtenerPagosPorFactura(facturaID)
}

func ObtenerPagosPendientes() ([]models.Pago, error) {
	return repositories.ObtenerPagosPendientes()
}

func ObtenerEstadoCuentaPorCliente(idCliente int) (*models.EstadoCuentaCliente, error) {
	return repositories.ObtenerEstadoCuentaPorCliente(idCliente)
}

func ObtenerEstadoCuentaPorNIT(nit string) (*models.EstadoCuentaCliente, error) {
	return repositories.ObtenerEstadoCuentaPorNIT(nit)
}

func ObtenerClientesConCredito() ([]repositories.ClienteCredito, error) {
	return repositories.ObtenerClientesConCredito()
}

func ObtenerAntiguedadSaldosCliente(idCliente int) (*models.AntiguedadSaldosCliente, error) {
	return repositories.ObtenerAntiguedadSaldosCliente(idCliente)
}

func ObtenerEstadoCuentaClienteFormatoFrontend(idCliente int) (*models.EstadoCuentaResponse, error) {
	if idCliente <= 0 {
		return nil, errors.New("id de cliente invalido")
	}

	return repositories.ObtenerEstadoCuentaClienteFormatoFrontend(idCliente)
}

func ResolveClientID(referenceID int) (int, error) {
	if referenceID <= 0 {
		return 0, errors.New("id de cliente invalido")
	}

	resolver := repositories.NewClientProfileRepository()
	return resolver.ResolveClientID(referenceID)
}

func ObtenerAlertasCliente(idCliente int) (*models.AlertasClienteResponse, error) {
	if idCliente <= 0 {
		return nil, errors.New("id de cliente invalido")
	}

	metricas, err := repositories.ObtenerMetricasAlertasCliente(idCliente)
	if err != nil {
		return nil, err
	}

	creditoMaximo := metricas.CreditoMaximo
	creditoUsado := metricas.CreditoUsado
	riesgoAlto := metricas.RiesgoAlto

	limiteAlcanzado := creditoUsado >= creditoMaximo
	usoCredito := 0.0
	if creditoMaximo > 0 {
		usoCredito = creditoUsado / creditoMaximo
	}
	creditoCercano := usoCredito >= 0.8 && usoCredito < 0.9

	contratoVencido := false
	contratoPorVencer := false
	if metricas.FechaFinContrato != nil {
		hoy := time.Now().Truncate(24 * time.Hour)
		fechaFin := metricas.FechaFinContrato.Truncate(24 * time.Hour)

		contratoVencido = hoy.After(fechaFin)
		diasParaVencer := int(fechaFin.Sub(hoy).Hours() / 24)
		contratoPorVencer = diasParaVencer >= 0 && diasParaVencer <= 5
	}

	clienteBloqueado := limiteAlcanzado || riesgoAlto
	clienteEnRevision := riesgoAlto
	puedeCrearOrdenes := !(clienteBloqueado || contratoVencido)

	alertas := []models.AlertaClienteItem{
		{
			Codigo:    "CLIENTE_BLOQUEADO",
			Titulo:    "Cliente bloqueado",
			Severidad: "critica",
			Activa:    clienteBloqueado,
			Mensaje:   "Su cuenta se encuentra bloqueada. Contacte a soporte.",
			Condicion: "creditoUsado >= creditoMaximo OR riesgoAlto = true",
		},
		{
			Codigo:    "LIMITE_CREDITO_ALCANZADO",
			Titulo:    "Límite de crédito alcanzado",
			Severidad: "preventiva",
			Activa:    limiteAlcanzado,
			Mensaje:   "Ha alcanzado su límite de crédito. No puede generar nuevas órdenes.",
			Condicion: "creditoUsado >= creditoMaximo",
		},
		{
			Codigo:    "CREDITO_CERCANO_LIMITE",
			Titulo:    "Crédito cercano al límite",
			Severidad: "informativa",
			Activa:    creditoCercano,
			Mensaje:   "Está próximo a alcanzar su límite de crédito.",
			Condicion: "0.8 <= usoCredito < 0.9",
		},
		{
			Codigo:    "CONTRATO_VENCIDO",
			Titulo:    "Contrato vencido",
			Severidad: "critica",
			Activa:    contratoVencido,
			Mensaje:   "Su contrato ha expirado. No puede operar.",
			Condicion: "fechaActual > fechaFinContrato",
		},
		{
			Codigo:    "CONTRATO_POR_VENCER",
			Titulo:    "Contrato por vencer",
			Severidad: "preventiva",
			Activa:    contratoPorVencer,
			Mensaje:   "Su contrato está próximo a vencer.",
			Condicion: "0 <= diasParaVencer <= 5",
		},
		{
			Codigo:    "CLIENTE_EN_REVISION",
			Titulo:    "Cliente en revisión (riesgo)",
			Severidad: "informativa",
			Activa:    clienteEnRevision,
			Mensaje:   "Su cuenta está bajo revisión administrativa.",
			Condicion: "riesgoAlto = true",
		},
	}

	alertasActivas := make([]models.AlertaClienteItem, 0)
	totalActivas := 0
	for _, alerta := range alertas {
		if alerta.Activa {
			totalActivas++
			alertasActivas = append(alertasActivas, alerta)
		}
	}

	return &models.AlertasClienteResponse{
		Resumen: models.AlertaClienteResumen{
			Bloqueado:         clienteBloqueado,
			PuedeCrearOrdenes: puedeCrearOrdenes,
			TotalActivas:      totalActivas,
		},
		Alertas: alertasActivas,
	}, nil
}
