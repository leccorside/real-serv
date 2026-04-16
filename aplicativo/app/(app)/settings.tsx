import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
    ArrowLeft, Bell, TimerReset, Settings as SettingsIcon,
    Lock, ShieldCheck, Fingerprint,
    Globe, Moon, Info, FileText, ExternalLink,
    LogOut, ChevronDown, ChevronRight
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore, Language } from '@/store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { authenticateWithBiometry, checkBiometrySupport } from '@/utils/biometry';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { logout } = useAuthStore();
  const { 
    theme, setTheme, 
    language, setLanguage, 
    isBiometryEnabled, setBiometryEnabled 
  } = useSettingsStore();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Toggles State (kept local for non-persisted ones if any)
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [sysNotificationsEnabled, setSysNotificationsEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Common UI blocks
  const SectionTitle = ({ title }: { title: string }) => (
    <Text className="text-slate-500 dark:text-slate-400 font-extrabold text-[11px] uppercase tracking-widest mb-3 ml-2 mt-6">
      {title}
    </Text>
  );

  const ToggleRow = ({ icon: Icon, title, value, onValueChange, isLast = false }: any) => (
    <View>
      <View className="flex-row items-center justify-between p-4">
        <View className="flex-row items-center flex-1">
          <View className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
            <Icon color="#3B82F6" size={18} />
          </View>
          <Text className="text-slate-800 dark:text-slate-100 font-bold text-[15px]">{title}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#f8b133' }}
          thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
          ios_backgroundColor={isDark ? '#334155' : '#cbd5e1'}
        />
      </View>
      {!isLast && <View className="h-[1px] bg-slate-50 dark:bg-slate-800 mx-4" />}
    </View>
  );

  const ButtonRow = ({ icon: Icon, title, isLast = false, rightElement, onPress, description }: any) => (
    <TouchableOpacity onPress={onPress}>
      <View className="flex-row items-center justify-between p-4">
        <View className="flex-row items-center flex-1">
          <View className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
            <Icon color="#3B82F6" size={18} />
          </View>
          <View>
            <Text className="text-slate-800 dark:text-slate-100 font-bold text-[15px]">{title}</Text>
            {description && <Text className="text-blue-500 font-medium text-[11px]">{description}</Text>}
          </View>
        </View>
        {rightElement || <ChevronRight color={isDark ? '#475569' : '#cbd5e1'} size={20} />}
      </View>
      {!isLast && <View className="h-[1px] bg-slate-50 dark:bg-slate-800 mx-4" />}
    </TouchableOpacity>
  );

  const handleToggleBiometry = async (value: boolean) => {
    if (value) {
      const { hasHardware, isEnrolled, isSupported } = await checkBiometrySupport();
      
      if (!isSupported) {
        alert(t('settings.biometryNotAvailable'));
        return;
      }

      const success = await authenticateWithBiometry(t('settings.biometryPrompt'));

      if (success) {
        setBiometryEnabled(true);
      }
    } else {
      setBiometryEnabled(false);
    }
  };

  const handleToggleDarkMode = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  const cycleLanguage = () => {
    const langs: Language[] = ['pt-BR', 'en', 'es'];
    const currentIndex = langs.indexOf(language);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: Platform.OS === 'android' ? insets.top + 16 : 0 }}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-2 pt-4 bg-slate-50 dark:bg-slate-950">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center mr-2">
             <ArrowLeft color={isDark ? '#f1f5f9' : '#1e293b'} size={24} />
          </TouchableOpacity>
          <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-xl">{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
          

          {/* SEGURANÇA */}
          <SectionTitle title={t('settings.security')} />
          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
              <ButtonRow 
                 icon={Lock} title={t('settings.changePassword')} 
                 onPress={() => router.push('/(app)/change-password')} 
              />
              <ToggleRow 
                 icon={ShieldCheck} title={t('settings.twoFactor')} 
                 value={twoFactorEnabled} onValueChange={setTwoFactorEnabled} 
              />
              <ToggleRow 
                 icon={Fingerprint} title={t('settings.biometry')} 
                 value={isBiometryEnabled} onValueChange={handleToggleBiometry}
                 isLast
              />
          </View>

          {/* PREFERÊNCIAS */}
          <SectionTitle title={t('settings.preferences')} />
          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
              
              <ButtonRow 
                  icon={Globe} 
                  title={t('settings.language')} 
                  description={language === 'pt-BR' ? 'Português (BR)' : language === 'en' ? 'English' : 'Español'}
                  onPress={cycleLanguage}
              />

              <ToggleRow 
                 icon={Moon} title={t('settings.darkMode')} 
                 value={theme === 'dark'} onValueChange={handleToggleDarkMode} 
                 isLast
              />
          </View>

          {/* SOBRE */}
          <SectionTitle title={t('settings.about')} />
          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
              
              <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center flex-1">
                      <View className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
                          <Info color="#3B82F6" size={18} />
                      </View>
                      <Text className="text-slate-800 dark:text-slate-100 font-bold text-[15px]">{t('settings.appVersion')}</Text>
                  </View>
                  <Text className="text-slate-400 dark:text-slate-500 font-medium text-[13px]">2.4.1 (Build 108)</Text>
              </View>

              <View className="h-[1px] bg-slate-50 dark:bg-slate-800 mx-4" />

              <ButtonRow 
                 icon={FileText} title={t('settings.termsOfUse')} 
                 rightElement={<ExternalLink color={isDark ? '#475569' : '#94a3b8'} size={18} />}
                 isLast
              />
          </View>

          {/* Sair da conta (Logout Red) */}
          <View className="mt-8 mb-6 px-4">
             <TouchableOpacity onPress={logout} className="flex-row items-center justify-center py-4 bg-transparent">
                <LogOut color="#ef4444" size={20} style={{ marginRight: 8 }} />
                <Text className="text-red-500 font-bold text-[15px]">{t('settings.logout')}</Text>
             </TouchableOpacity>
          </View>

      </ScrollView>
    </SafeAreaView>
  );
}
