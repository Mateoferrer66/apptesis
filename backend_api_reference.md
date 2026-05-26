# 📡 AgroVision PWA — Referencia de API Backend

> Documentación de todos los endpoints POST del backend .NET 9 (`PlagasCafe.Api`).

## Tabla de Métodos POST

| # | Endpoint | Nombre | Descripción | Payload (Request Body) | Response (200/201) |
|---|----------|--------|-------------|----------------------|-------------------|
| 1 | `POST /api/auth/login` | Login | Autentica un usuario con email y contraseña | `{ "email": "string", "password": "string" }` | `{ "id": "string", "fullName": "string", "email": "string", "role": "string", "organizationId": "string", "token": "string" }` |
| 2 | `POST /api/auth/register` | Register | Registra un nuevo usuario en el sistema | `{ "fullName": "string", "email": "string", "password": "string", "role?": "string", "organizationId?": "string" }` | `{ "id": "string", "fullName": "string", "email": "string", "role": "string" }` |
| 3 | `POST /api/telemetry` | SyncTelemetry | Sincroniza inferencias de la PWA al backend | `{ "inferences": [{ "timestamp": "string", "pestType": "string", "confidence": number }] }` | `{ "message": "string", "totalRecords": number }` |
| 4 | `POST /api/inspections` | CreateInspection | Crea una nueva inspección de campo | `{ "plotId": "string", "inspectorId": "string", "inspectionDate?": "datetime" }` | `{ "id": "string", "plotId": "string", "inspectorId": "string", "inspectionDate": "datetime", "syncStatus": "string" }` |
| 5 | `POST /api/images` | UploadImage | Registra metadatos de una imagen capturada | `{ "inspectionId": "string", "fileUri": "string", "mimeType?": "string", "width": number, "height": number, "deviceId": "string" }` | `{ "id": "string", "inspectionId": "string", "fileUri": "string", "mimeType": "string", "width": number, "height": number }` |
| 6 | `POST /api/observations` | CreateObservation | Registra una observación manual del inspector | `{ "inspectionId": "string", "diseaseId": "string", "severityLevel": number, "incidencePercent": number, "sourceType?": "string" }` | `{ "id": "string", "inspectionId": "string", "diseaseId": "string", "severityLevel": number, "incidencePercent": number, "sourceType": "string" }` |
| 7 | `POST /api/inference-results` | CreateInferenceResult | Almacena resultados de inferencia IA | `{ "imageId": "string", "modelName": "string", "modelVersion": "string", "predictedDiseaseId": "string", "confidence": number, "topKJson?": "string" }` | `{ "id": "string", "imageId": "string", "modelName": "string", "modelVersion": "string", "predictedDiseaseId": "string", "confidence": number }` |
| 8 | `POST /api/sync/bulk` | BulkSync | Sincronización masiva de múltiples entidades | `{ "deviceId?": "string", "inspections?": [CreateInspectionPayload], "observations?": [CreateObservationPayload], "inferenceResults?": [CreateInferenceResultPayload] }` | `{ "message": "string", "syncedEntities": number, "timestamp": "datetime" }` |

## Detalle de cada Endpoint

### 1. `POST /api/auth/login`
**Propósito:** Autenticación de usuario.

```json
// Request
{
  "email": "inspector@agrovision.co",
  "password": "agro2026"
}

// Response 200
{
  "id": "inspector-001",
  "fullName": "Inspector Demo",
  "email": "inspector@agrovision.co",
  "role": "inspector",
  "organizationId": "org-001",
  "token": "mock-jwt-abc123..."
}

// Response 401 — Credenciales inválidas
```

---

### 2. `POST /api/auth/register`
**Propósito:** Registro de nuevo usuario.

```json
// Request
{
  "fullName": "María García",
  "email": "maria@agrovision.co",
  "password": "securepass",
  "role": "inspector",
  "organizationId": "org-001"
}

// Response 201
{
  "id": "guid-generado",
  "fullName": "María García",
  "email": "maria@agrovision.co",
  "role": "inspector"
}

// Response 409 — Email ya registrado
{
  "message": "El correo ya está registrado."
}
```

---

### 3. `POST /api/telemetry`
**Propósito:** Sincronizar inferencias offline al servidor.

```json
// Request
{
  "inferences": [
    {
      "timestamp": "2026-05-13T20:00:00Z",
      "pestType": "Broca del Café",
      "confidence": 0.92
    },
    {
      "timestamp": "2026-05-13T20:05:00Z",
      "pestType": "Roya del Cafeto",
      "confidence": 0.87
    }
  ]
}

// Response 200
{
  "message": "Telemetría sincronizada correctamente",
  "totalRecords": 15
}
```

