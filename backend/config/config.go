package config

import (
	"log"
	"os"
)

func GetEnv(key string) string {
	value, exists := os.LookupEnv(key)
	if !exists || value == "" {
		log.Fatalf("La variable de entorno %s es obligatoria y no está definida", key)
	}
	return value
}
