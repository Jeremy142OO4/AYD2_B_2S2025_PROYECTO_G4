package models

import "time"

type Pago struct {
	ID                 int       `json:"id"`
	FacturaID          int       `json:"factura_id"`
	Monto              float64   `json:"monto"`
	Metodo             string    `json:"metodo"`
	Banco              string    `json:"banco"`
	NumeroAutorizacion string    `json:"numero_autorizacion"`
	Fecha              time.Time `json:"fecha"`
	Estado             string    `json:"estado"`
}

type RegistrarPagoRequest struct {
	FacturaID          int     `json:"factura_id"`
	Monto              float64 `json:"monto"`
	Metodo             string  `json:"metodo"`
	Banco              string  `json:"banco"`
	NumeroAutorizacion string  `json:"numero_autorizacion"`
}

type RegistrarPagoResponse struct {
	Message              string  `json:"message"`
	FacturaID            int     `json:"factura_id"`
	ClienteID            int     `json:"cliente_id"`
	MontoRegistrado      float64 `json:"monto_registrado"`
	SaldoFacturaRestante float64 `json:"saldo_factura_restante"`
	DeudaTotalCliente    float64 `json:"deuda_total_cliente"`
	LimiteCredito        float64 `json:"limite_credito"`
	CreditoDisponible    float64 `json:"credito_disponible"`
	CreditoLiberado      float64 `json:"credito_liberado"`
	Metodo               string  `json:"metodo"`
	Banco                string  `json:"banco"`
	NumeroAutorizacion   string  `json:"numero_autorizacion"`
	EstadoPago           string  `json:"estado_pago"`
}

type FacturaEstadoCuenta struct {
	FacturaID    int       `json:"factura_id"`
	FechaFactura time.Time `json:"fecha_factura"`
	TotalFactura float64   `json:"total_factura"`
	TotalPagado  float64   `json:"total_pagado"`
	Saldo        float64   `json:"saldo"`
}

type EstadoCuentaCliente struct {
	ClienteID      int                   `json:"cliente_id"`
	LimiteCredito  float64               `json:"limite_credito"`
	DiasCredito    int                   `json:"dias_credito"`
	TotalFacturado float64               `json:"total_facturado"`
	TotalPagado    float64               `json:"total_pagado"`
	SaldoPendiente float64               `json:"saldo_pendiente"`
	Facturas       []FacturaEstadoCuenta `json:"facturas"`
}

type AntiguedadSaldosCliente struct {
	ClienteID    int     `json:"cliente_id"`
	DiasCredito  int     `json:"dias_credito"`
	Corriente    float64 `json:"corriente"`
	De1a30       float64 `json:"de_1_a_30"`
	De31a60      float64 `json:"de_31_a_60"`
	De61a90      float64 `json:"de_61_a_90"`
	MasDe90      float64 `json:"mas_de_90"`
	TotalVencido float64 `json:"total_vencido"`
}

type FacturaEstadoCuentaItem struct {
	Numero           string  `json:"numero"`
	FechaEmision     string  `json:"fechaEmision"`
	FechaVencimiento string  `json:"fechaVencimiento"`
	Monto            float64 `json:"monto"`
	Estado           string  `json:"estado"`
}

type PagoEstadoCuentaItem struct {
	ID                 int     `json:"id"`
	FacturaID          int     `json:"factura_id"`
	Monto              float64 `json:"monto"`
	Metodo             string  `json:"metodo"`
	Banco              string  `json:"banco"`
	NumeroAutorizacion string  `json:"numero_autorizacion"`
	Fecha              string  `json:"fecha"`
	Estado             string  `json:"estado"`
}

type EstadoCuentaResponse struct {
	LimiteCredito   float64                   `json:"limiteCredito"`
	Facturas        []FacturaEstadoCuentaItem `json:"facturas"`
	PagosRealizados []PagoEstadoCuentaItem    `json:"pagos_realizados"`
	TotalFacturado  float64                   `json:"total_facturado"`
	TotalPagado     float64                   `json:"total_pagado"`
	SaldoPendiente  float64                   `json:"saldo_pendiente"`
}

type AlertaClienteResumen struct {
	Bloqueado         bool `json:"bloqueado"`
	PuedeCrearOrdenes bool `json:"puedeCrearOrdenes"`
	TotalActivas      int  `json:"totalActivas"`
}

type AlertaClienteItem struct {
	Codigo    string `json:"codigo"`
	Titulo    string `json:"titulo"`
	Severidad string `json:"severidad"`
	Activa    bool   `json:"activa"`
	Mensaje   string `json:"mensaje"`
	Condicion string `json:"condicion"`
}

type AlertasClienteResponse struct {
	Resumen AlertaClienteResumen `json:"resumen"`
	Alertas []AlertaClienteItem  `json:"alertas"`
}

type AlertasClienteMetricas struct {
	CreditoMaximo    float64
	CreditoUsado     float64
	RiesgoAlto       bool
	FechaFinContrato *time.Time
}
