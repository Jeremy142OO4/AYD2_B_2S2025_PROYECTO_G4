package services

import (
	"backend/internal/models"
	"backend/internal/repositories"
	"errors"
	"strings"
	"time"
)

type ContractDigitalService struct {
	repo *repositories.ContractDigitalRepository
}

const negotiatedDiscountPercent = 10.0

func NewContractDigitalService() *ContractDigitalService {
	return &ContractDigitalService{repo: repositories.NewContractDigitalRepository()}
}

func defaultRateByUnit(tipoUnidad string) (float64, error) {
	switch strings.ToUpper(strings.TrimSpace(tipoUnidad)) {
	case "LIGERA":
		return 8.00, nil
	case "PESADA":
		return 12.50, nil
	case "CABEZAL":
		return 18.00, nil
	default:
		return 0, errors.New("tipo_unidad invalido, use LIGERA, PESADA o CABEZAL")
	}
}

func applyNegotiatedDiscount(baseRate float64) float64 {
	return baseRate * (1 - negotiatedDiscountPercent/100)
}

func isValidPaymentTerm(dias int) bool {
	return dias == 15 || dias == 30 || dias == 45
}

func (s *ContractDigitalService) CreateDigitalContract(req models.ModelCreateDigitalContractRequest) (models.ModelDigitalContractResponse, error) {
	if req.ClienteID <= 0 {
		return models.ModelDigitalContractResponse{}, errors.New("cliente_id es obligatorio")
	}
	if req.FechaInicio == "" || req.FechaFin == "" {
		return models.ModelDigitalContractResponse{}, errors.New("fecha_inicio y fecha_fin son obligatorias")
	}
	if req.LimiteCredito < 0 {
		return models.ModelDigitalContractResponse{}, errors.New("limite_credito no puede ser negativo")
	}
	if !isValidPaymentTerm(req.DiasCredito) {
		return models.ModelDigitalContractResponse{}, errors.New("dias_credito debe ser 15, 30 o 45")
	}
	req.Descuento = negotiatedDiscountPercent
	if len(req.RutasAutorizadas) == 0 {
		return models.ModelDigitalContractResponse{}, errors.New("debe incluir al menos una ruta autorizada")
	}

	fechaInicio, err := time.Parse("2006-01-02", req.FechaInicio)
	if err != nil {
		return models.ModelDigitalContractResponse{}, errors.New("fecha_inicio invalida, use formato YYYY-MM-DD")
	}
	fechaFin, err := time.Parse("2006-01-02", req.FechaFin)
	if err != nil {
		return models.ModelDigitalContractResponse{}, errors.New("fecha_fin invalida, use formato YYYY-MM-DD")
	}
	if fechaFin.Before(fechaInicio) {
		return models.ModelDigitalContractResponse{}, errors.New("fecha_fin no puede ser menor a fecha_inicio")
	}

	for i := range req.RutasAutorizadas {
		item := &req.RutasAutorizadas[i]
		item.Origen = strings.TrimSpace(item.Origen)
		item.Destino = strings.TrimSpace(item.Destino)
		item.TipoUnidad = strings.ToUpper(strings.TrimSpace(item.TipoUnidad))

		if item.Origen == "" || item.Destino == "" {
			return models.ModelDigitalContractResponse{}, errors.New("origen y destino son obligatorios en cada ruta autorizada")
		}

		if item.TipoUnidad == "" {
			item.TipoUnidad = "LIGERA"
		}

		if item.PesoMin < 0 || item.PesoMax <= 0 || item.PesoMax < item.PesoMin {
			return models.ModelDigitalContractResponse{}, errors.New("rangos de peso invalidos en rutas autorizadas")
		}

		baseRate, errRate := defaultRateByUnit(item.TipoUnidad)
		if errRate != nil {
			return models.ModelDigitalContractResponse{}, errRate
		}

		discountedRate := applyNegotiatedDiscount(baseRate)
		item.PrecioKm = &discountedRate
	}

	resp, err := s.repo.CreateDigitalContract(req)
	if err != nil {
		return models.ModelDigitalContractResponse{}, err
	}

	resp.TarifasBase = map[string]float64{
		"LIGERA":  8.00,
		"PESADA":  12.50,
		"CABEZAL": 18.00,
	}

	return resp, nil
}
