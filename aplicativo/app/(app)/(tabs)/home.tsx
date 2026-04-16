import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Hand, CloudCog, CheckCircle2, LogIn, Coffee, LogOut, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { calculateWorkingTime } from '@/utils/time';

import { useAuthStore } from '@/store/useAuthStore';
import { useTimeTrackingStore } from '@/store/useTimeTrackingStore';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, logout } = useAuthStore();
  const { records: allRecords, getTodayRecords, pendingSyncRecords, isSyncing, simulateSync } = useTimeTrackingStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  const records = getTodayRecords();
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await useTimeTrackingStore.getState().fetchTodayRecords(user.id);
    }
    await simulateSync();
    // Pequeno delay para garantir que o spinner seja visível se a rede for muito rápida
    setTimeout(() => setRefreshing(false), 800);
  }, [user?.id, simulateSync]);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Escutar a troca de rede para Sincronizar offline queue e exibir aviso
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offlineStatus = state.isConnected === false;
      setIsOffline(offlineStatus);
      
      if (!offlineStatus) {
        simulateSync();
      }
    });
    return () => unsubscribe();
  }, []);

  // Atualizar registros ao focar na tela
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        useTimeTrackingStore.getState().fetchTodayRecords(user.id);
      }
    }, [user?.id])
  );

  // Compute times
  const entradaRecord = records.find(r => r.type === 'ENTRADA');
  const saidaAlmocoRecord = records.find(r => r.type === 'SAIDA_ALMOCO');
  const retornoAlmocoRecord = records.find(r => r.type === 'RETORNO_ALMOCO');
  const saidaRecord = records.find(r => r.type === 'SAIDA');
  
  const formatTime = (isoString?: string) => isoString ? format(parseISO(isoString), 'HH:mm') : '--:--';
  
  const entradaFmt = formatTime(entradaRecord?.timestamp);
  const saidaFmt = formatTime(saidaRecord?.timestamp);
  let intervaloFmt = '--:-- - --:--';
  if (saidaAlmocoRecord && retornoAlmocoRecord) {
     intervaloFmt = `${formatTime(saidaAlmocoRecord.timestamp)} - ${formatTime(retornoAlmocoRecord.timestamp)}`;
  } else if (saidaAlmocoRecord) {
     intervaloFmt = `${formatTime(saidaAlmocoRecord.timestamp)} - ...`;
  }

  // Calculate Total Hoje using shared utility
  const { hours: hToday, mins: mToday, totalMinutes: tmToday } = calculateWorkingTime(records, currentTime);
  const totalFmt = tmToday > 0 
    ? `${hToday.toString().padStart(2, '0')}h ${mToday.toString().padStart(2, '0')}m` 
    : '--h --m';

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: Platform.OS === 'android' ? insets.top + 16 : 0 }}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }} 
        className="bg-slate-50 dark:bg-slate-950"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={isDark ? '#3B82F6' : '#2563EB'} 
            colors={['#2563EB']} // Android
          />
        }
      >
        
        {/* Header Bar */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-white dark:bg-slate-950 rounded-b-3xl shadow-sm shadow-slate-200 dark:shadow-none border-b border-slate-100 dark:border-slate-800 z-10 w-full relative h-[90px]">
          <View className="absolute inset-y-0 w-1 bg-transparent" />
          <View className="flex-row items-center flex-1">
            <View className="h-12 w-12 rounded-full border border-primary/20 items-center justify-center bg-blue-50 dark:bg-blue-900/30">
              <Text className="text-blue-500 dark:text-blue-400 font-bold text-lg">{user?.name?.charAt(0) || 'R'}</Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-text-muted dark:text-slate-400 text-xs font-medium">{t('home.welcome')}</Text>
              <Text className="text-text-main dark:text-slate-100 font-extrabold text-base">
                {user?.name || 'Ricardo Oliveira'}
              </Text>
            </View>
          </View>
          {/* Logout Button */}
          <TouchableOpacity 
            onPress={() => {
              logout();
              router.replace('/(auth)/login');
            }} 
            className="h-10 w-10 bg-red-50 dark:bg-red-900/20 rounded-full items-center justify-center border border-red-100 dark:border-red-900/40 ml-2"
          >
            <LogOut color={isDark ? "#EF4444" : "#DC2626"} size={18} />
          </TouchableOpacity>
        </View>

        {/* Sync & Connection Status Overlay */}
        {isOffline && (
           <View className="bg-red-500 flex-row items-center justify-center py-2 px-4 shadow-sm z-20">
             <WifiOff color="#FFFFFF" size={16} style={{ marginRight: 8 }} />
             <Text className="text-white text-xs font-bold">{t('home.offlineWarn')}</Text>
           </View>
        )}
        {!isOffline && isSyncing && (
           <View className="bg-blue-500 flex-row items-center justify-center py-2 px-4 shadow-sm z-20">
             <CloudCog color="#FFFFFF" size={16} style={{ marginRight: 8 }} className="animate-pulse" />
             <Text className="text-white text-xs font-bold">{t('home.syncingWarn', { count: pendingSyncRecords.length })}</Text>
           </View>
        )}
        {!isOffline && !isSyncing && pendingSyncRecords.length === 0 && records.some(r => r.synced) && (
           <View className="bg-emerald-500 flex-row items-center justify-center py-2 px-4 shadow-sm z-20">
             <CheckCircle2 color="#FFFFFF" size={16} style={{ marginRight: 8 }} />
             <Text className="text-white text-xs font-bold">{t('home.syncedWarn')}</Text>
           </View>
        )}

        {/* Central Clock */}
        <View className="items-center justify-center mt-6 mb-4">
          <Text className="text-text-main dark:text-slate-100 font-black text-6xl tracking-tighter" style={{ fontFamily: 'Inter_700Bold' }}>
            {format(currentTime, "HH:mm")}
          </Text>
          <Text className="text-text-muted dark:text-slate-400 font-medium text-base mt-2">
            {format(currentTime, "EEEE, dd 'de' MMMM", { locale: i18n.language === 'en' ? undefined : ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
          </Text>
        </View>

        {/* Grid Stats Card (2x2) */}
        <View className="px-6 mb-6">
          <View className="bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden shadow-sm shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800">
            {/* Top Row */}
            <View className="flex-row border-b border-slate-100 dark:border-slate-800">
              {/* Entrada */}
              <View className="flex-1 p-3 items-center justify-center border-r border-slate-100 dark:border-slate-800">
                <View className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center mb-1">
                  <LogIn color="#94A3B8" size={16} />
                </View>
                <Text className="text-text-muted dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">{t('home.entry')}</Text>
                <Text className="text-text-main dark:text-slate-100 font-black text-lg">{entradaFmt}</Text>
              </View>

              {/* Intervalo */}
              <View className="flex-1 p-3 items-center justify-center">
                <View className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center mb-1">
                  <Coffee color="#94A3B8" size={16} />
                </View>
                <Text className="text-text-muted dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">{t('home.interval')}</Text>
                <Text className="text-text-main dark:text-slate-100 font-black text-[13px] text-center" numberOfLines={1}>{intervaloFmt}</Text>
              </View>
            </View>

            {/* Bottom Row */}
            <View className="flex-row">
              {/* Saída */}
              <View className="flex-1 p-3 items-center justify-center border-r border-slate-100 dark:border-slate-800">
                <View className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center mb-1">
                  <LogOut color="#94A3B8" size={16} />
                </View>
                <Text className="text-text-muted dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">{t('home.exit', { defaultValue: 'SAÍDA' })}</Text>
                <Text className="text-text-main dark:text-slate-100 font-black text-lg">{saidaFmt}</Text>
              </View>

              {/* Total Hoje */}
              <View className="flex-1 p-3 items-center justify-center">
                <View className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center mb-1 shadow-sm shadow-blue-500/10">
                  <Clock color="#2563EB" size={20} />
                </View>
                <Text className="text-text-muted dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">{t('home.totalToday')}</Text>
                <Text className="text-blue-600 dark:text-blue-400 font-black text-lg">{totalFmt}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Big Action Button */}
        <View className="items-center justify-center mb-6 relative h-[200px]">
           {/* Glow Effect Background */}
           <View className="absolute h-[200px] w-[200px] rounded-full bg-blue-50 dark:bg-blue-900/10 opacity-80" style={{ transform: [{ scale: 1.1 }] }} />
           <View className="absolute h-[180px] w-[180px] rounded-full bg-blue-100 dark:bg-blue-900/20 opacity-60" style={{ transform: [{ scale: 1.05 }] }} />
           
           <TouchableOpacity 
             activeOpacity={0.8}
             className="z-10 bg-white dark:bg-slate-900 rounded-full p-2 shadow-xl shadow-blue-500/10"
             onPress={() => router.push('/(app)/register-point')}
           >
             <LinearGradient
               colors={['#2563EB', '#3B82F6', '#60A5FA']}
               start={{ x: 0, y: 0 }}
               end={{ x: 1, y: 1 }}
               style={{ borderRadius: 9999, height: 150, width: 150 }}
               className="items-center justify-center border-4 border-white overflow-hidden"
             >
               <View className="absolute z-10 items-center justify-center">
                 <Hand color="#FFFFFF" size={32} strokeWidth={2.5} className="mb-1" />
                 <Text className="text-white font-extrabold text-base">Registrar Ponto</Text>
               </View>
             </LinearGradient>
           </TouchableOpacity>
        </View>

          {/* Seção de localização removida a pedido do usuário */}

      </ScrollView>
    </SafeAreaView>
  );
}
