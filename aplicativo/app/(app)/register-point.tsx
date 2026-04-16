import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, LogIn, Coffee, LogOut, RotateCcw, Info } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PointType } from '@/types';
import { useTimeTrackingStore } from '@/store/useTimeTrackingStore';

type PointOption = {
  id: PointType;
  title: string;
  icon: React.ReactNode;
  bgClass: string;
  circleClass: string;
  textClass: string;
};

const pointOptions: PointOption[] = [
  {
    id: 'ENTRADA',
    title: 'Entrance',
    icon: <LogIn color="#059669" size={36} />,
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    circleClass: 'bg-emerald-100/60 dark:bg-emerald-800/30',
    textClass: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'SAIDA_ALMOCO',
    title: 'Break',
    icon: <Coffee color="#2563EB" size={36} />,
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    circleClass: 'bg-blue-100/60 dark:bg-blue-800/30',
    textClass: 'text-blue-700 dark:text-blue-400',
  },
  {
    id: 'RETORNO_ALMOCO',
    title: 'Return',
    icon: <RotateCcw color="#D97706" size={36} />,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    circleClass: 'bg-amber-100/50 dark:bg-amber-800/30',
    textClass: 'text-amber-700 dark:text-amber-400',
  },
  {
    id: 'SAIDA',
    title: 'Exit',
    icon: <LogOut color="#DC2626" size={36} />,
    bgClass: 'bg-rose-50 dark:bg-rose-900/20',
    circleClass: 'bg-rose-100/60 dark:bg-rose-800/30',
    textClass: 'text-rose-700 dark:text-rose-400',
  },
];

export default function RegisterPointScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentTime, setCurrentTime] = useState(new Date());

  const { records: allRecords, getTodayRecords } = useTimeTrackingStore();
  const todayRecords = getTodayRecords();

  const getRecordForType = (type: PointType) => {
    return todayRecords.find((r) => r.type === type);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectPoint = (type: PointType) => {
    router.push(`/(app)/confirm-point?type=${type}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 pt-8">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
          >
            <ArrowLeft color={isDark ? '#cbd5e1' : '#1E293B'} size={20} />
          </TouchableOpacity>

          <Text className="text-text-main dark:text-slate-100 font-bold text-lg">
            {t('registerPoint.title')}
          </Text>

          <View className="w-10" />
        </View>

        {/* Current Time Resumo */}
        <View className="items-center mb-8 bg-white dark:bg-slate-900 rounded-[32px] py-10 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200 dark:shadow-none">
          <Text className="text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-widest text-[13px]">
            {format(currentTime, "EEEE, dd MMM", {
              locale: i18n.language === 'en' ? undefined : ptBR,
            })}
          </Text>

          <Text className="text-slate-800 dark:text-slate-100 font-black text-6xl tracking-tighter mb-4">
            {format(currentTime, 'HH:mm')}
          </Text>

          <View className="flex-row items-center bg-orange-50 dark:bg-orange-900/20 px-4 py-1.5 rounded-full">
            <Info color="#F59E0B" size={14} style={{ marginRight: 6 }} />
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {t('registerPoint.selectPrompt')}
            </Text>
          </View>
        </View>

        {/* Options Grid */}
        <View className="flex-row flex-wrap justify-between">
          {pointOptions.map((option) => {
            const existingRecord = getRecordForType(option.id);
            const isDisabled = !!existingRecord;

            return (
              <TouchableOpacity
                key={option.id}
                disabled={isDisabled}
                onPress={() => handleSelectPoint(option.id)}
                className={`w-[48%] h-[170px] rounded-[36px] mb-4 px-3 py-5 flex items-center justify-center border-2 border-white shadow-sm shadow-slate-200 dark:shadow-none ${option.bgClass} ${
                  isDisabled ? 'opacity-60' : 'active:scale-95'
                }`}
              >
                <View
                  className={`h-20 w-20 rounded-full items-center justify-center mb-4 ${option.circleClass}`}
                >
                  {option.icon}
                </View>

                <Text
                  className={`font-black text-[11px] tracking-widest text-center uppercase ${option.textClass}`}
                >
                  {t(
                    `registerPoint.types.${
                      option.id === 'ENTRADA'
                        ? 'entrance'
                        : option.id === 'SAIDA_ALMOCO'
                        ? 'break'
                        : option.id === 'RETORNO_ALMOCO'
                        ? 'return'
                        : 'exit'
                    }`
                  )}
                </Text>

                {existingRecord && (
                  <Text className={`mt-2 font-bold text-base ${option.textClass}`}>
                    {format(parseISO(existingRecord.timestamp), 'HH:mm')}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}