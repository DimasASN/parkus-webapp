# 🚗 ParkUS Backend API

Backend profesional para el sistema de gestión de parqueaderos ParkUS, construido con Node.js, Express, Prisma y MySQL en Railway.

## 📋 Requisitos Previos

- Node.js 16+ instalado
- Base de datos MySQL en Railway configurada
- npm o yarn

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="mysql://usuario:password@host:puerto/database"

JWT_SECRET=tu_clave_secreta_super_segura_cambiala
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5500,http://127.0.0.1:5500
```

**⚠️ IMPORTANTE:** Reemplaza la `DATABASE_URL` con tu conexión de Railway MySQL.

### 3. Generar Prisma Client

```bash
npm run prisma:generate
```

### 4. Sincronizar schema con la base de datos

Si tu base de datos ya tiene las tablas creadas:

```bash
npm run prisma:push
```

Si necesitas crear las tablas desde cero:

```bash
npm run prisma:migrate
```

### 5. Iniciar el servidor

**Modo desarrollo (con auto-reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

El servidor estará corriendo en: `http://localhost:3000`

## 📚 Endpoints de la API

### 🔐 Autenticación

#### Registrar usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "juan123",
  "nombre": "Juan Pérez",
  "password": "contraseña123",
  "correo": "juan@example.com",
  "telefono": "3001234567",
  "id_tipo_usuario": 2,
  "id_empresa": 1
}
```

#### Iniciar sesión
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "juan123",
  "password": "contraseña123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "username": "juan123",
      "nombre": "Juan Pérez",
      "correo": "juan@example.com",
      "tipo_usuario": "Operador",
      "empresa": "ParkUS Centro"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Obtener perfil
```http
GET /api/auth/profile
Authorization: Bearer {token}
```

### 🅿️ Parqueaderos

#### Listar todos los parqueaderos
```http
GET /api/parqueaderos
```

#### Obtener detalles de un parqueadero
```http
GET /api/parqueaderos/1
```

#### Obtener lugares disponibles
```http
GET /api/parqueaderos/1/disponibles
```

### 🎫 Reservas

#### Crear reserva
```http
POST /api/reservas
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_empresa": 1,
  "numero_lugar": 5,
  "placa_vehiculo": "ABC123",
  "doc_conductor": "1234567890",
  "nombre_conductor": "María López",
  "telefono_conductor": "3009876543",
  "correo_conductor": "maria@example.com",
  "modelo_vehiculo": "Corolla",
  "marca_vehiculo": "Toyota"
}
```

#### Liberar lugar
```http
POST /api/reservas/liberar
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_empresa": 1,
  "numero_lugar": 5
}
```

#### Consultar reserva por placa
```http
GET /api/reservas/placa/ABC123
```

## 🔧 Scripts Útiles

```bash
# Ver base de datos en interfaz visual
npm run prisma:studio

# Regenerar cliente de Prisma después de cambios en schema
npm run prisma:generate

# Sincronizar schema sin migraciones
npm run prisma:push

# Crear migración
npm run prisma:migrate
```

## 🏗️ Estructura del Proyecto

```
parkus-backend/
├── prisma/
│   └── schema.prisma          # Schema de Prisma
├── src/
│   ├── config/
│   │   └── database.js        # Configuración de Prisma
│   ├── controllers/           # Lógica de negocio
│   │   ├── authController.js
│   │   ├── parqueaderoController.js
│   │   └── reservaController.js
│   ├── middlewares/           # Middlewares
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/                # Definición de rutas
│   │   ├── authRoutes.js
│   │   ├── parqueaderoRoutes.js
│   │   ├── reservaRoutes.js
│   │   └── index.js
│   ├── utils/                 # Utilidades
│   │   ├── bcrypt.js
│   │   └── jwt.js
│   ├── app.js                 # Configuración de Express
│   └── server.js              # Punto de entrada
├── .env                       # Variables de entorno
└── package.json
```

## 🔑 Autenticación JWT

El sistema usa JWT (JSON Web Tokens) para autenticación. Para endpoints protegidos:

1. Inicia sesión en `/api/auth/login`
2. Copia el `token` de la respuesta
3. Incluye el header en tus requests:
   ```
   Authorization: Bearer {tu_token}
   ```

## 🛡️ Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Tokens JWT con expiración
- ✅ Helmet para headers de seguridad HTTP
- ✅ CORS configurado
- ✅ Validación de entrada
- ✅ Manejo de errores centralizado

## 📝 Datos de Prueba

Antes de probar, asegúrate de tener datos de referencia en estas tablas:

```sql
-- Estados de lugares
INSERT INTO estado_lugar (id, descripcion) VALUES
(1, 'Disponible'),
(2, 'Ocupado'),
(3, 'Reservado');

-- Tipos de usuario
INSERT INTO tipo_usuario (id, nombre) VALUES
(1, 'Administrador'),
(2, 'Operador'),
(3, 'Cliente');
```

## 🐛 Troubleshooting

### Error: "Can't reach database server"
- Verifica que `DATABASE_URL` en `.env` sea correcta
- Comprueba que Railway MySQL esté activo

### Error: "Prisma Client not generated"
```bash
npm run prisma:generate
```

### Error: "Module not found"
```bash
rm -rf node_modules
npm install
```

### Error con BigInt en JSON
Ya está solucionado con el prototipo en `app.js`:
```javascript
BigInt.prototype.toJSON = function () {
  return this.toString();
};
```

## 🌐 Conectar con Frontend

En tu frontend HTML/JavaScript:

```javascript
// Ejemplo de login
async function login(username, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Guardar token
    localStorage.setItem('token', data.data.token);
    return data.data.user;
  }
  
  throw new Error(data.message);
}

// Ejemplo de request autenticado
async function getProfile() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
}
```

## 📞 Soporte

Si encuentras algún problema, verifica:

1. ✅ Conexión a Railway MySQL
2. ✅ Variables de entorno configuradas
3. ✅ Prisma Client generado
4. ✅ Dependencias instaladas
5. ✅ Puerto 3000 disponible

---

**Desarrollado con ❤️ para ParkUS**