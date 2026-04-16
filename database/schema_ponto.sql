USE [gruporealserv]
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ControlePonto]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ControlePonto](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [RE] [nvarchar](50) NOT NULL,
        [NomeFuncionario] [nvarchar](255) NOT NULL,
        [PostoTrabalho] [nvarchar](255) NULL,
        [DataRegistro] [date] NOT NULL,
        [Entrada] [time](7) NULL,
        [AlmocoSaida] [time](7) NULL,
        [AlmocoRetorno] [time](7) NULL,
        [Saida] [time](7) NULL,
        [Supervisao] [nvarchar](255) NULL,
        [TipoRegistro] [nvarchar](50) DEFAULT 'Aplicativo', -- Aplicativo ou Gerencial
        [Observacoes] [nvarchar](max) NULL,
        [Situacao] [nvarchar](50) DEFAULT 'Normal',
        [DataCadastro] [datetime] DEFAULT GETDATE(),
        PRIMARY KEY CLUSTERED ([Id] ASC)
    )
END
GO

-- Exemplo de inserção para teste
INSERT INTO [dbo].[ControlePonto] 
(RE, NomeFuncionario, PostoTrabalho, DataRegistro, Entrada, AlmocoSaida, AlmocoRetorno, Saida, Supervisao, TipoRegistro)
VALUES 
('#4582', 'Carlos Eduardo Silva', 'Sede Administrativa', '2023-11-01', '08:00', '12:05', '13:02', '17:15', 'Ana Paula Lima', 'Aplicativo'),
('#3921', 'Mariana Santos', 'Unidade Operacional B', '2023-11-01', '07:55', NULL, NULL, NULL, 'Marcos Valente', 'Aplicativo'),
('#4110', 'Roberto Oliveira', 'Centro Logístico', '2023-11-01', NULL, NULL, NULL, NULL, 'Ana Paula Lima', 'Gerencial'),
('#2944', 'Juliana Ferreira', 'Sede Administrativa', '2023-11-01', '09:12', '13:00', '14:00', '18:00', 'Ana Paula Lima', 'Aplicativo')
GO
