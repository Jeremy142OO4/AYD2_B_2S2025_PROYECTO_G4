package main

import (
	"log"

	"backend/config"
	"backend/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	app := fiber.New()
	app.Use(logger.New())

	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		AllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	if err := config.ConnectDBWithRetry(); err != nil {
		log.Println("Advertencia: No se pudo conectar a la base de datos:", err)
		log.Println("El servidor continuará sin base de datos")
	}

	routes.SetupRoutes(app)

	host := config.GetEnv("API_HOST")
	port := config.GetEnv("API_PORT")

	log.Printf("API escuchando en http://%s:%s", host, port)

	log.Fatal(app.Listen(host + ":" + port))
}
