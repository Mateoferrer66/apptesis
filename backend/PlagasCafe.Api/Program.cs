using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowPwa",
        policy => policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowPwa");

// Simulated In-Memory Database
var telemetryData = new List<TelemetryRecord>();
var usersDb = new List<UserRecord>
{
    new("admin-001", "Admin AgroVision", "admin@agrovision.co", "admin2026", "admin", "org-001"),
    new("inspector-001", "Inspector Demo", "inspector@agrovision.co", "agro2026", "inspector", "org-001"),
    new("inspector-002", "Juan Pérez", "juan.perez@agrovision.co", "cafe2026", "inspector", "org-001"),
};
var organizationsDb = new List<OrganizationRecord>
{
    new("org-001", "Cooperativa Cafetera del Huila", "cooperativa", DateTime.UtcNow),
};
var farmsDb = new List<FarmRecord>
{
    new("farm-001", "org-001", "Finca La Esperanza", "Pitalito", 12.5m),
    new("farm-002", "org-001", "Finca El Edén", "Acevedo", 8.3m),
};
var plotsDb = new List<PlotRecord>
{
    new("plot-001", "farm-001", "L-001", "Castillo"),
    new("plot-002", "farm-001", "L-002", "Caturra"),
    new("plot-003", "farm-002", "L-001", "Colombia"),
};
var inspectionsDb = new List<InspectionRecord>();
var diseaseCatalog = new List<DiseaseCatalogRecord>
{
    new("broca", "Broca del Café", "Hypothenemus hampei", "insecto"),
    new("roya", "Roya del Cafeto", "Hemileia vastatrix", "hongo"),
    new("minador", "Minador de la Hoja", "Leucoptera coffeella", "insecto"),
    new("antracnosis", "Antracnosis", "Colletotrichum spp.", "hongo"),
    new("healthy", "Planta Sana", "Sin plagas detectadas", "ninguna"),
};
var imagesDb = new List<ImageRecord>();
var observationsDb = new List<ObservationRecord>();
var inferenceResultsDb = new List<InferenceResultRecord>();
var syncEventsDb = new List<SyncEventRecord>();

// ==========================
// ENDPOINTS
// ==========================

// ── ROOT ──────────────────────────────────────────────────────────────────────

// GET /
app.MapGet("/", () => Results.Ok(new { message = "AgroVision API is running", status = "OK", version = "v1.0" }))
.WithName("Root");

// ── AUTH ──────────────────────────────────────────────────────────────────────

// POST /api/auth/login
app.MapPost("/api/auth/login", (LoginPayload payload) =>
{
    var user = usersDb.FirstOrDefault(u =>
        u.Email.Equals(payload.Email, StringComparison.OrdinalIgnoreCase) &&
        u.Password == payload.Password);

    if (user == null)
        return Results.Unauthorized();

    return Results.Ok(new
    {
        id = user.Id,
        fullName = user.FullName,
        email = user.Email,
        role = user.Role,
        organizationId = user.OrganizationId,
        token = $"mock-jwt-{Guid.NewGuid():N}"
    });
})
.WithName("Login");

// POST /api/auth/register
app.MapPost("/api/auth/register", (RegisterPayload payload) =>
{
    if (usersDb.Any(u => u.Email.Equals(payload.Email, StringComparison.OrdinalIgnoreCase)))
        return Results.Conflict(new { message = "El correo ya está registrado." });

    var newUser = new UserRecord(
        Guid.NewGuid().ToString(),
        payload.FullName,
        payload.Email,
        payload.Password,
        payload.Role ?? "inspector",
        payload.OrganizationId ?? "org-001"
    );
    usersDb.Add(newUser);

    return Results.Created($"/api/profiles/{newUser.Id}", new
    {
        id = newUser.Id,
        fullName = newUser.FullName,
        email = newUser.Email,
        role = newUser.Role
    });
})
.WithName("Register");

// ── TELEMETRY ────────────────────────────────────────────────────────────────

// POST /api/telemetry  — Sync inferences from PWA
app.MapPost("/api/telemetry", (TelemetryPayload payload) =>
{
    if (payload?.Inferences != null)
    {
        foreach (var item in payload.Inferences)
        {
            telemetryData.Add(new TelemetryRecord(Guid.NewGuid(), item.Timestamp, item.PestType, item.Confidence));
        }
        Console.WriteLine($"[Sync] {payload.Inferences.Count} registros recibidos.");
    }
    return Results.Ok(new { message = "Telemetría sincronizada correctamente", totalRecords = telemetryData.Count });
})
.WithName("SyncTelemetry");

// GET /api/telemetry/stats
app.MapGet("/api/telemetry/stats", () =>
{
    return Results.Ok(telemetryData);
})
.WithName("GetTelemetryStats");

// ── MODELS ───────────────────────────────────────────────────────────────────

