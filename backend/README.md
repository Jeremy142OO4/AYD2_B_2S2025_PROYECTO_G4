## api/

### api/main.go

Este es el punto de inicio del sistema.

En **main.go** arranca el servidor, inicia Fiber, hace la conexión a la base de datos y carga las rutas.

---

## config/

Esta carpeta tiene toda la configuración general del backend.
Aquí va todo lo necesario para que el sistema funcione correctamente, como la conexión a la base de datos y las variables de entorno.

---

### config/config.go

Este archivo se encarga de cargar y manejar la configuración general del sistema.

Aquí se definen y leen variables como el puerto del servidor, modo de ejecución (desarrollo o producción), Clave para firmar JWT y variables de entorno necesarias. La idea es evitar quemar estos valores en el código.

---

### config/database.go

Este archivo se encarga de la conexión a la base de datos.

Aquí se configura la conexión a SQL Server, el pool de conexiones, la verificación de que la base de datos esté disponible, este archivo es utilizado por los repositorios para acceder a la base de datos, pero no tiene consultas SQL directamente, solo se encarga de establecer y mantener la conexión con la base de datos.

---

## internal/

Esta carpeta contiene toda la lógica. Aquí se implementa el patrón MVC.

---

## internal/models/ (MODELO)

Define cómo son los datos del sistema. Aqui van las estructuras (**struct**).

**IMPORTANTE:**
Aqui no deben haber consultas SQL, no se maneja lógica de negocio y tampoco se reciben peticiones HTTP.

En el **MVC** esta parte representa el **Modelo**, solo "describe" los datos.

---

## internal/repositories/

Se encarga de **comunicarse con la base de datos**.

Aqui van las consultas SQL y funciones que devuelven modelos.

Solo sirve para acceso a la base de datos, no maneja lógica de negocio y no responde peticiones HTTP.

Trabaja directamente con los **Modelos**.

---

## internal/services/

Contiene la **lógica del negocio**, aqui van las validaciones, reglas del sistema, autenticación, generación de tokens (JWT).
Verificar si una contraseña es correcta, decidir si un usuario tiene permiso, etc.
No recibe peticiones HTTP y no hace consultas SQL directamente.
**En MVC Conecta Controllers con Repositories.**

---

## internal/controllers/ (CONTROLADOR)

Maneja las **peticiones HTTP**.

Aqui van todos los endpoints, hace la lectura del body de la petición, llama a los servicios y da respuestas en formato JSON.
No hace consultas a la base de datos y no contiene lógica compleja.

Representa el **Controlador** del MVC y controla el flujo de la petición.

---

## internal/routes/

Define las **rutas del sistema**.

Aqui van las URLs, los métodos HTTP (GET, POST, PUT, DELETE)y la asociación entre rutas y controladores.
En MVC conecta el mundo HTTP con los Controladores.

---

## internal/middlewares/

Ejecuta código **antes de llegar al controlador**.

Hace validación de JWT, verificación de roles y seguridad.

### Flujo básico de JWT

1. El usuario hace login con correo y contraseña
2. El controlador recibe la petición
3. El servicio valida los datos
4. Si son correctos, se genera un JWT
5. El token se devuelve al frontend
6. El frontend envía el token en cada petición protegida
7. El middleware valida el token antes de permitir el acceso

La **Generación del JWT** se hace en `services`, la **Validación del JWT** se hace en `middlewares` y el **Uso del JWT** se hace en `routes` y `controllers`.

---

## Flujo completo de una petición (MVC)

1. El cliente envía una petición HTTP
2. La ruta recibe la petición
3. El middleware valida el JWT (si aplica)
4. El controlador procesa la petición
5. El servicio aplica la lógica de negocio
6. El repositorio accede a la base de datos
7. El modelo representa los datos
8. Se devuelve una respuesta al cliente

---

## Resumen

- **Model** → estructura de datos
- **Repository** → base de datos
- **Service** → reglas del sistema
- **Controller** → peticiones HTTP
- **Routes** → URLs
- **Middlewares** → seguridad
- **cmd** → inicio del sistema
- **config** → configuración
