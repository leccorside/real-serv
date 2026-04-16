import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, AlertTriangle, Calendar, Clock, Tag, LogIn, HelpCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function NotificationDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: Platform.OS === 'android' ? insets.top + 16 : 0 }}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-2 pt-4 bg-white dark:bg-slate-900 border-b border-transparent dark:border-slate-800">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center mr-2">
             <ArrowLeft color={isDark ? '#cbd5e1' : '#1e293b'} size={24} />
          </TouchableOpacity>
          <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-lg">Detalhes da Notificação</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-6 pt-8 bg-white dark:bg-slate-900" showsVerticalScrollIndicator={false}>
          
          <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center mb-4">
                  <AlertTriangle color="#3B82F6" size={32} />
              </View>
              <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-2xl mb-3 text-center">Alerta de Atraso</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-[15px] leading-6 text-center px-2">
                  Você ainda não registrou sua entrada. Seu horário previsto era <Text className="font-bold text-slate-700 dark:text-slate-300">08:30</Text>. Por favor registre suas horas para manter os registros precisos.
              </Text>
          </View>

          <Text className="text-slate-500 dark:text-slate-400 font-extrabold text-[11px] uppercase tracking-widest mb-3 ml-2">
              DETALHES DO ALERTA
          </Text>
          
          <View className="bg-slate-50/80 dark:bg-slate-800/40 rounded-3xl p-2 border border-slate-100 dark:border-slate-800 mb-8">
              
              <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center">
                      <Calendar color={isDark ? '#64748b' : '#94a3b8'} size={20} className="mr-3" />
                      <Text className="text-slate-600 dark:text-slate-300 font-bold text-[15px]">Data</Text>
                  </View>
                  <Text className="text-slate-800 dark:text-slate-100 font-bold text-[15px]">24 Out, 2023</Text>
              </View>

              <View className="h-[1px] bg-slate-100 dark:bg-slate-800 mx-4" />

              <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center">
                      <Clock color={isDark ? '#64748b' : '#94a3b8'} size={20} className="mr-3" />
                      <Text className="text-slate-600 dark:text-slate-300 font-bold text-[15px]">Hora do Alerta</Text>
                  </View>
                  <Text className="text-slate-800 dark:text-slate-100 font-bold text-[15px]">09:15</Text>
              </View>

              <View className="h-[1px] bg-slate-100 dark:bg-slate-800 mx-4" />

              <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center">
                      <Tag color={isDark ? '#64748b' : '#94a3b8'} size={20} className="mr-3" />
                      <Text className="text-slate-600 dark:text-slate-300 font-bold text-[15px]">Tipo</Text>
                  </View>
                  <View className="bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-full">
                      <Text className="text-amber-600 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider">PONTO</Text>
                  </View>
              </View>

          </View>

          {/* Action Buttons */}
          <View className="gap-y-4 mb-8">
              <TouchableOpacity className="bg-blue-600 rounded-xl h-[56px] flex-row items-center justify-center shadow-sm shadow-blue-500/30">
                  <LogIn color="#ffffff" size={20} className="mr-2" />
                  <Text className="text-white font-bold text-base">Registrar Agora</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.back()} className="bg-slate-100 dark:bg-slate-800 rounded-xl h-[56px] flex-row items-center justify-center">
                  <Clock color={isDark ? '#cbd5e1' : '#475569'} size={20} className="mr-2" />
                  <Text className="text-slate-700 dark:text-slate-200 font-bold text-base">Lembrar Mais Tarde</Text>
              </TouchableOpacity>
          </View>

          {/* Help Link */}
          <View className="items-center justify-center flex-row">
              <HelpCircle color="#3B82F6" size={16} className="mr-2" />
              <Text className="text-blue-500 font-bold text-sm">Precisa de ajuda? Contate o RH</Text>
          </View>

      </ScrollView>
    </SafeAreaView>
  );
}