// GET /api/models/latest
app.MapGet("/api/models/latest", () =>
{
    return Results.Ok(new {
        version = "v1.0.0",
        modelName = "broca_detect_v1",
        publishedAt = DateTime.UtcNow.AddDays(-5),
        sizeBytes = 3145728
    });
})
.WithName("GetLatestModelInfo");

// ── INSPECTIONS ──────────────────────────────────────────────────────────────

// POST /api/inspections  — Create a new inspection
app.MapPost("/api/inspections", (CreateInspectionPayload payload) =>
{
    var inspection = new InspectionRecord(
        Guid.NewGuid().ToString(),
        payload.PlotId,
        payload.InspectorId,
        payload.InspectionDate ?? DateTime.UtcNow,
        "synced"
    );
    inspectionsDb.Add(inspection);

    return Results.Created($"/api/inspections/{inspection.Id}", new
    {
        id = inspection.Id,
        plotId = inspection.PlotId,
        inspectorId = inspection.InspectorId,
        inspectionDate = inspection.InspectionDate,
        syncStatus = inspection.SyncStatus
    });
})
.WithName("CreateInspection");

// GET /api/inspections
app.MapGet("/api/inspections", () => Results.Ok(inspectionsDb))
.WithName("GetInspections");

// ── IMAGES ───────────────────────────────────────────────────────────────────

// POST /api/images  — Upload image metadata
app.MapPost("/api/images", (CreateImagePayload payload) =>
{
    var image = new ImageRecord(
        Guid.NewGuid().ToString(),
        payload.InspectionId,
        payload.FileUri,
        payload.MimeType ?? "image/jpeg",
        payload.Width,
        payload.Height,
        payload.DeviceId
    );
    imagesDb.Add(image);

    return Results.Created($"/api/images/{image.Id}", new
    {
        id = image.Id,
        inspectionId = image.InspectionId,
        fileUri = image.FileUri,
        mimeType = image.MimeType,
        width = image.Width,
        height = image.Height
    });
})
.WithName("UploadImage");

// ── OBSERVATIONS ─────────────────────────────────────────────────────────────

// POST /api/observations  — Record a manual observation
app.MapPost("/api/observations", (CreateObservationPayload payload) =>
{
    var observation = new ObservationRecord(
        Guid.NewGuid().ToString(),
        payload.InspectionId,
        payload.DiseaseId,
        payload.SeverityLevel,
        payload.IncidencePercent,
        payload.SourceType ?? "manual"
    );
    observationsDb.Add(observation);

    return Results.Created($"/api/observations/{observation.Id}", new
    {
        id = observation.Id,
        inspectionId = observation.InspectionId,
        diseaseId = observation.DiseaseId,
        severityLevel = observation.SeverityLevel,
        incidencePercent = observation.IncidencePercent,
        sourceType = observation.SourceType
    });
})
.WithName("CreateObservation");

// ── INFERENCE RESULTS ────────────────────────────────────────────────────────

// POST /api/inference-results  — Store AI inference results
app.MapPost("/api/inference-results", (CreateInferenceResultPayload payload) =>
{
    var result = new InferenceResultRecord(
        Guid.NewGuid().ToString(),
        payload.ImageId,
        payload.ModelName,
        payload.ModelVersion,
        payload.PredictedDiseaseId,
        payload.Confidence,
        payload.TopKJson
    );
    inferenceResultsDb.Add(result);

    return Results.Created($"/api/inference-results/{result.Id}", new
    {
        id = result.Id,
        imageId = result.ImageId,
        modelName = result.ModelName,
        modelVersion = result.ModelVersion,
        predictedDiseaseId = result.PredictedDiseaseId,
        confidence = result.Confidence
    });
})
.WithName("CreateInferenceResult");

// GET /api/inference-results/{imageId}
app.MapGet("/api/inference-results/{imageId}", (string imageId) =>
{
    var result = inferenceResultsDb.FirstOrDefault(r => r.ImageId == imageId);
    if (result == null) return Results.NotFound(new { message = "Resultado de inferencia no encontrado para la imagen solicitada." });

    var disease = diseaseCatalog.FirstOrDefault(d => d.Id == result.PredictedDiseaseId);

    // Map risk category based on domain logic or category.
    string risk = "medium";
    string color = "#ca8a04";
    if (disease?.Id == "healthy") { risk = "none"; color = "#16a34a"; }
    else if (disease?.Id == "broca") { risk = "critical"; color = "#dc2626"; }
    else if (disease?.Id == "roya") { risk = "high"; color = "#ea580c"; }

    return Results.Ok(new
    {
        id = result.Id,
        imageId = result.ImageId,
        pestType = disease?.CommonName ?? "Desconocido",
        pestId = disease?.Id,
        scientific = disease?.ScientificName ?? "",
        risk = risk,
        color = color,
        confidence = result.Confidence,
        inferenceTimeMs = 0, // Backend might not know this unless provided, return 0 or default
        recommendation = disease?.Category == "ninguna" ? "Sano" : "Aplicar tratamiento o consultar experto"
    });
})
.WithName("GetInferenceResultByImageId");

