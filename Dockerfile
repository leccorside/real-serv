# Dockerfile simplificado para ASP.NET MVC 4
# Nota: Requer que os binários já estejam compilados localmente
# Se precisar compilar, use Visual Studio ou MSBuild localmente

FROM mcr.microsoft.com/dotnet/framework/runtime:4.8-windowsservercore-ltsc2022

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]

# Using root to avoid overlayfs linking issues
# application files will be placed explicitly

# Copiar arquivos da aplicação para inetpub/wwwroot
COPY . /inetpub/wwwroot/

# Criar diretórios necessários dentro do site
RUN New-Item -ItemType Directory -Path 'C:\inetpub\wwwroot\Logs' -Force | Out-Null

# Copiar script de entrypoint
COPY docker-entrypoint.ps1 /

EXPOSE 80 443 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD powershell -Command try { \
        $response = Invoke-WebRequest -Uri 'http://localhost' -UseBasicParsing -TimeoutSec 3; \
        if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } \
    } catch { exit 1 }

ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["powershell", "-NoProfile", "-File", "/docker-entrypoint.ps1"]
