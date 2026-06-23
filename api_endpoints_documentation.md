# Documentación de Endpoints y Métodos API Consumidos

Este documento detalla todos los endpoints consumidos por el frontend de AgroVision, mapeados desde el archivo `swagger.json` proporcionado, y sus correspondientes métodos implementados en `frontend/src/services/apiService.js`.

**Base URL actual (Desarrollo / Producción):** 
`https://5ca8-181-236-151-68.ngrok-free.app/api`

---

## Auth (Autenticación)

### 1. Iniciar Sesión
- **Endpoint:** `POST /Auth/login`
- **Método Frontend:** `login(data)`
- **Descripción:** Autentica a un usuario utilizando email y contraseña.
- **Body de ejemplo:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### 2. Registro
- **Endpoint:** `POST /Auth/register`
- **Método Frontend:** `register(data)`
- **Descripción:** Registra un nuevo usuario en el sistema.
- **Body de ejemplo:**
  ```json
  {
    "fullName": "Juan Perez",
    "email": "juan@example.com",
    "password": "password123",
    "role": "Inspector",
    "organizationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
  ```

### 3. Obtener Usuario Actual
- **Endpoint:** `GET /Auth/me`
- **Método Frontend:** `getMe()`
- **Descripción:** Obtiene los datos del usuario autenticado actual.

---

## Inspections (Inspecciones)

### 4. Crear Inspección
- **Endpoint:** `POST /inspections`
- **Método Frontend:** `createInspection(data)`
- **Descripción:** Crea un nuevo registro de inspección de cultivo.
- **Body de ejemplo:**
  ```json
  {
    "inspectionDate": "2026-06-20T10:00:00Z"
  }
  ```

### 5. Obtener Inspección por ID
- **Endpoint:** `GET /inspections/{id}`
- **Método Frontend:** `getInspectionById(id)`
- **Descripción:** Obtiene los detalles de una inspección específica dado su ID (UUID).

### 6. Asignar Lote (Plot) a Inspección
- **Endpoint:** `PUT /inspections/{id}/plot`
- **Método Frontend:** `assignPlotToInspection(id, data)`
- **Descripción:** Asigna una inspección previamente creada a un lote de cultivo específico.
- **Body de ejemplo:**
  ```json
  {
    "plotId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
  ```

### 7. Subir Imagen a Inspección
- **Endpoint:** `POST /inspections/{inspectionId}/images`
- **Método Frontend:** `createInspectionImage(inspectionId, data)`
- **Descripción:** Asocia el registro de una imagen tomada a una inspección específica.
- **Body de ejemplo:**
  ```json
  {
    "inspectionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fileUri": "http://example.com/image.jpg",
    "mimeType": "image/jpeg",
    "width": 1920,
    "height": 1080,
    "deviceId": "device-123"
  }
  ```

### 8. Obtener Imágenes de Inspección
- **Endpoint:** `GET /inspections/{inspectionId}/images`
- **Método Frontend:** `getInspectionImages(inspectionId)`
- **Descripción:** Lista todas las imágenes asociadas a una inspección específica.

---

## Organizations (Organizaciones)

### 9. Obtener Organizaciones
- **Endpoint:** `GET /organizations`
- **Método Frontend:** `getOrganizations()`
- **Descripción:** Lista todas las organizaciones registradas en el sistema.

---

## Plots (Lotes/Parcelas)

### 10. Obtener Lotes
- **Endpoint:** `GET /Plots`
- **Método Frontend:** `getPlots()`
- **Descripción:** Lista todos los lotes o parcelas de cultivo disponibles.

---

## Role (Roles)

### 11. Crear/Inicializar Roles
- **Endpoint:** `POST /Role/roles`
- **Método Frontend:** `createRoles()`
- **Descripción:** Endpoint administrativo para la creación o sincronización de roles en el sistema.

### 12. Validar o Asignar Rol
- **Endpoint:** `POST /Role/validate-role`
- **Método Frontend:** `validateRole(data)`
- **Descripción:** Asigna o valida un rol específico a un usuario.
- **Body de ejemplo:**
  ```json
  {
    "usuarioId": "user-uuid",
    "rolSolicitado": "Admin"
  }
  ```

---

## Notas de Implementación

- Todas las peticiones están encapsuladas en `frontend/src/services/apiService.js` mediante la función genérica `fetchApi`.
- Las cabeceras incluyen automáticamente `Authorization: Bearer <token>` cuando el usuario ha iniciado sesión (extrayendo el token almacenado localmente).
- Dado el uso de ngrok, se añade la cabecera `ngrok-skip-browser-warning: true` a todas las peticiones para evitar respuestas HTML que interrumpan el flujo normal de datos JSON.
- La variable de entorno principal usada es `VITE_API_URL` que puede configurarse en `.env` o `.env.production`.
