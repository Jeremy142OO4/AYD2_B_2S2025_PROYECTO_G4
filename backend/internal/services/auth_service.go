package services

import (
	"backend/internal/models"
	"backend/internal/repositories"
	"errors"
	"strings"
)

type AuthService struct {
	repo *repositories.AuthRepository
}

func NewAuthService() *AuthService {
	return &AuthService{repo: repositories.NewAuthRepository()}
}

func (s *AuthService) LoginClient(req models.ModelLoginRequest) (models.ModelLoginResponse, error) {
	email := strings.TrimSpace(req.Correo)
	password := strings.TrimSpace(req.Password)

	if email == "" || password == "" {
		return models.ModelLoginResponse{}, errors.New("correo y password son obligatorios")
	}

	authUser, err := s.repo.AuthenticateClient(email, password)
	if err != nil {
		return models.ModelLoginResponse{}, err
	}

	return models.ModelLoginResponse{
		User: models.ModelLoginUser{
			UserID:   authUser.UserID,
			ClientID: authUser.ClientID,
			PilotID:  authUser.PilotID,
			Nombre:   authUser.Nombre,
			Correo:   authUser.Correo,
			Role:     authUser.Role,
		},
	}, nil
}
