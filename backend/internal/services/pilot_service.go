package services

import (
	"backend/internal/models"
	"backend/internal/repositories"
	"errors"
	"strings"
)

type PilotService struct {
	repo *repositories.PilotRepository
}

func NewPilotService() *PilotService {
	return &PilotService{repo: repositories.NewPilotRepository()}
}

// CreatePilot validates input and creates a new pilot
func (s *PilotService) CreatePilot(req models.ModelCreatePilotRequest) (models.ModelPilotResponse, error) {
	// Trim spaces
	req.Nombre = strings.TrimSpace(req.Nombre)
	req.Correo = strings.TrimSpace(req.Correo)
	req.Password = strings.TrimSpace(req.Password)
	req.Licencia = strings.TrimSpace(req.Licencia)

	// Validate required fields
	if req.Nombre == "" {
		return models.ModelPilotResponse{}, errors.New("nombre es obligatorio")
	}
	if req.Correo == "" {
		return models.ModelPilotResponse{}, errors.New("correo es obligatorio")
	}
	if req.Password == "" {
		return models.ModelPilotResponse{}, errors.New("password es obligatorio")
	}
	if req.Licencia == "" {
		return models.ModelPilotResponse{}, errors.New("licencia es obligatoria")
	}

	// Validate email format (basic check)
	if !strings.Contains(req.Correo, "@") || !strings.Contains(req.Correo, ".") {
		return models.ModelPilotResponse{}, errors.New("correo invalido")
	}

	// Validate password length
	if len(req.Password) < 6 {
		return models.ModelPilotResponse{}, errors.New("password debe tener al menos 6 caracteres")
	}

	// Validate license length
	if len(req.Licencia) < 3 || len(req.Licencia) > 50 {
		return models.ModelPilotResponse{}, errors.New("licencia debe tener entre 3 y 50 caracteres")
	}

	return s.repo.CreatePilot(req)
}

// GetPilotByID retrieves a pilot by ID
func (s *PilotService) GetPilotByID(pilotID int) (models.ModelPilotResponse, error) {
	if pilotID <= 0 {
		return models.ModelPilotResponse{}, errors.New("id de piloto invalido")
	}
	return s.repo.GetPilotByID(pilotID)
}

// GetAllPilots retrieves all active pilots
func (s *PilotService) GetAllPilots() ([]models.ModelListPilotResponse, error) {
	return s.repo.GetAllPilots()
}

// UpdatePilot validates input and updates a pilot
func (s *PilotService) UpdatePilot(pilotID int, req models.ModelUpdatePilotRequest) (models.ModelPilotResponse, error) {
	if pilotID <= 0 {
		return models.ModelPilotResponse{}, errors.New("id de piloto invalido")
	}

	// Trim spaces
	req.Nombre = strings.TrimSpace(req.Nombre)
	req.Correo = strings.TrimSpace(req.Correo)
	req.Licencia = strings.TrimSpace(req.Licencia)

	// Validate required fields
	if req.Nombre == "" {
		return models.ModelPilotResponse{}, errors.New("nombre es obligatorio")
	}
	if req.Correo == "" {
		return models.ModelPilotResponse{}, errors.New("correo es obligatorio")
	}
	if req.Licencia == "" {
		return models.ModelPilotResponse{}, errors.New("licencia es obligatoria")
	}

	// Validate email format
	if !strings.Contains(req.Correo, "@") || !strings.Contains(req.Correo, ".") {
		return models.ModelPilotResponse{}, errors.New("correo invalido")
	}

	// Validate license length
	if len(req.Licencia) < 3 || len(req.Licencia) > 50 {
		return models.ModelPilotResponse{}, errors.New("licencia debe tener entre 3 y 50 caracteres")
	}

	return s.repo.UpdatePilot(pilotID, req)
}

// DeletePilot soft-deletes a pilot
func (s *PilotService) DeletePilot(pilotID int) error {
	if pilotID <= 0 {
		return errors.New("id de piloto invalido")
	}
	return s.repo.DeletePilot(pilotID)
}

// GetPilotByUserID retrieves a pilot by user ID
func (s *PilotService) GetPilotByUserID(userID int) (models.ModelPilotResponse, error) {
	if userID <= 0 {
		return models.ModelPilotResponse{}, errors.New("id de usuario invalido")
	}
	return s.repo.GetPilotByUserID(userID)
}
