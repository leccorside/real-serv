-- SQL Server Initialization Script
-- Este arquivo é executado automaticamente na inicialização do container

-- ==========================================
-- Criar Banco de Dados
-- ==========================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'gruporealserv')
BEGIN
    CREATE DATABASE [gruporealserv]
    PRINT 'Banco de dados gruporealserv criado'
END
ELSE
BEGIN
    PRINT 'Banco de dados gruporealserv já existe'
END

GO

-- ==========================================
-- Configurar Banco de Dados
-- ==========================================
USE [gruporealserv]

-- Definir modelo de recuperação
ALTER DATABASE [gruporealserv] SET RECOVERY SIMPLE

-- Habilitar SQL Agent jobs (opcional)
-- sp_configure 'SQL Server Agent', 1
-- RECONFIGURE

GO

-- ==========================================
-- Criar Logins e Usuários
-- ==========================================

-- Login do aplicação
IF NOT EXISTS (SELECT * FROM sys.syslogins WHERE name = 'gruporealserv')
BEGIN
    CREATE LOGIN [gruporealserv] WITH PASSWORD = N'cubee2k17'
    PRINT 'Login gruporealserv criado'
END

-- Usuário no banco
USE [gruporealserv]
IF NOT EXISTS (SELECT * FROM sys.sysusers WHERE name = 'gruporealserv')
BEGIN
    CREATE USER [gruporealserv] FOR LOGIN [gruporealserv]
    PRINT 'Usuário gruporealserv criado'
END

-- Atribuir role de db_owner (ajuste os níveis de permissão conforme necessário)
ALTER ROLE [db_owner] ADD MEMBER [gruporealserv]

GO

-- ==========================================
-- Tabelas Básicas (Exemplo)
-- ==========================================
-- Se você tiver um scripde criação pronto, coloque aqui

-- CREATE TABLE IF NOT EXISTS [dbo].[Usuarios] (
--     [Id] INT PRIMARY KEY IDENTITY(1,1),
--     [Nome] NVARCHAR(255) NOT NULL,
--     [Email] NVARCHAR(255) NOT NULL UNIQUE,
--     [DataCriacao] DATETIME DEFAULT GETDATE()
-- )

GO

-- ==========================================
-- Índices (Exemplo)
-- ==========================================
-- CREATE INDEX IX_Usuarios_Email ON [dbo].[Usuarios](Email)

GO

-- ==========================================
-- Verificação Final
-- ==========================================
PRINT ''
PRINT 'Inicialização concluída!'
PRINT 'Banco de dados: ' + DB_NAME()
PRINT 'Versão SQL Server: ' + @@VERSION
PRINT 'Data/Hora: ' + CONVERT(VARCHAR, GETDATE(), 120)

GO