---

### 4. `POST /api/inspections`
**Propósito:** Crear una inspección de campo.

```json
// Request
{
  "plotId": "plot-001",
  "inspectorId": "inspector-001",
  "inspectionDate": "2026-05-13T14:30:00Z"
}

// Response 201
{
  "id": "guid-generado",
  "plotId": "plot-001",
  "inspectorId": "inspector-001",
  "inspectionDate": "2026-05-13T14:30:00Z",
  "syncStatus": "synced"
}
```

---

### 5. `POST /api/images`
**Propósito:** Registrar metadatos de imagen capturada.

```json
// Request
{
  "inspectionId": "inspection-guid",
  "fileUri": "blob:localhost/abc-123",
  "mimeType": "image/jpeg",
  "width": 1920,
  "height": 1080,
  "deviceId": "device-001"
}

// Response 201
{
  "id": "guid-generado",
  "inspectionId": "inspection-guid",
  "fileUri": "blob:localhost/abc-123",
  "mimeType": "image/jpeg",
  "width": 1920,
  "height": 1080
}
```

---

### 6. `POST /api/observations`
**Propósito:** Registrar observación manual del inspector.

```json
// Request
{
  "inspectionId": "inspection-guid",
  "diseaseId": "broca",
  "severityLevel": 3,
  "incidencePercent": 15.5,
  "sourceType": "manual"
}

// Response 201
{
  "id": "guid-generado",
  "inspectionId": "inspection-guid",
  "diseaseId": "broca",
  "severityLevel": 3,
  "incidencePercent": 15.5,
  "sourceType": "manual"
}
```

---

### 7. `POST /api/inference-results`
**Propósito:** Almacenar resultados de la inferencia del modelo IA.

```json
// Request
{
  "imageId": "image-guid",
  "modelName": "broca_detect_v1",
  "modelVersion": "v1.0.0",
  "predictedDiseaseId": "broca",
  "confidence": 0.94,
  "topKJson": "[{\"id\":\"broca\",\"p\":0.94},{\"id\":\"roya\",\"p\":0.04},{\"id\":\"healthy\",\"p\":0.02}]"
}

// Response 201
{
  "id": "guid-generado",
  "imageId": "image-guid",
  "modelName": "broca_detect_v1",
  "modelVersion": "v1.0.0",
  "predictedDiseaseId": "broca",
  "confidence": 0.94
}
```

---

### 8. `POST /api/sync/bulk`
**Propósito:** Sincronización masiva de entidades pendientes.

```json
// Request
{
  "deviceId": "device-001",
  "inspections": [
    { "plotId": "plot-001", "inspectorId": "inspector-001", "inspectionDate": "2026-05-13T14:30:00Z" }
  ],
  "observations": [
    { "inspectionId": "ins-001", "diseaseId": "broca", "severityLevel": 3, "incidencePercent": 12.0, "sourceType": "ia" }
  ],
  "inferenceResults": [
    { "imageId": "img-001", "modelName": "broca_detect_v1", "modelVersion": "v1.0.0", "predictedDiseaseId": "broca", "confidence": 0.91, "topKJson": null }
  ]
}

// Response 200
{
  "message": "Sincronización masiva completada",
  "syncedEntities": 3,
  "timestamp": "2026-05-13T20:30:00Z"
}
```

## Endpoints GET (referencia)

| Endpoint | Nombre | Descripción |
|----------|--------|-------------|
| `GET /api/telemetry/stats` | GetTelemetryStats | Obtener todos los registros de telemetría |
| `GET /api/models/latest` | GetLatestModelInfo | Obtener versión del modelo IA más reciente |
| `GET /api/inspections` | GetInspections | Listar todas las inspecciones |
| `GET /api/diseases` | GetDiseaseCatalog | Obtener catálogo de enfermedades/plagas |
| `GET /api/organizations` | GetOrganizations | Listar organizaciones |
| `GET /api/farms` | GetFarms | Listar fincas |
| `GET /api/plots` | GetPlots | Listar lotes |

## Credenciales Demo

| Email | Password | Rol |
|-------|----------|-----|
| `admin@agrovision.co` | `admin2026` | admin |
| `inspector@agrovision.co` | `agro2026` | inspector |
| `juan.perez@agrovision.co` | `cafe2026` | inspector |
