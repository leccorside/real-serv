import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  'pt-BR': {
    translation: {
      common: {
        save: 'Salvar',
        cancel: 'Cancelar',
        back: 'Voltar',
      },
      tabs: {
        home: 'Início',
        history: 'Registros',
        reports: 'Relatórios',
        profile: 'Perfil',
      },
      settings: {
        title: 'Configurações',
        notifications: 'NOTIFICAÇÕES',
        security: 'SEGURANÇA',
        preferences: 'PREFERÊNCIAS',
        about: 'SOBRE',
        language: 'Idioma',
        darkMode: 'Modo Escuro',
        biometry: 'Gerenciar Biometria',
        biometryNotAvailable: 'Biometria não disponível ou não configurada neste dispositivo.',
        biometryPrompt: 'Autentique-se para ativar a biometria',
        alertsLabel: 'Alertas de Entrada/Saída',
        remindersLabel: 'Lembretes de Pausa',
        systemLabel: 'Notificações de Sistema',
        changePassword: 'Alterar Senha',
        twoFactor: 'Autenticação em Duas Etapas',
        appVersion: 'Versão do App',
        termsOfUse: 'Termos de Uso',
        logout: 'Sair da conta',
        biometryRequiredTitle: 'Acesso Bloqueado',
        biometryRequiredSubtitle: 'Use sua biometria para acessar o aplicativo',
        authenticateNow: 'Autenticar Agora',
      },
      home: {
        welcome: 'Olá, bem-vindo(a)',
        entry: 'Entrada',
        interval: 'Intervalo',
        exit: 'Saída',
        totalToday: 'Total Hoje',
        registerButton: 'Registrar Ponto',
        offlineWarn: 'Você está offline. Aguardando conexão...',
        syncingWarn: 'Sincronizando registros offline ({{count}})...',
        syncedWarn: 'Todos os registros sincronizados',
        verifiedLocation: 'Localização Verificada: {{location}}'
      },
      registerPoint: {
        title: 'Registrar Ponto',
        selectPrompt: 'Selecione o tipo de registro abaixo',
        currentLocation: 'Localização atual',
        types: {
          entrance: 'ENTRADA',
          break: 'PAUSA ALMOÇO',
          return: 'RETORNO ALMOÇO',
          exit: 'SAÍDA'
        }
      },
      history: {
        title: 'Histórico',
        totalMonth: 'Total Horas (Este Mês)',
        comparedLast: '{{percent}}% comparado ao mês passado',
        empty: 'Nenhum registro encontrado',
        today: 'HOJE',
        yesterday: 'ONTEM',
        synced: 'Sincronizado',
        pending: 'Aguardando',
        filters: {
           week: 'Essa Semana',
           works: 'Obras: Todas',
           month: 'Out'
        }
      },
      reports: {
         title: 'Relatórios',
         monthly: 'Relatório Mensal',
         totalHours: 'Total de Horas',
         overtime: 'Horas Extras',
         debits: 'Faltas/Atrasos',
         bankBalance: 'Saldo Banco',
         metaMatched: 'Meta 100%',
         accumulated: 'Acumulado',
         dailyDetail: 'Detalhamento Diário',
         exportPdf: 'Exportar PDF'
      },
      profile: {
         title: 'Perfil',
         role: 'Analista de RH',
         sections: {
            personal: 'INFORMAÇÕES PESSOAIS',
            documents: 'DOCUMENTOS',
            settings: 'CONFIGURAÇÕES',
            support: 'SUPORTE'
         },
         fields: {
            regId: 'MATRÍCULA',
            department: 'DEPARTAMENTO',
            email: 'E-MAIL',
            phone: 'TELEFONE',
            editProfile: 'Editar Perfil',
            changePassword: 'Alterar Senha',
            notifications: 'Configurações de Notificação',
            help: 'Central de Ajuda',
            terms: 'Termos de Uso',
            logout: 'Sair da Conta'
         }
      },
      confirmPoint: {
         title: 'Confirmação',
         prompt: 'Registro de',
         date: 'Data',
         time: 'Horário',
         location: 'Localização',
         locationGrants: 'Permissão de localização negada. O ponto será registrado sem localização.',
         locationGetting: 'Obtendo GPS...',
         locationCaptured: 'Capturada',
         locationNotCaptured: 'Não Capturada',
         connection: 'Conexão',
         online: 'Online',
         offline: 'Offline',
         confirmButton: 'Confirmar Ponto',
         disclaimer: 'Ao prosseguir, você concorda que o horário e a localização acima são verdadeiros e referentes ao seu expediente laboral na Real Serv.',
         successTitle: 'Ponto Registrado!',
         successMessage: 'Seu ponto de {{type}} foi registrado com sucesso às {{time}}.'
      }
    }
  },
  'en': {
    translation: {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        back: 'Back',
      },
      tabs: {
        home: 'Home',
        history: 'Logs',
        reports: 'Reports',
        profile: 'Profile',
      },
      settings: {
        title: 'Settings',
        notifications: 'NOTIFICATIONS',
        security: 'SECURITY',
        preferences: 'PREFERENCES',
        about: 'ABOUT',
        language: 'Language',
        darkMode: 'Dark Mode',
        biometry: 'Manage Biometrics',
        biometryNotAvailable: 'Biometry not available or not configured on this device.',
        biometryPrompt: 'Authenticate to enable biometrics',
        alertsLabel: 'Clock In/Out Alerts',
        remindersLabel: 'Break Reminders',
        systemLabel: 'System Notifications',
        changePassword: 'Change Password',
        twoFactor: 'Two-Factor Authentication',
        appVersion: 'App Version',
        termsOfUse: 'Terms of Use',
        logout: 'Sign Out',
        biometryRequiredTitle: 'Access Locked',
        biometryRequiredSubtitle: 'Use your biometrics to access the app',
        authenticateNow: 'Authenticate Now',
      },
      home: {
        welcome: 'Hi, welcome',
        entry: 'Entry',
        interval: 'Interval',
        exit: 'Exit',
        totalToday: 'Total Today',
        registerButton: 'Clock In',
        offlineWarn: 'You are offline. Waiting for connection...',
        syncingWarn: 'Syncing offline logs ({{count}})...',
        syncedWarn: 'All records synced',
        verifiedLocation: 'Verified Location: {{location}}'
      },
      registerPoint: {
        title: 'Clock In/Out',
        selectPrompt: 'Select the registration type below',
        currentLocation: 'Current location',
        types: {
          entrance: 'ENTRANCE',
          break: 'BREAK',
          return: 'RETURN',
          exit: 'EXIT'
        }
      },
      history: {
        title: 'History',
        totalMonth: 'Total Hours (This Month)',
        comparedLast: '{{percent}}% compared to last month',
        empty: 'No records found',
        today: 'TODAY',
        yesterday: 'YESTERDAY',
        synced: 'Synced',
        pending: 'Pending',
        filters: {
           week: 'This Week',
           works: 'Jobs: All',
           month: 'Oct'
        }
      },
      reports: {
         title: 'Reports',
         monthly: 'Monthly Report',
         totalHours: 'Total Hours',
         overtime: 'Overtime',
         debits: 'Debits/Late',
         bankBalance: 'Bank Balance',
         metaMatched: 'Meta 100%',
         accumulated: 'Accumulated',
         dailyDetail: 'Daily Breakdown',
         exportPdf: 'Export PDF'
      },
      profile: {
         title: 'Profile',
         role: 'HR Analyst',
         sections: {
            personal: 'PERSONAL INFO',
            documents: 'DOCUMENTS',
            settings: 'SETTINGS',
            support: 'SUPPORT'
         },
         fields: {
            regId: 'REGISTRATION ID',
            department: 'DEPARTMENT',
            email: 'EMAIL',
            phone: 'PHONE',
            editProfile: 'Edit Profile',
            changePassword: 'Change Password',
            notifications: 'Notification Settings',
            help: 'Help Center',
            terms: 'Terms of Use',
            logout: 'Logout'
         }
      },
      confirmPoint: {
         title: 'Confirmation',
         prompt: 'Registration of',
         date: 'Date',
         time: 'Time',
         location: 'Location',
         locationGrants: 'Location permission denied. Point will be recorded without location.',
         locationGetting: 'Getting GPS...',
         locationCaptured: 'Captured',
         locationNotCaptured: 'Not Captured',
         connection: 'Connection',
         online: 'Online',
         offline: 'Offline',
         confirmButton: 'Confirm Clock In/Out',
         disclaimer: 'By proceeding, you agree that the time and location above are true and refer to your labor day at Real Serv.',
         successTitle: 'Point Recorded!',
         successMessage: 'Your {{type}} point was recorded successfully at {{time}}.'
      }
    }
  },
  'es': {
    translation: {
      common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        back: 'Volver',
      },
      tabs: {
        home: 'Inicio',
        history: 'Registros',
        reports: 'Informes',
        profile: 'Perfil',
      },
      settings: {
        title: 'Configuraciones',
        notifications: 'NOTIFICACIONES',
        security: 'SEGURIDAD',
        preferences: 'PREFERENCIAS',
        about: 'ACERCA DE',
        language: 'Idioma',
        darkMode: 'Modo Oscuro',
        biometry: 'Gestionar Biometría',
        biometryNotAvailable: 'Biometría no disponible o no configurada en este dispositivo.',
        biometryPrompt: 'Autentíquese para activar la biometría',
        alertsLabel: 'Alertas de Entrada/Salida',
        remindersLabel: 'Recordatorios de Pausa',
        systemLabel: 'Notificaciones de Sistema',
        changePassword: 'Cambiar contraseña',
        twoFactor: 'Autenticación de Dos Factores',
        appVersion: 'Versión de la aplicación',
        termsOfUse: 'Términos de uso',
        logout: 'Cerrar sesión',
        biometryRequiredTitle: 'Acceso Bloqueado',
        biometryRequiredSubtitle: 'Use su biometría para acceder a la aplicación',
        authenticateNow: 'Autenticar Ahora',
      },
      home: {
        welcome: 'Hola, bienvenido',
        entry: 'Entrada',
        interval: 'Intervalo',
        exit: 'Salida',
        totalToday: 'Total Hoy',
        registerButton: 'Registrar Punto',
        offlineWarn: 'Estás desconectado. Esperando conexión...',
        syncingWarn: 'Sincronizando registros ({{count}})...',
        syncedWarn: 'Todos los registros sincronizados',
        verifiedLocation: 'Ubicación verificada: {{location}}'
      },
      registerPoint: {
        title: 'Registrar Punto',
        selectPrompt: 'Seleccione el tipo de registro a continuación',
        currentLocation: 'Ubicación actual',
        types: {
          entrance: 'ENTRADA',
          break: 'PAUSA',
          return: 'RETORNO',
          exit: 'SALIDA'
        }
      },
      history: {
        title: 'Historial',
        totalMonth: 'Horas Totales (Este Mes)',
        comparedLast: '{{percent}}% comparado al mes passado',
        empty: 'No se encontraron registros',
        today: 'HOY',
        yesterday: 'AYER',
        synced: 'Sincronizado',
        pending: 'Pendiente',
        filters: {
           week: 'Esta Semana',
           works: 'Obras: Todas',
           month: 'Oct'
        }
      },
      reports: {
         title: 'Informes',
         monthly: 'Informe Mensual',
         totalHours: 'Horas Totales',
         overtime: 'Horas Extras',
         debits: 'Faltas/Atrasos',
         bankBalance: 'Saldo Banco',
         metaMatched: 'Meta 100%',
         accumulated: 'Acumulado',
         dailyDetail: 'Detalle Diario',
         exportPdf: 'Exportar PDF'
      },
      profile: {
         title: 'Perfil',
         role: 'Analista de RRHH',
         sections: {
            personal: 'INFO PERSONAL',
            documents: 'DOCUMENTOS',
            settings: 'CONFIGURACIÓN',
            support: 'SOPORTE'
         },
         fields: {
            regId: 'MATRÍCULA',
            department: 'DEPARTAMENTO',
            email: 'CORREO',
            phone: 'TELÉFONO',
            editProfile: 'Editar Perfil',
            changePassword: 'Cambiar Contraseña',
            notifications: 'Configuración de Notificaciones',
            help: 'Centro de Ayuda',
            terms: 'Términos de Uso',
            logout: 'Cerrar Sesión'
         }
      },
      confirmPoint: {
         title: 'Confirmación',
         prompt: 'Registro de',
         date: 'Fecha',
         time: 'Hora',
         location: 'Ubicación',
         locationGrants: 'Permiso de ubicación denegado. El punto se registrará sin ubicación.',
         locationGetting: 'Obteniendo GPS...',
         locationCaptured: 'Capturada',
         locationNotCaptured: 'No Capturada',
         connection: 'Conexión',
         online: 'Online',
         offline: 'Offline',
         confirmButton: 'Confirmar Punto',
         disclaimer: 'Al continuar, acepta que la hora y la ubicación anteriores son verdaderas y se refieren a su jornada laboral en Real Serv.',
         successTitle: '¡Punto Registrado!',
         successMessage: 'Su punto de {{type}} se registró con éxito a las {{time}}.'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0].languageCode ?? 'pt-BR',
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
