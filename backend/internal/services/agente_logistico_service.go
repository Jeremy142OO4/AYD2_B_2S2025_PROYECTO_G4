package services

import (
	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/utils"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

func ObtenerOrdenes() ([]models.OrdenResponse, error) {
	ordenes, err := repositories.ObtenerOrdenes()
	if err != nil {
		return nil, err
	}

	return ordenes, nil
}

func AsignarViaje(req models.AsignarViajeRequest) error {

	if req.OrdenID <= 0 {
		return errors.New("orden_id invalido")
	}

	if req.VehiculoID <= 0 {
		return errors.New("vehiculo_id invalido")
	}

	if req.PilotoID <= 0 {
		return errors.New("piloto_id invalido")
	}

	if strings.TrimSpace(req.FechaSalida) == "" {
		return errors.New("fecha_salida es obligatoria")
	}

	fecha, err := time.Parse("02/01/2006", req.FechaSalida)
	if err != nil {
		return errors.New("formato de fecha invalido, usar dd/mm/yyyy")
	}

	fecha = time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, time.UTC)

	existe, err := repositories.ExisteAsignacionPorOrden(req.OrdenID)
	if err != nil {
		return err
	}

	if existe {
		return errors.New("la orden ya tiene un viaje asignado")
	}

	err = repositories.InsertarAsignacion(req, fecha)
	if err != nil {
		return err
	}

	return nil
}

func CrearCamion(req models.CrearCamionRequest) error {

	if strings.TrimSpace(req.Placa) == "" {
		return errors.New("la placa es obligatoria")
	}

	if strings.TrimSpace(req.Tipo) == "" {
		return errors.New("el tipo es obligatorio")
	}

	if req.Capacidad <= 0 {
		return errors.New("la capacidad debe ser mayor a 0")
	}

	existe, err := repositories.ExisteVehiculoPorPlaca(req.Placa)
	if err != nil {
		return err
	}

	if existe {
		return errors.New("ya existe un vehiculo con esa placa")
	}

	err = repositories.InsertarVehiculo(req)
	if err != nil {
		return err
	}

	return nil
}

func ObtenerCamiones() ([]models.VehiculoResponse, error) {
	return repositories.ObtenerCamiones()
}

func AgregarPiloto(req models.AgregarPilotoRequest) error {

	if strings.TrimSpace(req.Nombre) == "" {
		return errors.New("el nombre es obligatorio")
	}

	if strings.TrimSpace(req.Correo) == "" {
		return errors.New("el correo es obligatorio")
	}

	if strings.TrimSpace(req.Password) == "" {
		return errors.New("el password es obligatorio")
	}

	if strings.TrimSpace(req.Licencia) == "" {
		return errors.New("la licencia es obligatoria")
	}

	existe, err := repositories.ExisteUsuarioPorCorreo(req.Correo)
	if err != nil {
		return err
	}

	if existe {
		return errors.New("ya existe un usuario con ese correo")
	}

	userID, err := repositories.InsertarUsuario(req)
	if err != nil {
		return err
	}

	err = repositories.InsertarPiloto(userID, req.Licencia)
	if err != nil {
		return err
	}

	err = repositories.AsignarRolPiloto(userID)
	if err != nil {
		return err
	}

	return nil
}

func CrearOrden(req models.CrearOrdenRequest) error {

	if req.ClienteID <= 0 {
		return errors.New("cliente_id invalido")
	}

	if req.ContratoID <= 0 {
		return errors.New("contrato_id invalido")
	}

	if req.RutaID <= 0 {
		return errors.New("ruta_id invalido")
	}

	if req.EstadoID <= 0 {
		return errors.New("estado_id invalido")
	}

	if req.Peso <= 0 {
		return errors.New("el peso debe ser mayor a 0")
	}

	existe, err := repositories.ExisteCliente(req.ClienteID)
	if err != nil {
		return err
	}
	if !existe {
		return errors.New("cliente no encontrado")
	}

	clienteContrato, activo, err := repositories.ObtenerContrato(req.ContratoID)
	if err != nil {
		return errors.New("contrato no encontrado")
	}

	if clienteContrato != req.ClienteID {
		return errors.New("el contrato no pertenece al cliente")
	}

	if !activo {
		return errors.New("el contrato no esta activo")
	}

	existe, err = repositories.ExisteRuta(req.RutaID)
	if err != nil {
		return err
	}
	if !existe {
		return errors.New("ruta no encontrada")
	}

	existe, err = repositories.ExisteEstadoOrden(req.EstadoID)
	if err != nil {
		return err
	}
	if !existe {
		return errors.New("estado invalido")
	}

	err = repositories.InsertarOrden(req)
	if err != nil {
		return err
	}

	return nil
}

