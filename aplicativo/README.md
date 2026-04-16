# RealServ — Aplicativo Mobile

App de ponto eletrônico desenvolvido com [Expo](https://expo.dev) (React Native).

---

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Expo](https://expo.dev) (apenas para build via EAS)
- Android Studio + SDK (apenas para build local)

---

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npx expo start
```

Opções disponíveis no terminal:
- **`a`** — Abrir no emulador Android
- **`i`** — Abrir no simulador iOS
- **Expo Go** — Escanear o QR Code com o app [Expo Go](https://expo.dev/go)

---

## Gerar APK

### Opção 1 — EAS Build (nuvem, recomendado)

> Requer conta Expo e `eas-cli` instalado.

```bash
# Instalar EAS CLI globalmente (apenas primeira vez)
npm install -g eas-cli

# Login na conta Expo
eas login

# Configurar o projeto (apenas primeira vez)
eas build:configure

# Gerar APK de preview (instalável diretamente no Android)
eas build -p android --profile preview
```

O APK será gerado na nuvem e o link para download aparecerá no terminal ao final da build.

> **Perfil `preview`** gera um APK avulso (`.apk`) instalável sem loja.  
> **Perfil `production`** gera um AAB (`.aab`) para publicação na Google Play.

Para personalizar os perfis, edite o arquivo **`eas.json`**:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

---

### Opção 2 — Build Local (Gradle)

> Requer Android Studio, NDK e variáveis de ambiente configuradas.

#### 1. Pré-requisitos

- Android Studio instalado com:
  - SDK Platform: Android 14 (API 34)
  - NDK versão `27.1.12297006` (instalar via SDK Manager → SDK Tools → NDK)
- Variáveis de ambiente configuradas:

```powershell
# Adicionar ao PATH do sistema (Windows)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_NDK_HOME = "$env:ANDROID_HOME\ndk\27.1.12297006"
```

#### 2. Gerar projeto Android nativo

```bash
# Exportar o projeto para pasta android/
npx expo prebuild --platform android --clean
```

#### 3. Compilar o APK

```powershell
# Entrar na pasta android
cd android

# Build de debug (mais rápido, para testes)
.\gradlew assembleDebug

# Build de release (otimizado)
.\gradlew assembleRelease
```

#### 4. Localizar o APK gerado

| Tipo    | Caminho                                              |
| ------- | ---------------------------------------------------- |
| Debug   | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Release | `android/app/build/outputs/apk/release/app-release.apk` |

Transferir o `.apk` para o dispositivo Android e instalar manualmente.

> **Atenção:** Para build de release sem assinatura, habilite "Fontes desconhecidas" nas configurações do Android.

---

## Scripts disponíveis

| Comando                   | Descrição                                      |
| ------------------------- | ---------------------------------------------- |
| `npm start`               | Inicia o servidor Expo                         |
| `npm run android`         | Abre no emulador Android                       |
| `npm run ios`             | Abre no simulador iOS                          |
| `npm run lint`            | Executa o linter                               |
| `npm run reset-project`   | Reseta o projeto (remove arquivos de exemplo)  |
| `eas build -p android`    | Gera build na nuvem via EAS                    |

---

## Stack

- **Framework:** Expo SDK 52 + React Native
- **Navegação:** Expo Router (file-based routing)
- **Estado:** Zustand + AsyncStorage (persistência offline)
- **API:** ASP.NET ASHX (`sistema.gruporealserv.com.br`)
- **Câmera:** Expo Camera
- **Localização:** Expo Location
