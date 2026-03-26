package models

import "time"

type Factura struct {
	ID              int       `json:"id"`
	OrdenID         int       `json:"orden_id"`
	ClienteID       int       `json:"cliente_id"`
	Total           float64   `json:"total"`
	IVA             float64   `json:"iva"`
	Saldo           float64   `json:"saldo"`
	UUID            string    `json:"uuid"`
	Fecha           time.Time `json:"fecha"`
	Estado          string    `json:"estado"`
	ClienteNombre   *string   `json:"cliente_nombre,omitempty"`
	NIT             *string   `json:"nit,omitempty"`
	DireccionFiscal *string   `json:"direccion_fiscal,omitempty"`
}

type DetalleFactura struct {
	ID          int     `json:"id"`
	FacturaID   int     `json:"factura_id"`
	Descripcion string  `json:"descripcion"`
	Monto       float64 `json:"monto"`
}

type FacturaDetalleResponse struct {
	Factura Factura          `json:"factura"`
	Detalle []DetalleFactura `json:"detalle"`
}

type ProcesarFacturaResponse struct {
	Message      string `json:"message"`
	FacturaID    int    `json:"factura_id"`
	Uuid         string `json:"uuid"`
	Autorizacion string `json:"autorizacion"`
	Serie        string `json:"serie"`
}
