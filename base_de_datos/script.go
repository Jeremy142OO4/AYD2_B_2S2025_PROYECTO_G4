package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"time"

	_ "github.com/denisenkom/go-mssqldb"
	"github.com/joho/godotenv"
)

var db *sql.DB

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Advertencia: No se encontró archivo .env, usando variables del sistema")
	}

	log.Println("Iniciando contenedor de base de datos...")
	borrarContenedorSiExiste("sqlserver_ayd")
	limpiarDockerCompose()
	if err := startDockerCompose(); err != nil {
		log.Fatal("Error al iniciar Docker:", err)
	}

	log.Println("Esperando a que SQL Server inicie...")
	time.Sleep(45 * time.Second)

	if err := connectDB(); err != nil {
		log.Fatal("Error al conectar con la base de datos:", err)
	}
	defer db.Close()

	setupRoutes()

	port := getEnv("API_PORT", "8083")
	host := getEnv("API_HOST", "0.0.0.0")

	log.Printf("API escuchando en http://%s:%s", host, port)

	if err := http.ListenAndServe(fmt.Sprintf("%s:%s", host, port), nil); err != nil {
		log.Fatal(" Error al iniciar servidor:", err)
	}
}

func limpiarDockerCompose() {
	cmd := exec.Command("docker", "compose", "down")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Println("Error al limpiar Docker:", err)
	}
}

func borrarContenedorSiExiste(nombre string) {
	cmd := exec.Command("docker", "rm", "-f", nombre)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	_ = cmd.Run()
}

func startDockerCompose() error {
	cmd := exec.Command("docker", "compose", "up", "-d")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func connectDB() error {
	server := os.Getenv("DB_SERVER")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("SA_PASSWORD")
	database := os.Getenv("DB_NAME")

	if server == "" || port == "" || user == "" || password == "" || database == "" {
		return fmt.Errorf("faltan variables en el .env (DB_SERVER, DB_PORT, DB_USER, SA_PASSWORD, DB_NAME)")
	}

	connString := fmt.Sprintf(
		"server=%s,%s;user id=%s;password=%s;database=%s;encrypt=disable",
		server, port, user, password, database,
	)

	var err error
	db, err = sql.Open("sqlserver", connString)
	if err != nil {
		return err
	}

	for i := 1; i <= 10; i++ {
		if err = db.Ping(); err == nil {
			log.Println("Conectado a SQL Server")
			return nil
		}
		log.Printf("Reintento %d/10...", i)
		time.Sleep(5 * time.Second)
	}

	return fmt.Errorf("no se pudo conectar a SQL Server")
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func setupRoutes() {
	http.HandleFunc("/health", healthCheck)
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "OK",
		"message": "Base de datos funcionando correctamente en puerto barrios (8083)",
	})
}