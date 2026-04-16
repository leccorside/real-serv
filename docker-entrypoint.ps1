# entrypoint.ps1
# Script de inicialização para o container ASP.NET MVC

$ErrorActionPreference = "Stop"

# Função para log
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
}

# Função para aguardar banco de dados
function Wait-ForDatabase {
    param(
        [string]$Server = "mssql",
        [string]$Database = "gruporealserv",
        [string]$User = "sa",
        [string]$Password,
        [int]$MaxAttempts = 30,
        [int]$DelaySeconds = 2
    )
    
    Write-Log "Aguardando SQL Server em $Server para ficar pronto..."
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $connectionString = "Server=$Server;Initial Catalog=$Database;User ID=$User;Password=$Password;Connection Timeout=5;"
            $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
            $connection.Open()
            $connection.Close()
            Write-Log "✓ SQL Server está pronto!"
            return $true
        } catch {
            Write-Log "SQL Server não está pronto ainda... ($i/$MaxAttempts)"
            Start-Sleep -Seconds $DelaySeconds
        }
    }
    
    Write-Log "✗ Falha ao conectar ao SQL Server após $MaxAttempts tentativas"
    return $false
}

# Função para criar/restaurar banco de dados
function Initialize-Database {
    param(
        [string]$Server = "mssql",
        [string]$User = "sa",
        [string]$Password
    )
    
    Write-Log "Inicializando banco de dados..."
    
    $sqlScript = @"
-- Criar banco de dados se não existir
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'gruporealserv')
BEGIN
    CREATE DATABASE [gruporealserv]
    PRINT 'Banco de dados gruporealserv criado'
END
ELSE
BEGIN
    PRINT 'Banco de dados gruporealserv já existe'
END

-- Verificar login
IF NOT EXISTS (SELECT * FROM sys.syslogins WHERE name = 'gruporealserv')
BEGIN
    CREATE LOGIN [gruporealserv] WITH PASSWORD = N'Temp@Pass123!', DEFAULT_DATABASE=[master]
    PRINT 'Login gruporealserv criado'
END

-- Criar usuário no banco
USE [gruporealserv]
IF NOT EXISTS (SELECT * FROM sys.sysusers WHERE name = 'gruporealserv')
BEGIN
    CREATE USER [gruporealserv] FOR LOGIN [gruporealserv]
    PRINT 'Usuário gruporealserv criado'
END

-- Atribuir permissões
ALTER ROLE [db_owner] ADD MEMBER [gruporealserv]
PRINT 'Permissões atribuídas'
"@
    
    try {
        $sqlScript | sqlcmd -S $Server -U $User -P $Password -d master
        Write-Log "✓ Banco de dados inicializado"
    } catch {
        Write-Log "⚠ Erro ao inicializar banco: $_"
    }
}

# Função para configurar Web.config
function Update-WebConfig {
    param(
        [string]$ConfigPath = "C:\inetpub\wwwroot\Web.config",
        [string]$Server = "mssql",
        [string]$Database = "gruporealserv",
        [string]$User = "sa",
        [string]$Password
    )
    
    if (Test-Path $ConfigPath) {
        Write-Log "Atualizando Web.config com connection string..."
        
        [xml]$webConfig = Get-Content $ConfigPath
        
        $connectionString = "Data Source=$Server,1433;Initial Catalog=$Database;User ID=$User;Password=$Password"
        $connStringNode = $webConfig.configuration.connectionStrings.add | Where-Object { $_.name -eq "cn" }
        
        if ($connStringNode) {
            $connStringNode.connectionString = $connectionString
            $webConfig.Save($ConfigPath)
            Write-Log "✓ Web.config atualizado"
        } else {
            Write-Log "⚠ Connection string node não encontrado no Web.config"
        }
    } else {
        Write-Log "⚠ Web.config não encontrado em $ConfigPath"
    }
}

# Main execution
Write-Log "============================================"
Write-Log "Real Serv - Inicialização do Container"
Write-Log "============================================"

# Obter variáveis de ambiente
$dbPassword = $env:SA_PASSWORD -or "YourSecurePassword123!@#"
$dbServer = $env:SQLSERVER_HOST -or "mssql"
$dbName = $env:MSSQL_DATABASE -or "gruporealserv"
$dbUser = "sa"

# Aguardar banco de dados
if (-not (Wait-ForDatabase -Server $dbServer -Database $dbName -User $dbUser -Password $dbPassword)) {
    Write-Log "Continuando mesmo sem conexão ao banco..."
}

# Inicializar banco de dados
Initialize-Database -Server $dbServer -User $dbUser -Password $dbPassword

# Atualizar Web.config
Update-WebConfig -Server $dbServer -Database $dbName -User $dbUser -Password $dbPassword

Write-Log "Iniciando IIS..."
cd C:\inetpub\wwwroot

# Iniciar IIS em foreground para que o container continue rodando
iisexpress.exe /path:"." /systray:false
