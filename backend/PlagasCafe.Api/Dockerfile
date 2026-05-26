# Etapa de construcción
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar el archivo de proyecto y restaurar las dependencias
COPY ["PlagasCafe.Api.csproj", "./"]
RUN dotnet restore "PlagasCafe.Api.csproj"

# Copiar el resto del código y compilar
COPY . .
RUN dotnet build "PlagasCafe.Api.csproj" -c Release -o /app/build

# Publicar
FROM build AS publish
RUN dotnet publish "PlagasCafe.Api.csproj" -c Release -o /app/publish

# Etapa final (imagen ligera para ejecutar la aplicación)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Exponer el puerto por el que escuchará (Render usa el puerto 8080 por defecto, o el de la variable de entorno PORT)
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "PlagasCafe.Api.dll"]