func CerrarOrden(ordenID int) (*models.CerrarOrdenResponse, error) {
	if ordenID <= 0 {
		return nil, errors.New("orden_id invalido")
	}

	return repositories.CerrarOrdenYGenerarBorradorFEL(ordenID)
}

func ObtenerPilotos() ([]models.PilotoResponse, error) {
	return repositories.ObtenerPilotos()
}

func ObtenerHistorialPiloto(pilotoID int) (models.HistorialPilotoResponse, error) {

	if pilotoID <= 0 {
		return models.HistorialPilotoResponse{}, errors.New("piloto_id invalido")
	}

	nombre, viajes, err := repositories.ObtenerHistorialPiloto(pilotoID)
	if err != nil {
		return models.HistorialPilotoResponse{}, err
	}

	if nombre == "" {
		return models.HistorialPilotoResponse{}, errors.New("piloto no encontrado")
	}

	return models.HistorialPilotoResponse{
		Nombre: nombre,
		Viajes: viajes,
	}, nil
}

func ObtenerBitacora() ([]models.BitacoraViajeResponse, error) {
	return repositories.ObtenerBitacora()
}

func ObtenerContratos() ([]models.ContratoResponse, error) {
	return repositories.ObtenerContratos()
}

func ObtenerClientes() ([]models.ClienteResponse, error) {
	return repositories.ObtenerClientes()
}

func ObtenerViajesPorSalir() ([]models.BitacoraViajeResponse, error) {
	return repositories.ObtenerViajesPorSalir()
}

func ValidarCapacidad(req models.ValidarCapacidadRequest) (bool, error) {

	if strings.TrimSpace(req.Placa) == "" {
		return false, errors.New("la placa es obligatoria")
	}

	if req.Peso <= 0 {
		return false, errors.New("el peso debe ser mayor a 0")
	}

	capacidad, err := repositories.ObtenerCapacidadPorPlaca(req.Placa)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, errors.New("vehiculo no encontrado")
		}
		return false, err
	}

	if capacidad >= req.Peso {
		return true, nil
	}

	return false, nil
}

func ProcesarFactura(req models.ProcesarFacturaRequest) (*models.ProcesarFacturaResponse, error) {

	if req.FacturaID <= 0 {
		return nil, errors.New("factura_id invalido")
	}

	factura, err := repositories.ObtenerFacturaParaEnvio(req.FacturaID)
	if err != nil {
		return nil, errors.New("factura no encontrada")
	}

	// Validar que la factura esté en estado Borrador
	if strings.ToLower(strings.TrimSpace(factura.Estado)) != "borrador" {
		return nil, errors.New("la factura no esta en estado borrador")
	}

	if len(strings.TrimSpace(factura.NIT)) != 13 {
		return nil, errors.New("nit invalido")
	}

	if strings.TrimSpace(factura.Correo) == "" {
		return nil, errors.New("correo no disponible")
	}

	uuidGenerado := uuid.New().String()

	fmt.Println("UUID GENERADO: " + uuidGenerado)

	err = repositories.ActualizarFacturaCertificada(factura.ID, uuidGenerado)
	if err != nil {
		return nil, err
	}

	autorizacion := uuidGenerado[:8]
	serie := "FEL-" + uuidGenerado[:6]

	pdfPath, err := utils.GenerarPDF(factura, uuidGenerado, autorizacion, serie)
	if err != nil {
		return nil, err
	}

	err = utils.EnviarCorreoConPDF(factura.Correo, pdfPath)
	if err != nil {
		return nil, err
	}

	// Retornar los datos FEL
	return &models.ProcesarFacturaResponse{
		Message:      "factura validada y enviada correctamente",
		FacturaID:    factura.ID,
		Uuid:         uuidGenerado,
		Autorizacion: autorizacion,
		Serie:        serie,
	}, nil
}

