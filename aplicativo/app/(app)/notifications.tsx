import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState('Todas');

  const notifications = [
    {
      id: '1',
      title: 'Ponto em Atraso',
      time: 'Hoje • 08:45',
      message: 'Você ainda não registrou sua entrada hoje (Horário previsto: 08:30).',
      icon: Clock,
      iconColor: '#3B82F6',
      iconBg: isDark ? '#1E3A8A' : '#eff6ff',
      actionLabel: 'Registrar Agora',
      actionPrimary: true
    },
    {
      id: '2',
      title: 'Esquecimento de Saída',
      time: 'Ontem • 18:30',
      message: 'Detectamos que você não registrou sua saída ontem (Horário previsto: 18:00).',
      icon: AlertTriangle,
      iconColor: '#eab308',
      iconBg: isDark ? '#78350F' : '#fef3c7',
      actionLabel: 'Ajustar Ponto',
      actionPrimary: false
    },
    {
      id: '3',
      title: 'Folha de Ponto Aprovada',
      time: '2 dias atrás',
      message: 'Sua folha de ponto do mês de Maio foi validada pelo gestor.',
      icon: CheckCircle2,
      iconColor: isDark ? '#94a3b8' : '#64748B',
      iconBg: isDark ? '#1e293b' : '#f8fafc',
      actionLabel: null,
      actionPrimary: false
    },
    {
      id: '4',
      title: 'Intervalo Excedido',
      time: '3 dias atrás',
      message: 'Seu intervalo de almoço excedeu o limite de 01:00 (Tempo total: 01:15).',
      icon: Clock,
      iconColor: '#3B82F6',
      iconBg: isDark ? '#1E3A8A' : '#eff6ff',
      actionLabel: 'Justificar',
      actionPrimary: false
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: Platform.OS === 'android' ? insets.top + 16 : 0 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-4 pt-4 border-b border-slate-100 dark:border-slate-800">
          <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center mr-2">
                 <ArrowLeft color={isDark ? '#cbd5e1' : '#1e293b'} size={24} />
              </TouchableOpacity>
              <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-xl">Notificações</Text>
          </View>
          <TouchableOpacity>
             <Text className="text-blue-500 font-bold text-sm">Limpar tudo</Text>
          </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 pt-4 border-b border-slate-100 dark:border-slate-800">
          <TouchableOpacity 
             onPress={() => setActiveTab('Todas')}
             className="mr-6 pb-3"
             style={{ borderBottomWidth: activeTab === 'Todas' ? 2 : 0, borderBottomColor: '#3B82F6' }}
          >
              <Text style={{ fontWeight: 'bold', fontSize: 14, color: activeTab === 'Todas' ? '#3B82F6' : (isDark ? '#64748b' : '#94a3b8') }}>
                 Todas
              </Text>
          </TouchableOpacity>
          <TouchableOpacity 
             onPress={() => setActiveTab('NaoLidas')}
             className="pb-3"
             style={{ borderBottomWidth: activeTab === 'NaoLidas' ? 2 : 0, borderBottomColor: '#3B82F6' }}
          >
              <Text style={{ fontWeight: 'bold', fontSize: 14, color: activeTab === 'NaoLidas' ? '#3B82F6' : (isDark ? '#64748b' : '#94a3b8') }}>
                 Não lidas
              </Text>
          </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1" showsVerticalScrollIndicator={false}>
          
          <View className="px-5 pt-2">
              {notifications.map((item, index) => {
                  const Icon = item.icon;
                  return (
                      <TouchableOpacity 
                        key={item.id} 
                        onPress={() => router.push('/(app)/notification-detail')}
                        className="py-5"
                        style={{ borderBottomWidth: index === notifications.length - 1 ? 0 : 1, borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }}
                      >
                          <View className="flex-row items-start mb-3">
                              <View className="w-10 h-10 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: item.iconBg }}>
                                  <Icon color={item.iconColor} size={20} />
                              </View>
                              <View className="flex-1 pt-1">
                                  <View className="flex-row justify-between items-center mb-1">
                                      <Text className="text-slate-800 dark:text-slate-100 font-bold text-base">{item.title}</Text>
                                      <Text className="text-slate-400 dark:text-slate-500 font-medium text-xs">{item.time}</Text>
                                  </View>
                                  <Text className="text-slate-500 dark:text-slate-400 text-[13px] leading-5">{item.message}</Text>
                              </View>
                          </View>
                          
                          {item.actionLabel && (
                              <View className="pl-14 pt-1">
                                  <TouchableOpacity 
                                     onPress={() => item.actionPrimary ? router.push('/(app)/notification-detail') : null}
                                     className="rounded-xl py-3 items-center justify-center"
                                     style={{ backgroundColor: item.actionPrimary ? '#2563eb' : (isDark ? '#1e293b' : '#f8fafc') }}
                                  >
                                      <Text style={{ fontWeight: 'bold', fontSize: 14, color: item.actionPrimary ? '#ffffff' : (isDark ? '#cbd5e1' : '#0f172a') }}>
                                          {item.actionLabel}
                                      </Text>
                                  </TouchableOpacity>
                              </View>
                          )}
                      </TouchableOpacity>
                  );
              })}
          </View>

      </ScrollView>
    </SafeAreaView>
  );
}
