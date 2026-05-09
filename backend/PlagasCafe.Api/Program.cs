using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowPwa",
        policy => policy
            .WithOrigins("http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyMethod()
            .AllowAnyHeader());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowPwa");

// Simulated In-Memory Database for Telemetry
var telemetryData = new List<TelemetryRecord>();

// ==========================
// ENDPOINTS
// ==========================

// 1. Telemetry Sync (Called by PWA when online)
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

// 2. Telemetry Stats (For Dashboard)
app.MapGet("/api/telemetry/stats", () =>
{
    return Results.Ok(telemetryData);
})
.WithName("GetTelemetryStats");

// 3. Model Distribution Versioning
app.MapGet("/api/models/latest", () =>
{
    // Return mock model version info
    return Results.Ok(new {
        version = "v1.0.0",
        modelName = "broca_detect_v1",
        publishedAt = DateTime.UtcNow.AddDays(-5),
        sizeBytes = 3145728 // 3MB mock
    });
})
.WithName("GetLatestModelInfo");

app.Run();

// DTOs
public record TelemetryPayload(List<InferenceData> Inferences);
public record InferenceData(string Timestamp, string PestType, double Confidence);
public record TelemetryRecord(Guid Id, string Timestamp, string PestType, double Confidence);