// ── SYNC ─────────────────────────────────────────────────────────────────────

// POST /api/sync/bulk  — Bulk sync multiple entities
app.MapPost("/api/sync/bulk", (BulkSyncPayload payload) =>
{
    int synced = 0;

    if (payload.Inspections != null)
    {
        foreach (var ins in payload.Inspections)
        {
            inspectionsDb.Add(new InspectionRecord(
                ins.Id ?? Guid.NewGuid().ToString(),
                ins.PlotId, ins.InspectorId,
                ins.InspectionDate ?? DateTime.UtcNow, "synced"));
            synced++;
        }
    }

    if (payload.Observations != null)
    {
        foreach (var obs in payload.Observations)
        {
            observationsDb.Add(new ObservationRecord(
                obs.Id ?? Guid.NewGuid().ToString(),
                obs.InspectionId, obs.DiseaseId,
                obs.SeverityLevel, obs.IncidencePercent,
                obs.SourceType ?? "manual"));
            synced++;
        }
    }

    if (payload.InferenceResults != null)
    {
        foreach (var ir in payload.InferenceResults)
        {
            inferenceResultsDb.Add(new InferenceResultRecord(
                ir.Id ?? Guid.NewGuid().ToString(),
                ir.ImageId, ir.ModelName, ir.ModelVersion,
                ir.PredictedDiseaseId, ir.Confidence, ir.TopKJson));
            synced++;
        }
    }

    // Log sync event
    syncEventsDb.Add(new SyncEventRecord(
        Guid.NewGuid().ToString(),
        payload.DeviceId ?? "unknown",
        "bulk",
        $"batch-{DateTime.UtcNow:yyyyMMddHHmmss}",
        "completed"
    ));

    return Results.Ok(new
    {
        message = "Sincronización masiva completada",
        syncedEntities = synced,
        timestamp = DateTime.UtcNow
    });
})
.WithName("BulkSync");

// ── CATALOG ──────────────────────────────────────────────────────────────────

// GET /api/diseases
app.MapGet("/api/diseases", () => Results.Ok(diseaseCatalog))
.WithName("GetDiseaseCatalog");

// GET /api/organizations
app.MapGet("/api/organizations", () => Results.Ok(organizationsDb))
.WithName("GetOrganizations");

// GET /api/farms
app.MapGet("/api/farms", () => Results.Ok(farmsDb))
.WithName("GetFarms");

// GET /api/plots
app.MapGet("/api/plots", () => Results.Ok(plotsDb))
.WithName("GetPlots");

app.Run();

// ============================
// DTOs & Records
// ============================

// Auth
public record LoginPayload(string Email, string Password);
public record RegisterPayload(string FullName, string Email, string Password, string? Role, string? OrganizationId);

// Telemetry (legacy)
public record TelemetryPayload(List<InferenceData> Inferences);
public record InferenceData(string Timestamp, string PestType, double Confidence);
public record TelemetryRecord(Guid Id, string Timestamp, string PestType, double Confidence);

// Domain
public record UserRecord(string Id, string FullName, string Email, string Password, string Role, string OrganizationId);
public record OrganizationRecord(string Id, string Name, string Type, DateTime CreatedAt);
public record FarmRecord(string Id, string OrganizationId, string Name, string Municipality, decimal AreaHa);
public record PlotRecord(string Id, string FarmId, string Code, string Variety);
public record InspectionRecord(string Id, string PlotId, string InspectorId, DateTime InspectionDate, string SyncStatus);
public record DiseaseCatalogRecord(string Id, string CommonName, string ScientificName, string Category);
public record ImageRecord(string Id, string InspectionId, string FileUri, string MimeType, int Width, int Height, string DeviceId);
public record ObservationRecord(string Id, string InspectionId, string DiseaseId, int SeverityLevel, decimal IncidencePercent, string SourceType);
public record InferenceResultRecord(string Id, string ImageId, string ModelName, string ModelVersion, string PredictedDiseaseId, double Confidence, string? TopKJson);
public record SyncEventRecord(string Id, string DeviceId, string EntityName, string EntityId, string SyncStatus);

// Payloads
public record CreateInspectionPayload(string? Id, string PlotId, string InspectorId, DateTime? InspectionDate);
public record CreateImagePayload(string? Id, string InspectionId, string FileUri, string? MimeType, int Width, int Height, string DeviceId);
public record CreateObservationPayload(string? Id, string InspectionId, string DiseaseId, int SeverityLevel, decimal IncidencePercent, string? SourceType);
public record CreateInferenceResultPayload(string? Id, string ImageId, string ModelName, string ModelVersion, string PredictedDiseaseId, double Confidence, string? TopKJson);
public record BulkSyncPayload(
    string? DeviceId,
    List<CreateInspectionPayload>? Inspections,
    List<CreateObservationPayload>? Observations,
    List<CreateInferenceResultPayload>? InferenceResults
);