func ReportarEvento(req models.ReportarEventoRequest) (models.ReportarEventoResponse, error) {
	if req.Placa == "" {
		return models.ReportarEventoResponse{}, errors.New("la placa es requerida")
	}

	if req.Tipo == "" {
		return models.ReportarEventoResponse{}, errors.New("el tipo es requerido")
	}

	if req.Descripcion == "" {
		return models.ReportarEventoResponse{}, errors.New("la descripcion es requerida")
	}

	ordenID, err := repositories.ObtenerOrdenIDPorPlaca(req.Placa)
	if err != nil {
		return models.ReportarEventoResponse{}, err
	}

	err = repositories.InsertarEvento(ordenID, req)
	if err != nil {
		return models.ReportarEventoResponse{}, err
	}

	return models.ReportarEventoResponse{
		Mensaje: "evento reportado correctamente",
	}, nil
}

func CancelarOrden(idOrden int) (models.CancelarOrdenResponse, error) {

	if idOrden <= 0 {
		return models.CancelarOrdenResponse{}, errors.New("id invalido")
	}

	estadoActual, err := repositories.ObtenerEstadoOrden(idOrden)
	if err != nil {
		return models.CancelarOrdenResponse{}, err
	}

	if estadoActual == "Entregado" {
		return models.CancelarOrdenResponse{}, errors.New("no se puede cancelar una orden entregada")
	}

	if estadoActual == "Cancelado" {
		return models.CancelarOrdenResponse{}, errors.New("la orden ya esta cancelada")
	}

	err = repositories.CancelarOrden(idOrden)
	if err != nil {
		return models.CancelarOrdenResponse{}, err
	}

	return models.CancelarOrdenResponse{
		Mensaje: "orden cancelada correctamente",
	}, nil
}

func ValidarOrden(idOrden int) (models.ValidarOrdenResponse, error) {
	if idOrden <= 0 {
		return models.ValidarOrdenResponse{}, errors.New("id invalido")
	}

	estadoActual, err := repositories.ObtenerEstadoOrden(idOrden)
	if err != nil {
		return models.ValidarOrdenResponse{}, err
	}

	if estadoActual == "Cancelado" {
		return models.ValidarOrdenResponse{}, errors.New("no se puede validar una orden cancelada")
	}

	if estadoActual == "Entregado" {
		return models.ValidarOrdenResponse{}, errors.New("la orden ya fue entregada")
	}

	if estadoActual == "En Transito" {
		return models.ValidarOrdenResponse{}, errors.New("la orden ya esta en transito")
	}

	nuevoEstado, err := repositories.ActualizarEstadoEnTransito(idOrden)
	if err != nil {
		return models.ValidarOrdenResponse{}, err
	}

	return models.ValidarOrdenResponse{
		Mensaje: "orden validada correctamente",
		Estado:  nuevoEstado,
	}, nil
}

func ObtenerBitacoraPiloto(pilotoID int) (models.BitacoraPilotoResponse, error) {

	if pilotoID <= 0 {
		return models.BitacoraPilotoResponse{}, errors.New("piloto_id invalido")
	}

	nombre, eventos, err := repositories.ObtenerBitacoraPiloto(pilotoID)
	if err != nil {
		return models.BitacoraPilotoResponse{}, err
	}

	if nombre == "" {
		return models.BitacoraPilotoResponse{}, errors.New("piloto no encontrado")
	}

	return models.BitacoraPilotoResponse{
		Nombre:  nombre,
		Eventos: eventos,
	}, nil
}

func GenerarOrdenServicioOperativo(req models.GenerarOrdenOperativoRequest) (*models.GenerarOrdenOperativoResponse, error) {
	if req.ClienteID <= 0 {
		return nil, errors.New("cliente_id invalido")
	}

	req.Origen = strings.TrimSpace(req.Origen)
	req.Destino = strings.TrimSpace(req.Destino)

	if req.Origen == "" || req.Destino == "" {
		return nil, errors.New("origen y destino son obligatorios")
	}

	if req.Peso <= 0 {
		return nil, errors.New("el peso debe ser mayor a 0")
	}

	return repositories.GenerarOrdenServicioOperativo(req)
}
