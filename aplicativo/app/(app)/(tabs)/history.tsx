import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO, isToday, isYesterday, subMonths, startOfMonth, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, Calendar as CalendarIcon, Clock, ArrowUpRight, ArrowRightToLine, ArrowLeftFromLine, Coffee, MapPin, Activity, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { useTimeTrackingStore } from '@/store/useTimeTrackingStore';
import { TimeRecord } from '@/types';
import { calculateWorkingTime } from '@/utils/time';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { records } = useTimeTrackingStore();

  // Periods generation
  const months = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const date = subMonths(startOfMonth(new Date()), i);
      return {
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
        shortLabel: format(date, 'MMM', { locale: ptBR }),
        value: format(date, 'yyyy-MM'),
        date
      };
    });
  }, []);

  const weeks = useMemo(() => {
    const allWeeks = [
      { label: "Todas as Semanas", value: "all", start: null, end: null }
    ];

    const generatedWeeks = Array.from({ length: 4 }).map((_, i) => {
      const start = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const end = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      
      let label = "";
      if (i === 0) label = "Esta Semana";
      else if (i === 1) label = "Semana Passada";
      else label = `${format(start, 'dd MMM')} - ${format(end, 'dd MMM')}`;

      return {
        label,
        value: (i + 1).toString(),
        start,
        end
      };
    });

    return [...allWeeks, ...generatedWeeks];
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [selectedWeek, setSelectedWeek] = useState(weeks[0]);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [isWeekPickerVisible, setIsWeekPickerVisible] = useState(false);


  // Filter records based on selected month and week
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const recordDate = parseISO(record.timestamp);
      
      // Month Filter
      const monthStart = startOfMonth(selectedMonth.date);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      const isInMonth = recordDate >= monthStart && recordDate < monthEnd;

      if (!isInMonth) return false;

      // Week Filter
      if (selectedWeek.value !== "all" && selectedWeek.start && selectedWeek.end) {
        return recordDate >= selectedWeek.start && recordDate <= selectedWeek.end;
      }

      return true;
    });
  }, [records, selectedMonth, selectedWeek]);

  // Current Period Stats
  const { hours, mins, totalMinutes } = useMemo(() => calculateWorkingTime(filteredRecords), [filteredRecords]);

  const statsPrevious = useMemo(() => {
    const prevMonthDate = subMonths(selectedMonth.date, 1);
    const prevMonthStart = startOfMonth(prevMonthDate);
    const prevMonthEnd = new Date(prevMonthStart);
    prevMonthEnd.setMonth(prevMonthEnd.getMonth() + 1);

    const prevRecords = records.filter(r => {
      const d = parseISO(r.timestamp);
      return d >= prevMonthStart && d < prevMonthEnd;
    });

    return calculateWorkingTime(prevRecords);
  }, [records, selectedMonth]);

  const percentageChange = useMemo(() => {
    if (statsPrevious.totalMinutes === 0) return 0;
    return Math.round(((totalMinutes - statsPrevious.totalMinutes) / statsPrevious.totalMinutes) * 100);
  }, [totalMinutes, statsPrevious]);
  
  // Group record by Date string (YYYY-MM-DD)
  const groupedRecords = filteredRecords.reduce((acc, record) => {
      const dateKey = record.timestamp.split('T')[0];
      if (!acc[dateKey]) {
          acc[dateKey] = [];
      }
      acc[dateKey].push(record);
      return acc;
  }, {} as Record<string, TimeRecord[]>);

  // Convert to array and sort by date descending
  const historyData = Object.keys(groupedRecords)
      .map(date => ({
          dateString: date,
          parsedDate: parseISO(date),
          records: groupedRecords[date].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }))
      .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

  // Helper map for icons and colors
  const typeConfig = {
      ENTRADA: { label: t('registerPoint.types.entrance'), icon: ArrowRightToLine, iconColor: '#10B981', iconBg: isDark ? '#14532D' : '#D1FAE5' },
      SAIDA_ALMOCO: { label: t('registerPoint.types.break'), icon: Coffee, iconColor: '#3B82F6', iconBg: isDark ? '#1E3A8A' : '#DBEAFE' },
      RETORNO_ALMOCO: { label: t('registerPoint.types.return'), icon: Activity, iconColor: '#F59E0B', iconBg: isDark ? '#78350F' : '#FEF3C7' },
      SAIDA: { label: t('registerPoint.types.exit'), icon: ArrowLeftFromLine, iconColor: '#EF4444', iconBg: isDark ? '#7F1D1D' : '#FEE2E2' },
  };

  const formatHeaderDate = (date: Date) => {
    const locale = i18n.language === 'en' ? undefined : ptBR;
    if (isToday(date)) return `${t('history.today')}, ${format(date, 'dd MMM', { locale }).toUpperCase()}`;
    if (isYesterday(date)) return `${t('history.yesterday')}, ${format(date, 'dd MMM', { locale }).toUpperCase()}`;
    return format(date, 'EEEE, dd MMM', { locale }).toUpperCase();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: Platform.OS === 'android' ? insets.top + 16 : 0 }}>
      {/* Header NavBar */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
        <View className="flex-row items-center">
            <Clock color={isDark ? '#df9e2d' : '#2563EB'} size={24} style={{ marginRight: 12 }} />
            <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-2xl">{t('history.title')}</Text>
        </View>
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200 dark:shadow-none">
           <CalendarIcon color={isDark ? '#cbd5e1' : '#64748B'} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1" showsVerticalScrollIndicator={false}>
          
          {/* Main Card Total Hours */}
          <View className="px-6 mb-6">
            <View className="bg-blue-50/80 dark:bg-blue-900/10 rounded-[24px] p-6 border border-blue-100 dark:border-blue-900/30">
                <Text className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">{t('history.totalMonth')}</Text>
                
                <View className="flex-row items-end justify-between">
                    <View>
                        <Text className="text-slate-800 dark:text-slate-100 font-black text-4xl mb-2">{hours}h {mins}m</Text>
                        <View className="flex-row items-center">
                            <ArrowUpRight color={percentageChange >= 0 ? "#10B981" : "#EF4444"} size={16} style={{ marginRight: 4, transform: [{ rotate: percentageChange >= 0 ? '0deg' : '90deg' }] }} />
                            <Text className={`${percentageChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} font-bold text-xs`}>
                              {Math.abs(percentageChange)}% {t('history.comparedLast', { percent: '' }).replace('{{percent}}%', '').trim()}
                            </Text>
                        </View>
                    </View>

                    {/* Fake Chart Bars */}
                    <View className="flex-row items-end h-16 w-32 justify-between">
                        <View className="w-4 bg-blue-300 rounded-t-sm h-6 opacity-60" />
                        <View className="w-4 bg-blue-300 rounded-t-sm h-10 opacity-60" />
                        <View className="w-4 bg-blue-400 rounded-t-sm h-8 opacity-80" />
                        <View className="w-4 bg-blue-400 rounded-t-sm h-14 opacity-80" />
                        <View className="w-4 bg-blue-500 rounded-t-sm h-16" />
                    </View>
                </View>
            </View>
          </View>

          {/* Filtering Chips */}
          <View className="px-6 mb-8 flex-row items-center gap-x-3">
             <TouchableOpacity 
                onPress={() => setIsWeekPickerVisible(true)}
                className="bg-blue-600 dark:bg-blue-700 rounded-full px-4 py-2 flex-row items-center shadow-sm shadow-blue-500/30"
             >
                 <Text className="text-white font-bold text-sm mr-2">{selectedWeek.label}</Text>
                 <ChevronDown color="#FFFFFF" size={16} />
             </TouchableOpacity>
  
             <TouchableOpacity 
                onPress={() => setIsMonthPickerVisible(true)}
                className="bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 flex-row items-center"
             >
                 <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm mr-1 capitalize">{selectedMonth.shortLabel}</Text>
                 <ChevronDown color={isDark ? '#64748b' : '#94A3B8'} size={16} />
             </TouchableOpacity>
          </View>

          {/* History List */}
          <View className="px-6">
            {historyData.length === 0 ? (
                <View className="items-center justify-center py-10 opacity-60">
                    <CalendarIcon color={isDark ? '#475569' : '#94A3B8'} size={48} style={{ marginBottom: 16 }} />
                    <Text className="text-slate-500 dark:text-slate-400 font-medium">{t('history.empty')}</Text>
                </View>
            ) : (
                historyData.map((dayGroup, index) => (
                    <View key={index} className="mb-8">
                        <Text className="text-slate-400 dark:text-slate-500 font-extrabold text-[11px] mb-4 uppercase tracking-widest pl-1">
                           {formatHeaderDate(dayGroup.parsedDate)}
                        </Text>

                        <View className="gap-y-3">
                            {dayGroup.records.map((record) => {
                                const config = typeConfig[record.type as keyof typeof typeConfig] || typeConfig.ENTRADA;
                                const Icon = config.icon;
                                
                                return (
                                    <View key={`${record.id}-${record.type}-${index}`} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-50 dark:border-slate-800 shadow-slate-200 dark:shadow-none">
                                        <View className="flex-row items-center mb-3">
                                            <View className="h-10 w-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: config.iconBg }}>
                                                <Icon color={config.iconColor} size={20} />
                                            </View>
                                            
                                            <View className="flex-1">
                                                <Text className="text-slate-800 dark:text-slate-100 font-bold text-[15px] mb-0.5">{config.label}</Text>
                                                <Text className="text-slate-500 dark:text-slate-400 font-medium text-[13px]">{format(parseISO(record.timestamp), "HH:mm")}</Text>
                                            </View>

                                            <View className="items-end">
                                                <View className="rounded-md px-2 py-0.5 mb-1" style={{ backgroundColor: config.iconBg }}>
                                                    <Text style={{ color: config.iconColor }} className="text-[10px] font-bold uppercase tracking-wide">
                                                        {record.synced ? t('history.synced') : t('history.pending')}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        
                                        {/* Optional location info inside the card */}
                                        {record.location && (
                                           <View className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 flex-row items-center mt-1 border border-slate-100 dark:border-slate-800">
                                              <MapPin color={isDark ? '#64748b' : '#94A3B8'} size={12} style={{ marginRight: 8 }} />
                                              <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium" numberOfLines={1}>
                                                  {record.location.latitude.toFixed(4)}, {record.location.longitude.toFixed(4)}
                                              </Text>
                                           </View>
                                        )}
                                    </View>
                                )
                            })}
                        </View>
                    </View>
                ))
            )}
          </View>
          
      </ScrollView>

      {/* Week Picker Modal */}
      <Modal
        visible={isWeekPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsWeekPickerVisible(false)}
      >
        <Pressable 
          onPress={() => setIsWeekPickerVisible(false)}
          className="flex-1 bg-black/50 items-center justify-end"
        >
          <View className="bg-white dark:bg-slate-900 w-full rounded-t-[32px] p-6 pb-12 shadow-2xl">
              <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full self-center mb-6" />
              <Text className="text-slate-800 dark:text-slate-100 font-black text-xl mb-6">Selecione a Semana</Text>
              <View className="gap-y-2">
                  {weeks.map((item) => {
                      const isSelected = item.value === selectedWeek.value;
                      return (
                          <TouchableOpacity 
                              key={item.value}
                              onPress={() => {
                                  setSelectedWeek(item);
                                  setIsWeekPickerVisible(false);
                              }}
                              className={`flex-row items-center justify-between px-5 py-4 rounded-2xl ${isSelected ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800/40'}`}
                          >
                              <View>
                                  <Text className={`font-bold text-base ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                      {item.label}
                                  </Text>
                                  {item.value !== "0" && item.value !== "1" && (
                                     <Text className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
                                         Regulamento de ponto semanal
                                     </Text>
                                  )}
                              </View>
                              {isSelected && <Check color="#3B82F6" size={20} />}
                          </TouchableOpacity>
                      );
                  })}
              </View>
          </View>
        </Pressable>
      </Modal>

      {/* Month Picker Modal */}
      <Modal
        visible={isMonthPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMonthPickerVisible(false)}
      >
        <Pressable 
          onPress={() => setIsMonthPickerVisible(false)}
          className="flex-1 bg-black/50 items-center justify-end"
        >
          <View className="bg-white dark:bg-slate-900 w-full rounded-t-[32px] p-6 pb-12 shadow-2xl">
              <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full self-center mb-6" />
              <Text className="text-slate-800 dark:text-slate-100 font-black text-xl mb-6">Selecione o Mês</Text>
              <ScrollView showsVerticalScrollIndicator={false} className="max-h-[350px]">
                  <View className="gap-y-2">
                      {months.map((item) => {
                          const isSelected = item.value === selectedMonth.value;
                          return (
                              <TouchableOpacity 
                                  key={item.value}
                                  onPress={() => {
                                      setSelectedMonth(item);
                                      setIsMonthPickerVisible(false);
                                  }}
                                  className={`flex-row items-center justify-between px-5 py-4 rounded-2xl ${isSelected ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800/40'}`}
                              >
                                  <Text className={`font-bold text-base capitalize ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                      {item.label}
                                  </Text>
                                  {isSelected && <Check color="#3B82F6" size={20} />}
                              </TouchableOpacity>
                          );
                      })}
                  </View>
              </ScrollView>
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}
