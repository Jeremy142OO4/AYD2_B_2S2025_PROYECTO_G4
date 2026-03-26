
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'AYD_DATABASE')
BEGIN
    ALTER DATABASE AYD_DATABASE SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE AYD_DATABASE;
END
GO

CREATE DATABASE AYD_DATABASE;
GO
USE AYD_DATABASE;
GO


CREATE TABLE roles (
    id INT IDENTITY PRIMARY KEY,
    nombre VARCHAR(50),
    es_eliminado BIT DEFAULT 0
);

INSERT INTO roles (nombre) VALUES 
('Gerencia'),
('Agente Operativo'),
('Agente Logistico'),
('Agente Financiero'),
('Cliente'),
('Encargado de Patio'),
('Piloto');


CREATE TABLE usuarios (
    id INT IDENTITY PRIMARY KEY,
    nombre VARCHAR(100),
    correo VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    foto_perfil VARCHAR(MAX),
    es_eliminado BIT DEFAULT 0
);

CREATE TABLE usuario_rol (
    id INT IDENTITY PRIMARY KEY,
    usuario_id INT,
    rol_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);


CREATE TABLE clientes (
    id INT IDENTITY PRIMARY KEY,
    usuario_id INT UNIQUE,
    nit VARCHAR(13),
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    riesgo VARCHAR(50),
    limite_credito DECIMAL(10,2),
    dias_credito INT,
    es_eliminado BIT DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);


CREATE TABLE pilotos (
    id INT IDENTITY PRIMARY KEY,
    usuario_id INT UNIQUE,
    licencia VARCHAR(50),
    es_eliminado BIT DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);


CREATE TABLE vehiculos (
    id INT IDENTITY PRIMARY KEY,
    placa VARCHAR(20),
    tipo VARCHAR(50),
    capacidad DECIMAL(10,2),
    es_eliminado BIT DEFAULT 0
);


CREATE TABLE tarifarios (
    id INT IDENTITY PRIMARY KEY,
    tipo_unidad VARCHAR(50),
    peso_min DECIMAL(10,2),
    peso_max DECIMAL(10,2),
    precio_km DECIMAL(10,2),
    es_eliminado BIT DEFAULT 0
);


CREATE TABLE rutas (
    id INT IDENTITY PRIMARY KEY,
    origen VARCHAR(100),
    destino VARCHAR(100),
    distancia_km DECIMAL(10,2),
    es_eliminado BIT DEFAULT 0
);


CREATE TABLE contratos (
    id INT IDENTITY PRIMARY KEY,
    cliente_id INT,
    fecha_inicio DATE,
    fecha_fin DATE,
    descuento DECIMAL(5,2),
    activo BIT,
    es_eliminado BIT DEFAULT 0,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE contrato_ruta (
    id INT IDENTITY PRIMARY KEY,
    contrato_id INT,
    ruta_id INT,
    tarifario_id INT,
    FOREIGN KEY (contrato_id) REFERENCES contratos(id),
    FOREIGN KEY (ruta_id) REFERENCES rutas(id),
    FOREIGN KEY (tarifario_id) REFERENCES tarifarios(id)
);

CREATE TABLE estados_orden (
    id INT IDENTITY PRIMARY KEY,
    nombre VARCHAR(50)
);

INSERT INTO estados_orden (nombre) VALUES
('Registrada'),
('Listo para Despacho'),
('En Transito'),
('Entregado'),
('Cancelado');


CREATE TABLE ordenes_servicio (
    id INT IDENTITY PRIMARY KEY,
    cliente_id INT,
    contrato_id INT,
    ruta_id INT,
    estado_id INT,
    peso DECIMAL(10,2),
    fecha_creacion DATETIME DEFAULT GETDATE(),
    es_eliminado BIT DEFAULT 0,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (contrato_id) REFERENCES contratos(id),
    FOREIGN KEY (ruta_id) REFERENCES rutas(id),
    FOREIGN KEY (estado_id) REFERENCES estados_orden(id)
);


CREATE TABLE asignaciones (
    id INT IDENTITY PRIMARY KEY,
    orden_id INT,
    vehiculo_id INT,
    piloto_id INT,
    FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id),
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
    FOREIGN KEY (piloto_id) REFERENCES pilotos(id)
);


CREATE TABLE bitacora_orden (
    id INT IDENTITY PRIMARY KEY,
    orden_id INT,
    descripcion VARCHAR(255),
    fecha DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id)
);


CREATE TABLE carga (
    id INT IDENTITY PRIMARY KEY,
    orden_id INT,
    peso_real DECIMAL(10,2),
    estiba_confirmada BIT,
    es_eliminado BIT DEFAULT 0,
    FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id)
);


CREATE TABLE checklist_salida (
    id INT IDENTITY PRIMARY KEY,
    orden_id INT,
    sellado BIT,
    listo BIT,
    es_eliminado BIT DEFAULT 0,
    FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id)
);


CREATE TABLE evidencia_entrega (
    id INT IDENTITY PRIMARY KEY,
    orden_id INT,
    tipo VARCHAR(50), -- 'firma' o 'foto'
    archivo VARCHAR(MAX),
    fecha DATETIME DEFAULT GETDATE(),
    es_eliminado BIT DEFAULT 0,
    FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id)
);


CREATE TABLE facturas (
    id INT IDENTITY PRIMARY KEY,
    orden_id INT,
    cliente_id INT,
    total DECIMAL(10,2),
    iva DECIMAL(10,2),
    uuid VARCHAR(100),
    fecha DATETIME DEFAULT GETDATE(),
    es_eliminado BIT DEFAULT 0,
    FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE detalle_factura (
    id INT IDENTITY PRIMARY KEY,
    factura_id INT,
    descripcion VARCHAR(255),
    monto DECIMAL(10,2),
    FOREIGN KEY (factura_id) REFERENCES facturas(id)
);


CREATE TABLE pagos (
    id INT IDENTITY PRIMARY KEY,
    factura_id INT,
    monto DECIMAL(10,2),
    metodo VARCHAR(50),
    banco VARCHAR(100),
    numero_autorizacion VARCHAR(100),
    fecha DATETIME DEFAULT GETDATE(),
    es_eliminado BIT DEFAULT 0,
    FOREIGN KEY (factura_id) REFERENCES facturas(id)
);


CREATE TABLE notificaciones (
    id INT IDENTITY PRIMARY KEY,
    usuario_id INT,
    mensaje VARCHAR(255),
    tipo VARCHAR(50),
    leido BIT DEFAULT 0,
    fecha DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);


CREATE TABLE corte_operaciones (
    id INT IDENTITY PRIMARY KEY,
    fecha DATE,
    total_ordenes INT,
    total_facturado DECIMAL(10,2),
    observaciones VARCHAR(255),
    es_eliminado BIT DEFAULT 0
);




/*
PARA LA DOCU JEJEJE
Aqui se divide las tablas que usa cada "ACTOR"

Cliente	usuarios, clientes, ordenes, facturas, pagos
Gerencia	corte_operaciones, facturas, ordenes
Operativo	ordenes, contratos, rutas
Logístico	asignaciones, vehiculos, pilotos
Patio	carga, checklist
Piloto	bitacora, evidencia
Financiero	facturas, pagos, notificaciones
*/