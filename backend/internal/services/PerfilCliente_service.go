package services

import (
	"backend/internal/models"
	"backend/internal/repositories"
	"errors"
	"net/mail"
	"regexp"
	"strconv"
	"strings"
)

type ClientProfileService struct {
	repo *repositories.ClientProfileRepository
}

func NewClientProfileService() *ClientProfileService {
	return &ClientProfileService{repo: repositories.NewClientProfileRepository()}
}

func normalizeRisk(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func validateRisk(value string) error {
	normalized := normalizeRisk(value)
	if normalized != "BAJO" && normalized != "MEDIO" && normalized != "ALTO" {
		return errors.New("el riesgo debe ser BAJO, MEDIO o ALTO")
	}
	return nil
}

func calculateGlobalRisk(capacidadPago string, lavadoDinero string, aduanas string) string {
	weights := map[string]int{"BAJO": 1, "MEDIO": 2, "ALTO": 3}
	reverse := map[int]string{1: "BAJO", 2: "MEDIO", 3: "ALTO"}

	maxWeight := weights[capacidadPago]
	if weights[lavadoDinero] > maxWeight {
		maxWeight = weights[lavadoDinero]
	}
	if weights[aduanas] > maxWeight {
		maxWeight = weights[aduanas]
	}

	return reverse[maxWeight]
}

func (s *ClientProfileService) CreateClientProfile(req models.ModelCreateClientProfileRequest) (models.ModelClientRiskProfileResponse, error) {
	req.Nombre = strings.TrimSpace(req.Nombre)
	req.Correo = strings.TrimSpace(req.Correo)
	req.Password = strings.TrimSpace(req.Password)
	req.Nit = strings.TrimSpace(req.Nit)
	req.Direccion = strings.TrimSpace(req.Direccion)
	req.Telefono = strings.TrimSpace(req.Telefono)
	req.CapacidadPago = normalizeRisk(req.CapacidadPago)
	req.LavadoDinero = normalizeRisk(req.LavadoDinero)
	req.RiesgoAduanas = normalizeRisk(req.RiesgoAduanas)

	if req.Nombre == "" || req.Correo == "" || req.Password == "" || req.Nit == "" {
		return models.ModelClientRiskProfileResponse{}, errors.New("nombre, correo, password y nit son obligatorios")
	}
	if req.LimiteCredito < 0 {
		return models.ModelClientRiskProfileResponse{}, errors.New("limite_credito no puede ser negativo")
	}
	if req.DiasCredito < 0 {
		return models.ModelClientRiskProfileResponse{}, errors.New("dias_credito no puede ser negativo")
	}

	if err := validateRisk(req.CapacidadPago); err != nil {
		return models.ModelClientRiskProfileResponse{}, errors.New("capacidad_pago invalida: " + err.Error())
	}
	if err := validateRisk(req.LavadoDinero); err != nil {
		return models.ModelClientRiskProfileResponse{}, errors.New("lavado_dinero invalido: " + err.Error())
	}
	if err := validateRisk(req.RiesgoAduanas); err != nil {
		return models.ModelClientRiskProfileResponse{}, errors.New("aduanas invalido: " + err.Error())
	}

	req.RiesgoGlobal = calculateGlobalRisk(req.CapacidadPago, req.LavadoDinero, req.RiesgoAduanas)

	return s.repo.CreateClientProfile(req)
}

func (s *ClientProfileService) UpdateClientRiskProfile(clienteID int, req models.ModelUpdateClientRiskRequest) (models.ModelClientRiskProfileResponse, error) {
	if clienteID <= 0 {
		return models.ModelClientRiskProfileResponse{}, errors.New("id de cliente invalido")
	}

	req.Direccion = strings.TrimSpace(req.Direccion)
	req.Telefono = strings.TrimSpace(req.Telefono)
	req.CapacidadPago = normalizeRisk(req.CapacidadPago)
	req.LavadoDinero = normalizeRisk(req.LavadoDinero)
	req.RiesgoAduanas = normalizeRisk(req.RiesgoAduanas)

	if req.Direccion == "" || req.Telefono == "" {
		return models.ModelClientRiskProfileResponse{}, errors.New("direccion y telefono son obligatorios")
	}
	if req.LimiteCredito < 0 {
		return models.ModelClientRiskProfileResponse{}, errors.New("limite_credito no puede ser negativo")
	}
	if req.DiasCredito < 0 {
		return models.ModelClientRiskProfileResponse{}, errors.New("dias_credito no puede ser negativo")
	}

	if err := validateRisk(req.CapacidadPago); err != nil {
		return models.ModelClientRiskProfileResponse{}, errors.New("capacidad_pago invalida: " + err.Error())
	}
	if err := validateRisk(req.LavadoDinero); err != nil {
		return models.ModelClientRiskProfileResponse{}, errors.New("lavado_dinero invalido: " + err.Error())
	}
	if err := validateRisk(req.RiesgoAduanas); err != nil {
		return models.ModelClientRiskProfileResponse{}, errors.New("aduanas invalido: " + err.Error())
	}

	riesgoGlobal := calculateGlobalRisk(req.CapacidadPago, req.LavadoDinero, req.RiesgoAduanas)

	return s.repo.UpdateClientRiskProfile(clienteID, req, riesgoGlobal)
}

func (s *ClientProfileService) EvaluateCommercialFilter(clienteID int) (models.ModelCommercialFilterResponse, error) {
	if clienteID <= 0 {
		return models.ModelCommercialFilterResponse{}, errors.New("id de cliente invalido")
	}

	profile, err := s.repo.GetClientRiskProfileByID(clienteID)
	if err != nil {
		return models.ModelCommercialFilterResponse{}, err
	}

	contratoID, err := s.repo.GetActiveContractID(clienteID)
	if err != nil {
		return models.ModelCommercialFilterResponse{}, err
	}

	motivos := make([]string, 0)
	autorizado := true

	if contratoID == nil {
		autorizado = false
		motivos = append(motivos, "el cliente no tiene contrato vigente")
	}

	if profile.RiesgoGlobal == "ALTO" {
		autorizado = false
		motivos = append(motivos, "el cliente posee riesgo global ALTO")
	}

	if profile.LimiteCredito <= 0 {
		autorizado = false
		motivos = append(motivos, "el cliente no tiene limite de credito habilitado")
	}

	if autorizado {
		motivos = append(motivos, "cliente cumple filtro comercial")
	}

	return models.ModelCommercialFilterResponse{
		Cliente:                profile,
		TieneContratoVigente:   contratoID != nil,
		ContratoID:             contratoID,
		AutorizadoParaServicio: autorizado,
		Motivos:                motivos,
	}, nil
}

// GetClientDashboard obtiene el dashboard completo del cliente
func (s *ClientProfileService) GetClientDashboard(clienteID int) (models.ModelClientDashboardResponse, error) {
	if clienteID <= 0 {
		return models.ModelClientDashboardResponse{}, errors.New("id de cliente invalido")
	}

	resolvedClientID, err := s.repo.ResolveClientID(clienteID)
	if err != nil {
		return models.ModelClientDashboardResponse{}, err
	}

	dashboard := models.ModelClientDashboardResponse{}

	// Obtener resumen operativo
	operativo, err := s.repo.GetOperativeSummary(resolvedClientID)
	if err != nil {
		return models.ModelClientDashboardResponse{}, errors.New("error al obtener resumen operativo: " + err.Error())
	}
	dashboard.ResumenOperativo = operativo

	// Obtener resumen financiero
	financiero, err := s.repo.GetFinancialSummary(resolvedClientID)
	if err != nil {
		return models.ModelClientDashboardResponse{}, errors.New("error al obtener resumen financiero: " + err.Error())
	}
	dashboard.ResumenFinanciero = financiero

	// Obtener alertas
	alertas, err := s.repo.GetClientAlerts(resolvedClientID)
	if err != nil {
		// Las alertas no son críticas, continuamos sin ellas
		alertas = []models.Alerta{}
	}
	if alertas == nil {
		alertas = []models.Alerta{}
	}
	dashboard.Alertas = alertas

	ultimaEntrega, err := s.repo.GetLastDeliveredOrderAt(resolvedClientID)
	if err != nil {
		return models.ModelClientDashboardResponse{}, errors.New("error al obtener ultima entrega: " + err.Error())
	}

	facturasVencidas, err := s.repo.GetOverdueInvoicesCount(resolvedClientID)
	if err != nil {
		return models.ModelClientDashboardResponse{}, errors.New("error al obtener facturas vencidas: " + err.Error())
	}

	deudaActual := dashboard.ResumenFinanciero.FacturasPendientesMonto + dashboard.ResumenFinanciero.FacturasVencidasMonto
	bloqueoPorLimite := dashboard.ResumenFinanciero.LimiteCredito > 0 && deudaActual >= dashboard.ResumenFinanciero.LimiteCredito
	bloqueoCredito := facturasVencidas > 0 || bloqueoPorLimite

	dashboard.DashboardCliente = models.DashboardCliente{
		ResumenServicios: models.DashboardResumenServicios{
			ServiciosActivos:     dashboard.ResumenOperativo.OrdenesActivas,
			ServiciosCompletados: dashboard.ResumenOperativo.OrdenesCompletadas,
		},
		EstadoGeneral: models.DashboardEstadoGeneral{
			OrdenesEnTransito: dashboard.ResumenOperativo.OrdenesEnTransito,
			UltimaEntrega:     ultimaEntrega,
		},
		ResumenFinanciero: models.DashboardResumenFinanciero{
			DeudaActual:       deudaActual,
			CreditoDisponible: dashboard.ResumenFinanciero.CreditoDisponible,
		},
		Alertas: models.DashboardAlertas{
			FacturasVencidas: facturasVencidas,
			BloqueoCredito:   bloqueoCredito,
		},
	}

	return dashboard, nil
}

func (s *ClientProfileService) GetClientProfile(clienteID int) (models.ModelClientProfileViewResponse, error) {
	if clienteID <= 0 {
		return models.ModelClientProfileViewResponse{}, errors.New("id de cliente invalido")
	}

	return s.repo.GetClientProfile(clienteID)
}

func (s *ClientProfileService) GetClientProfileByReference(referenceID int) (models.ModelClientProfileViewResponse, error) {
	if referenceID <= 0 {
		return models.ModelClientProfileViewResponse{}, errors.New("id de cliente invalido")
	}

	resolvedClientID, err := s.repo.ResolveClientID(referenceID)
	if err != nil {
		return models.ModelClientProfileViewResponse{}, err
	}

	return s.repo.GetClientProfile(resolvedClientID)
}

func validateEmail(value string) bool {
	_, err := mail.ParseAddress(value)
	return err == nil
}

func validatePhoneFormat(phone string) bool {
	re := regexp.MustCompile(`^[+0-9\-\s]{8,20}$`)
	return re.MatchString(phone)
}

func validatePasswordPolicy(password string) bool {
	if len(password) < 8 {
		return false
	}
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSymbol := regexp.MustCompile(`[^A-Za-z0-9]`).MatchString(password)
	return hasUpper && hasNumber && hasSymbol
}

func (s *ClientProfileService) PatchClientProfile(clienteID int, req models.ModelPatchClientProfileRequest) error {
	if clienteID <= 0 {
		return errors.New("id de cliente invalido")
	}

	req.NombreEmpresa = strings.TrimSpace(req.NombreEmpresa)
	req.Nit = strings.TrimSpace(req.Nit)
	req.Direccion = strings.TrimSpace(req.Direccion)
	req.Telefono = strings.TrimSpace(req.Telefono)

	if req.NombreEmpresa == "" || req.Nit == "" || req.Direccion == "" || req.Telefono == "" {
		return errors.New("nombreEmpresa, nit, direccion y telefono son obligatorios")
	}
	if len(req.Nit) < 4 {
		return errors.New("nit invalido")
	}
	if !validatePhoneFormat(req.Telefono) {
		return errors.New("telefono invalido")
	}

	return s.repo.PatchClientProfile(clienteID, req)
}

func (s *ClientProfileService) PatchClientProfileByReference(referenceID int, req models.ModelPatchClientProfileRequest) error {
	if referenceID <= 0 {
		return errors.New("id de cliente invalido")
	}

	resolvedClientID, err := s.repo.ResolveClientID(referenceID)
	if err != nil {
		return err
	}

	return s.PatchClientProfile(resolvedClientID, req)
}

func (s *ClientProfileService) UpdateClientPassword(clienteID int, req models.ModelUpdateClientPasswordRequest) error {
	if clienteID <= 0 {
		return errors.New("id de cliente invalido")
	}

	req.PasswordActual = strings.TrimSpace(req.PasswordActual)
	req.PasswordNueva = strings.TrimSpace(req.PasswordNueva)
	req.PasswordConfirmacion = strings.TrimSpace(req.PasswordConfirmacion)

	if req.PasswordActual == "" {
		return errors.New("passwordActual obligatoria")
	}
	if req.PasswordNueva == "" || req.PasswordConfirmacion == "" {
		return errors.New("passwordNueva y passwordConfirmacion son obligatorias")
	}
	if req.PasswordNueva != req.PasswordConfirmacion {
		return errors.New("passwordNueva y passwordConfirmacion no coinciden")
	}
	if !validatePasswordPolicy(req.PasswordNueva) {
		return errors.New("passwordNueva no cumple la politica minima")
	}

	return s.repo.UpdateClientPassword(clienteID, req.PasswordActual, req.PasswordNueva)
}

func (s *ClientProfileService) UpdateClientPasswordByReference(referenceID int, req models.ModelUpdateClientPasswordRequest) error {
	if referenceID <= 0 {
		return errors.New("id de cliente invalido")
	}

	resolvedClientID, err := s.repo.ResolveClientID(referenceID)
	if err != nil {
		return err
	}

	return s.UpdateClientPassword(resolvedClientID, req)
}

func resolveDefaultWeight(tipoCarga string) (float64, error) {
	switch strings.TrimSpace(strings.ToLower(tipoCarga)) {
	case "unidad ligera":
		return 1200, nil
	case "unidad pesada":
		return 4500, nil
	case "cabezal":
		return 9000, nil
	default:
		return 0, errors.New("tipo_carga invalido")
	}
}

func mapOrderStateForClient(estado string) string {
	clean := strings.TrimSpace(strings.ToLower(estado))
	if clean == "registrada" {
		return "Registrada"
	}
	if clean == "listo para despacho" || clean == "en transito" || clean == "entregado" {
		return "Aceptada"
	}
	return "Registrada"
}

func (s *ClientProfileService) CreateClientRequestOrder(referenceID int, req models.ModelCreateClientRequestOrder) (models.ModelCreateClientRequestOrderResponse, error) {
	if referenceID <= 0 {
		return models.ModelCreateClientRequestOrderResponse{}, errors.New("id de cliente invalido")
	}

	req.Origen = strings.TrimSpace(req.Origen)
	req.Destino = strings.TrimSpace(req.Destino)
	req.TipoCarga = strings.TrimSpace(req.TipoCarga)

	if req.Origen == "" || req.Destino == "" {
		return models.ModelCreateClientRequestOrderResponse{}, errors.New("origen y destino son obligatorios")
	}

	if req.Peso <= 0 {
		defaultWeight, err := resolveDefaultWeight(req.TipoCarga)
		if err != nil {
			return models.ModelCreateClientRequestOrderResponse{}, err
		}
		req.Peso = defaultWeight
	}

	resolvedClientID, err := s.repo.ResolveClientID(referenceID)
	if err != nil {
		return models.ModelCreateClientRequestOrderResponse{}, err
	}

	resp, err := s.repo.CreateClientRequestOrder(resolvedClientID, req)
	if err != nil {
		return models.ModelCreateClientRequestOrderResponse{}, err
	}

	return resp, nil
}

func (s *ClientProfileService) GetClientRequestOrderHistory(referenceID int) ([]models.ModelClientRequestOrderHistoryItem, error) {
	if referenceID <= 0 {
		return nil, errors.New("id de cliente invalido")
	}

	resolvedClientID, err := s.repo.ResolveClientID(referenceID)
	if err != nil {
		return nil, err
	}

	history, err := s.repo.GetClientRequestOrderHistory(resolvedClientID)
	if err != nil {
		return nil, err
	}

	for index := range history {
		history[index].Estado = mapOrderStateForClient(history[index].Estado)
	}

	return history, nil
}

func (s *ClientProfileService) GetClientAuthorizedRoutes(referenceID int) ([]models.ModelClientAuthorizedRouteItem, error) {
	if referenceID <= 0 {
		return nil, errors.New("id de cliente invalido")
	}

	resolvedClientID, err := s.repo.ResolveClientID(referenceID)
	if err != nil {
		return nil, err
	}

	return s.repo.GetClientAuthorizedRoutes(resolvedClientID)
}

func mapTrackingStatusForClient(estado string) string {
	clean := strings.ToLower(strings.TrimSpace(estado))
	if clean == "entregado" {
		return "Entregado"
	}
	if clean == "en transito" {
		return "En transito"
	}
	return "Listo para despacho"
}

func buildTrackingEvents(estado string, recepcionConfirmada bool) []string {
	events := []string{"Solicitud registrada"}

	clean := strings.ToLower(strings.TrimSpace(estado))
	if clean == "listo para despacho" || clean == "en transito" || clean == "entregado" {
		events = append(events, "Orden lista para despacho")
	}
	if clean == "en transito" || clean == "entregado" {
		events = append(events, "Unidad en transito hacia destino")
	}
	if clean == "entregado" {
		events = append(events, "Entrega completada en destino")
	}
	if recepcionConfirmada {
		events = append(events, "Recepcion confirmada por cliente")
	}

	return events
}

func (s *ClientProfileService) GetClientTracking(referenceID int) ([]models.ModelClientTrackingItem, error) {
	if referenceID <= 0 {
		return nil, errors.New("id de cliente invalido")
	}

	resolvedClientID, err := s.repo.ResolveClientID(referenceID)
	if err != nil {
		return nil, err
	}

	rawItems, err := s.repo.GetClientTrackingRaw(resolvedClientID)
	if err != nil {
		return nil, err
	}

	items := make([]models.ModelClientTrackingItem, 0, len(rawItems))
	for _, row := range rawItems {
		year := "0000"
		if len(row.FechaCreacion) >= 4 {
			year = row.FechaCreacion[0:4]
		}

		puntosControl := make([]string, 0, 2)
		if strings.TrimSpace(row.Origen) != "" {
			puntosControl = append(puntosControl, row.Origen)
		}
		if strings.TrimSpace(row.Destino) != "" {
			puntosControl = append(puntosControl, row.Destino)
		}

		evidencia := ""
		if row.TieneEvidencia {
			evidencia = "Evidencia de entrega registrada en el sistema."
		}

		items = append(items, models.ModelClientTrackingItem{
			SolicitudID:         row.SolicitudID,
			Codigo:              "OS-" + year + "-" + strconv.Itoa(row.SolicitudID),
			Estado:              mapTrackingStatusForClient(row.Estado),
			PuntosControl:       puntosControl,
			EventosRuta:         buildTrackingEvents(row.Estado, row.RecepcionConfirmada),
			EvidenciaEntrega:    evidencia,
			RecepcionConfirmada: row.RecepcionConfirmada,
		})
	}

	return items, nil
}

func (s *ClientProfileService) ConfirmClientReception(referenceID int, solicitudID int) error {
	if referenceID <= 0 {
		return errors.New("id de cliente invalido")
	}
	if solicitudID <= 0 {
		return errors.New("solicitudId invalido")
	}

	resolvedClientID, err := s.repo.ResolveClientID(referenceID)
	if err != nil {
		return err
	}

	return s.repo.ConfirmClientReception(resolvedClientID, solicitudID)
}

func (s *ClientProfileService) GetClientPayments(referenceID int) (models.ModelClientPaymentsResponse, error) {
	if referenceID <= 0 {
		return models.ModelClientPaymentsResponse{}, errors.New("id de cliente invalido")
	}

	resolvedClientID, err := s.repo.ResolveClientID(referenceID)
	if err != nil {
		return models.ModelClientPaymentsResponse{}, err
	}

	return s.repo.GetClientPaymentsData(resolvedClientID)
}

func (s *ClientProfileService) RegisterClientPaymentIntent(referenceID int, req models.ModelRegisterClientPaymentIntentRequest) error {
	if referenceID <= 0 {
		return errors.New("id de cliente invalido")
	}
	if req.FacturaID <= 0 {
		return errors.New("factura_id invalido")
	}

	resolvedClientID, err := s.repo.ResolveClientID(referenceID)
	if err != nil {
		return err
	}

	return s.repo.RegisterClientPaymentIntent(resolvedClientID, req.FacturaID)
}
