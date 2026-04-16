# Docker Setup Script for Real Serv
# Este script automatiza a setup e deployment da aplicacao em Docker

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('build', 'up', 'down', 'logs', 'stop', 'restart', 'clean', 'init')]
    [string]$Action = 'up'
)

# Cores para output
$colors = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Cyan'
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Type = 'Info'
    )
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Write-Host "[$timestamp]" -NoNewline
    Write-Host " $Message" -ForegroundColor $colors[$Type]
}

function Check-Prerequisites {
    Write-Log "Verificando pre-requisitos..." -Type Info
    
    # Verificar Docker
    try {
        $docker = docker --version
        Write-Log "[OK] Docker encontrado: $docker" -Type Success
    } catch {
        Write-Log "[ERRO] Docker nao esta instalado ou nao esta no PATH" -Type Error
        exit 1
    }
    
    # Verificar Docker Compose
    try {
        $compose = docker-compose --version
        Write-Log "[OK] Docker Compose encontrado: $compose" -Type Success
    } catch {
        Write-Log "[ERRO] Docker Compose nao esta instalado" -Type Error
        exit 1
    }
    
    # Verificar se Docker esta rodando
    try {
        docker ps > $null 2>&1
        Write-Log "[OK] Docker daemon esta rodando" -Type Success
    } catch {
        Write-Log "[ERRO] Docker daemon nao esta respondendo. Inicie o Docker Desktop." -Type Error
        exit 1
    }
}

function Initialize-Environment {
    Write-Log "Inicializando ambiente..." -Type Info
    
    # Criar arquivo .env se nao existir
    if (-not (Test-Path '.env')) {
        Write-Log "Criando arquivo .env..." -Type Info
        @"
# SQL Server Configuration
SA_PASSWORD=YourSecurePassword123!@#
MSSQL_DATABASE=gruporealserv
MSSQL_USER=gruporealserv
MSSQL_PASSWORD=YourSecurePassword123!@#

# Application Configuration
ASPNETCORE_ENVIRONMENT=Production
DEBUG=false

# Server Configuration
SQLSERVER_HOST=mssql
SQLSERVER_PORT=1433
"@ | Out-File -FilePath '.env' -Encoding ASCII
        Write-Log "[OK] Arquivo .env criado (altere as senhas!)" -Type Warning
    } else {
        Write-Log "[OK] Arquivo .env ja existe" -Type Success
    }
    
    # Criar pasta de logs
    if (-not (Test-Path 'Logs')) {
        New-Item -ItemType Directory -Name 'Logs' | Out-Null
        Write-Log "[OK] Pasta Logs criada" -Type Success
    }
    
    # Criar pasta de database se nao existir
    if (-not (Test-Path 'database')) {
        New-Item -ItemType Directory -Name 'database' | Out-Null
        Write-Log "[OK] Pasta database criada" -Type Success
    }
}

function Build-Images {
    Write-Log "Buildando imagens Docker..." -Type Info
    docker-compose build
    if ($LASTEXITCODE -eq 0) {
        Write-Log "[OK] Imagens buildadas com sucesso" -Type Success
    } else {
        Write-Log "[ERRO] Erro ao buildar imagens" -Type Error
        exit 1
    }
}

function Start-Services {
    Write-Log "Iniciando servicos..." -Type Info
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Log "[OK] Servicos iniciados" -Type Success
        Write-Log "Aguardando servicos ficarem prontos..." -Type Info
        Start-Sleep -Seconds 15
        Show-Status
    } else {
        Write-Log "[ERRO] Erro ao iniciar servicos" -Type Error
        exit 1
    }
}

function Stop-Services {
    Write-Log "Parando servicos..." -Type Info
    docker-compose stop
    Write-Log "[OK] Servicos parados" -Type Success
}

function Remove-Services {
    Write-Log "Removendo containers (dados persistirao)" -Type Warning
    docker-compose down
    Write-Log "[OK] Containers removidos" -Type Success
}

function Show-Logs {
    Write-Log "Mostrando logs de todos os servicos (Ctrl+C para sair)..." -Type Info
    docker-compose logs -f
}

function Show-Status {
    Write-Log "Status dos containers:" -Type Info
    docker-compose ps
    Write-Log "`nInformacoes de acesso:" -Type Info
    Write-Host "  Website: http://localhost" -ForegroundColor Cyan
    Write-Host "  SQL Server: localhost:1433" -ForegroundColor Cyan
    Write-Host "  Usuario SQL: sa" -ForegroundColor Cyan
}

function Clean-All {
    Write-Log "LIMPANDO TUDO - Isso removera todos os containers e volumes!" -Type Warning
    $confirm = Read-Host "Tem certeza? Digite 'SIM' para continuar"
    
    if ($confirm -eq 'SIM') {
        Write-Log "Removendo containers e volumes..." -Type Warning
        docker-compose down -v
        Write-Log "[OK] Limpeza completa realizada" -Type Success
    } else {
        Write-Log "Limpeza cancelada" -Type Info
    }
}

function Restart-Services {
    Write-Log "Reiniciando servicos..." -Type Info
    docker-compose restart
    Write-Log "[OK] Servicos reiniciados" -Type Success
    Start-Sleep -Seconds 5
    Show-Status
}

# Main script execution
Write-Log "========================================" -Type Info
Write-Log "Real Serv - Docker Management Script" -Type Info
Write-Log "========================================" -Type Info

Check-Prerequisites

switch ($Action) {
    'init' {
        Initialize-Environment
    }
    'build' {
        Initialize-Environment
        Build-Images
    }
    'up' {
        Initialize-Environment
        Build-Images
        Start-Services
    }
    'down' {
        Remove-Services
    }
    'stop' {
        Stop-Services
    }
    'restart' {
        Restart-Services
    }
    'logs' {
        Show-Logs
    }
    'clean' {
        Clean-All
    }
    default {
        Write-Log "Acao desconhecida: $Action" -Type Error
        exit 1
    }
}

Write-Log "Operacao concluida!" -Type Success
