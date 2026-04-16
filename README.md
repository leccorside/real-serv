# Real Serv - Docker Setup

Este documento descreve como executar o projeto Real Serv conteinerizado em Docker, sendo que o banco de dados SQL Server permanece em execução na sua máquina Hospedeira (Local/Host). OBS: o projeto está apontado para o banco de dados de produção para melhor visualização. Caso necessite do banco local basta instalar o banco de dados SQL SERVER e configura-lo.

## Pré-requisitos

- **Docker Desktop** (Windows 10/11 com suporte a Windows Containers habilitado)
- **Docker Compose** (incluído com Docker Desktop)
- **Mínimo 4GB RAM** alocado para Docker
- **SQL Server instalado e rodando na sua máquina local** (a aplicação no Docker usará `host.docker.internal` para se conectar a ele)

> **Nota**: Este projeto usa Windows Containers, portanto é necessário que o Docker Desktop esteja na opção "Switch to Windows containers...".

## Configuração

### 1. Entendendo a Arquitetura

Neste arranjo, temos:

- **web**: A aplicação MVC ASP.NET rodando dentro do Docker (Windows Server Core).
- **SQL Server**: Instalação local do SQL Server rodando em sua máquina diretamente no Windows (Host).

Para que a aplicação rodando dentro do container alcance seu banco de dados na máquina host, usamos o endereço especial `host.docker.internal`.

### 2. Configurar Variáveis no docker-compose.yml

O `docker-compose.yml` injeta as variáveis de ambiente com a Connection String necessária para a aplicação se comunicar com o seu banco local. Ajuste senhas ou o catálogo no arquivo `docker-compose.yml` ou em um `.env` se for utilizá-lo:

```yaml
environment:
  # SQL Server rodando localmente no Windows (fora do Docker)
  - ConnectionString=Server=host.docker.internal,1433;Initial Catalog=gruporealserv;User ID=sa;Password=SuaSenhaAqui
```

### 3. Preparar o Banco de Dados (na Máquina Host)

Instale e gerencie o seu SQL Server normalmente fora do Docker (usando SQL Server Management Studio, por exemplo) para restaurar algum arquivo de backup `.bak` do sistema (como `gruporealserv_04.03.26.bak`).

## Iniciar os Containers

### Build e Execução

```powershell
# 1. Navegar até o diretório do projeto
cd c:\projetos\real-serv

# 2. Iniciar a aplicação
docker-compose up -d

# 3. Verificar logs do container Web
docker-compose logs -f realserv_app
```

## Acessar a aplicação

### URL

```powershell
http://localhost:8085/
```

### User

```powershell
thais@marcasite.com.br
```

### Pass

```powershell
123456
```

### Parar e Remover a Aplicação Docker

```powershell
docker-compose down
```

_(Observação: Como o banco de dados está na sua máquina local, "docker-compose down" não deleta o banco, apaga apenas o ambiente da aplicação)._

## Acessar a Aplicação

- **URL**: http://localhost
- **SQL Server**: Administre localmente no seu computador

## Verificar Saúde dos Serviços

```powershell
# Ver status dos containers
docker-compose ps

# Entrar no container para depuracao e testes internos
docker exec -it realserv-web cmd
```

## Solução de Problemas

### 1. Erro: "Windows containers are not enabled"

**Solução**:
Clique no ícone do Docker Desktop no Menu (system tray) e selecione a opção `Switch to Windows containers...`.

### 2. Erro: "Insufficient memory" / Lentidão extrema

**Solução**: Aumente a RAM alocada para o Docker Desktop. Recomendado o mínimo de 4GB. O Windows Server Core exige alguns recursos para os containers IIS.

### 3. A Aplicação Dockerizada não consegue conectar ao banco local!

**Verificar**:

- O SQL Server Configuration Manager tem que estar com o protocolo **TCP/IP** habilitado.
- O Firewall do seu Windows precisa ter a porta **1433** liberada para entrada.
- Teste pingar o host a partir do container:

```powershell
docker exec -it realserv-web cmd
ping host.docker.internal
```

### 4. A Porta 80 já está em uso

**Solução**: Edite o `docker-compose.yml` para mapear a aplicação para outra porta que esteja livre no seu Host:

```yaml
ports:
  - "8080:80" # Acesse http://localhost:8080
```

## Performance

Para melhor performance no longo-prazo:

1. **Aumente a RAM do Docker**
2. **Separe dev e prod** usando overrides com o arquivo `docker-compose.override.yml`.

## Exemplo docker-compose.override.yml (para desenvolvimento)

```yaml
services:
  web:
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - DEBUG=true
    volumes:
      - .:/inetpub/wwwroot
```

Use com:

```powershell
docker-compose base e overrides são lidos por padrão, bastando apenas digitar: docker-compose up -d
```

## Segurança

1. Certifique-se de usar autenticação em seu Host SQL Server (`User ID` e `Password` corretos no docker-compose).
2. Não exponha indevidamente seu SQL Server para a Rede Pública se o App web estiver com as portas abertas globalmente.

## Referências

- [Docker Documentation](https://docs.docker.com/)
- [ASP.NET Framework on Docker](https://github.com/microsoft/dotnet-framework-docker)
- [Docker Compose File Reference](https://docs.docker.com/compose/compose-file/)
