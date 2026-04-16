import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Download, FileText, Clock, AlertCircle, ChevronDown, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Generate last 12 months
  const months = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const date = subMonths(startOfMonth(new Date()), i);
      return {
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
        value: format(date, 'yyyy-MM'),
        date
      };
    });
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  // Fake daily data for the List
  const dailyDetails = [
    {
      id: '1', dateStr: '24 Out, Ter', type: 'Jornada normal', totalHours: '08h 03m',
      badge: '+3M EXTRA', isPositive: true, isDebit: false,
      intervals: '08:02 - 12:00 | 13:00 - 17:05'
    },
    {
      id: '2', dateStr: '23 Out, Seg', type: 'Jornada normal', totalHours: '08h 45m',
      badge: '+45M EXTRA', isPositive: true, isDebit: false,
      intervals: '07:55 - 12:05 | 13:00 - 17:35'
    },
    {
      id: '3', dateStr: '20 Out, Sex', type: 'Atraso na entrada', totalHours: '07h 45m',
      badge: '-15M DÉBITO', isPositive: false, isDebit: true,
      intervals: '08:15 - 12:00 | 13:00 - 17:00'
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: Platform.OS === 'android' ? insets.top + 16 : 0 }}>
      {/* Custom Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <View className="w-10" />
          <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-xl">{t('reports.monthly')}</Text>
          <TouchableOpacity className="h-10 w-10 items-center justify-center">
             <Download color={isDark ? '#cbd5e1' : '#1E293B'} size={20} />
          </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Month Selector Component */}
          <View className="px-6 mb-6">
              <TouchableOpacity 
                onPress={() => setIsPickerVisible(true)}
                className="flex-row items-center justify-between bg-white dark:bg-slate-900 rounded-2xl px-5 py-4 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200 dark:shadow-none"
              >
                  <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-3">
                          <Clock color="#3B82F6" size={16} />
                      </View>
                      <Text className="text-slate-800 dark:text-slate-100 font-bold text-base capitalize">
                          {selectedMonth.label}
                      </Text>
                  </View>
                  <ChevronDown color={isDark ? '#475569' : '#94a3b8'} size={20} />
              </TouchableOpacity>
          </View>

          {/* 2x2 Stats Grid */}
          <View className="px-6 mb-8 flex-row flex-wrap justify-between">
              {/* Card 1: Total Horas */}
              <View className="bg-white dark:bg-slate-900 rounded-[20px] p-5 w-[48%] mb-4 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200 dark:shadow-none">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-2">{t('reports.totalHours')}</Text>
                  <Text className="text-slate-800 dark:text-slate-100 font-black text-xl mb-3">164h 30m</Text>
                  <View className="flex-row items-center">
                      <View className="bg-blue-50 dark:bg-blue-900/20 rounded-md px-2 py-1 flex-row items-center">
                         <AlertCircle color="#3B82F6" size={10} style={{ marginRight: 4 }} />
                         <Text className="text-blue-500 dark:text-blue-400 font-bold text-[10px]">{t('reports.metaMatched')}</Text>
                      </View>
                  </View>
              </View>

              {/* Card 2: Horas Extras */}
              <View className="bg-white dark:bg-slate-900 rounded-[20px] p-5 w-[48%] mb-4 border border-emerald-50 dark:border-emerald-900/30 shadow-sm shadow-emerald-100/50 dark:shadow-none">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-2">{t('reports.overtime')}</Text>
                  <Text className="text-emerald-500 font-black text-xl mb-3">+08:45</Text>
                  <View className="flex-row items-center">
                      <AlertCircle color="#10B981" size={12} style={{ marginRight: 4 }} />
                      <Text className="text-emerald-500 font-bold text-xs">+5% este mês</Text>
                  </View>
              </View>

              {/* Card 3: Faltas/Atrasos */}
              <View className="bg-white dark:bg-slate-900 rounded-[20px] p-5 w-[48%] border border-red-50 dark:border-red-900/30 shadow-sm shadow-red-100/50 dark:shadow-none">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-2">{t('reports.debits')}</Text>
                  <Text className="text-slate-800 dark:text-slate-100 font-black text-xl mb-3">-02:15</Text>
                  <View className="flex-row items-center">
                      <AlertCircle color="#EF4444" size={12} style={{ marginRight: 4 }} />
                      <Text className="text-red-500 font-bold text-xs">-2% este mês</Text>
                  </View>
              </View>

              {/* Card 4: Saldo Banco */}
              <View className="bg-white dark:bg-slate-900 rounded-[20px] p-5 w-[48%] border border-blue-50 dark:border-blue-900/30 shadow-sm shadow-blue-100/50 dark:shadow-none">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-2">{t('reports.bankBalance')}</Text>
                  <Text className="text-slate-800 dark:text-slate-100 font-black text-xl mb-3">+15:20</Text>
                  <View className="flex-row items-center">
                      <View className="bg-blue-50 dark:bg-blue-900/20 rounded-md px-2 py-1 flex-row items-center">
                         <FileText color="#3B82F6" size={10} style={{ marginRight: 4 }} />
                         <Text className="text-blue-500 dark:text-blue-400 font-bold text-[10px]">{t('reports.accumulated')}</Text>
                      </View>
                  </View>
              </View>
          </View>

          {/* Daily Breakdown Header */}
          <View className="px-6 mb-4 flex-row items-center justify-between">
              <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-lg">{t('reports.dailyDetail')}</Text>
              <TouchableOpacity className="flex-row items-center">
                  <FileText color={isDark ? '#df9e2d' : '#2563EB'} size={16} style={{ marginRight: 6 }} />
                  <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">{t('reports.exportPdf')}</Text>
              </TouchableOpacity>
          </View>

          {/* Daily Breakdown List */}
          <View className="px-6 gap-y-4">
              {dailyDetails.map((day) => (
                  <View key={day.id} 
                        className="bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-sm shadow-slate-200/50 dark:shadow-none"
                        style={{ borderColor: isDark ? (day.isDebit ? '#7f1d1d' : '#1e293b') : (day.isDebit ? '#fee2e2' : '#f1f5f9') }}
                  >
                      <View className="flex-row justify-between items-start mb-4">
                          <View>
                              <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-base mb-1">{day.dateStr}</Text>
                              <Text style={{ fontWeight: '500', fontSize: 14, color: day.isDebit ? '#f87171' : (isDark ? '#94a3b8' : '#64748b') }}>
                                 {day.type}
                              </Text>
                          </View>
                          <View className="items-end">
                              <Text className="text-slate-800 dark:text-slate-100 font-black text-lg mb-1">{day.totalHours}</Text>
                              <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: day.isPositive ? '#10b981' : '#ef4444' }}>
                                  {day.badge}
                              </Text>
                          </View>
                      </View>

                      <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2">
                          <Clock color={isDark ? '#3B82F6' : '#2563EB'} size={14} className="mr-2" />
                          <Text className="text-slate-600 dark:text-slate-400 font-medium text-xs">{day.intervals}</Text>
                      </View>
                  </View>
              ))}
          </View>
          
      </ScrollView>

      {/* Month Picker Modal */}
      <Modal
        visible={isPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <Pressable 
          onPress={() => setIsPickerVisible(false)}
          className="flex-1 bg-black/50 items-center justify-end"
        >
          <View className="bg-white dark:bg-slate-900 w-full rounded-t-[32px] p-6 pb-12 shadow-2xl">
              <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full self-center mb-6" />
              
              <Text className="text-slate-800 dark:text-slate-100 font-black text-xl mb-6">Selecione o Mês</Text>
              
              <ScrollView showsVerticalScrollIndicator={false} className="max-h-[70%]">
                  <View className="gap-y-2">
                      {months.map((item) => {
                          const isSelected = item.value === selectedMonth.value;
                          return (
                              <TouchableOpacity 
                                  key={item.value}
                                  onPress={() => {
                                      setSelectedMonth(item);
                                      setIsPickerVisible(false);
                                  }}
                                  className={`flex-row items-center justify-between px-5 py-4 rounded-2xl ${isSelected ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800/40'}`}
                              >
                                  <Text className={`font-bold text-base capitalize ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                      {item.label}
                                  </Text>
                                  {isSelected && <Check color="#3B82F6" size={20} />}
                              </TouchableOpacity>
                          );
                      })}
                  </View>
              </ScrollView>

              <TouchableOpacity 
                onPress={() => setIsPickerVisible(false)}
                className="mt-6 bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl items-center"
              >
                  <Text className="text-slate-800 dark:text-slate-100 font-bold text-base">Fechar</Text>
              </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
