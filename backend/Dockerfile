# Build context: repositório raiz (ver docker-compose)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/src/AlugueMe.Domain/AlugueMe.Domain.csproj AlugueMe.Domain/
COPY backend/src/AlugueMe.Application/AlugueMe.Application.csproj AlugueMe.Application/
COPY backend/src/AlugueMe.Infrastructure/AlugueMe.Infrastructure.csproj AlugueMe.Infrastructure/
COPY backend/src/AlugueMe.Api/AlugueMe.Api.csproj AlugueMe.Api/

RUN dotnet restore AlugueMe.Api/AlugueMe.Api.csproj

COPY backend/src/AlugueMe.Domain/ AlugueMe.Domain/
COPY backend/src/AlugueMe.Application/ AlugueMe.Application/
COPY backend/src/AlugueMe.Infrastructure/ AlugueMe.Infrastructure/
COPY backend/src/AlugueMe.Api/ AlugueMe.Api/

RUN dotnet publish AlugueMe.Api/AlugueMe.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
ENV ASPNETCORE_URLS=http://+:8080
ENV Themes__RootPath=/app/themes/official
EXPOSE 8080
COPY --from=build /app/publish .
COPY themes/official /app/themes/official
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:8080/health || exit 1
ENTRYPOINT ["dotnet", "AlugueMe.Api.dll"]
