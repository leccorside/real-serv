import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
    ArrowLeft, Settings as SettingsIcon, Camera, 
    IdCard, Building2, Mail, Phone, 
    FileBadge, Fingerprint, EyeOff, 
    Edit3, KeyRound, BellRing, ChevronRight,
    HelpCircle, FileText, LogOut
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { logout, user } = useAuthStore();
  const router = useRouter();
  
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: Platform.OS === 'android' ? insets.top + 16 : 0 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
             <ArrowLeft color={isDark ? '#df9e2d' : '#3B82F6'} size={24} />
          </TouchableOpacity>
          <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-xl">{t('profile.title')}</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/settings')} className="h-10 w-10 items-center justify-center">
             <SettingsIcon color={isDark ? '#cbd5e1' : '#1E293B'} size={24} />
          </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1" showsVerticalScrollIndicator={false}>
          
          {/* Avatar Section */}
          <View className="items-center mt-6 mb-8">
              <View className="relative">
                  {/* Outer circle decoration */}
                  <View className="w-[110px] h-[110px] rounded-full border-4 border-white shadow-sm shadow-slate-200 items-center justify-center overflow-hidden bg-slate-200">
                     <Image 
                        source={{ uri: 'https://i.pravatar.cc/300?img=11' }} 
                        className="w-full h-full"
                        resizeMode="cover"
                     />
                  </View>
                  {/* Camera Button */}
                  <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-500 w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-slate-900">
                      <Camera color="#ffffff" size={14} />
                  </TouchableOpacity>
              </View>
              <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-2xl mt-4">{user?.name || 'João Silva'}</Text>
              <Text className="text-blue-500 dark:text-blue-400 font-bold text-sm mt-1">{t('profile.role')}</Text>
          </View>

          {/* PERSONAL INFO */}
          <View className="px-6 mb-8">
              <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs tracking-wider mb-3 ml-2">{t('profile.sections.personal')}</Text>
              <View className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
                  
                  {/* Registration ID */}
                  <View className="flex-row items-center p-3">
                      <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-4">
                          <IdCard color={isDark ? '#60a5fa' : '#3B82F6'} size={20} />
                      </View>
                      <View className="flex-1">
                          <Text className="text-slate-400 dark:text-slate-500 font-medium text-[11px] uppercase tracking-wider mb-0.5">{t('profile.fields.regId')}</Text>
                          <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">12345-678</Text>
                      </View>
                  </View>

                  <View className="h-[1px] bg-slate-50 dark:bg-slate-800 ml-16 mr-4" />

                  {/* Department */}
                  <View className="flex-row items-center p-3">
                      <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-4">
                          <Building2 color={isDark ? '#60a5fa' : '#3B82F6'} size={20} />
                      </View>
                      <View className="flex-1">
                          <Text className="text-slate-400 dark:text-slate-500 font-medium text-[11px] uppercase tracking-wider mb-0.5">{t('profile.fields.department')}</Text>
                          <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">Recursos Humanos</Text>
                      </View>
                  </View>

                  <View className="h-[1px] bg-slate-50 dark:bg-slate-800 ml-16 mr-4" />

                  {/* Email */}
                  <View className="flex-row items-center p-3">
                      <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-4">
                          <Mail color={isDark ? '#60a5fa' : '#3B82F6'} size={20} />
                      </View>
                      <View className="flex-1">
                          <Text className="text-slate-400 dark:text-slate-500 font-medium text-[11px] uppercase tracking-wider mb-0.5">{t('profile.fields.email')}</Text>
                          <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">{user?.email || 'joao.silva@company.com'}</Text>
                      </View>
                  </View>

                  <View className="h-[1px] bg-slate-50 dark:bg-slate-800 ml-16 mr-4" />

                  {/* Phone */}
                  <View className="flex-row items-center p-3">
                      <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-4">
                          <Phone color={isDark ? '#60a5fa' : '#3B82F6'} size={20} />
                      </View>
                      <View className="flex-1">
                          <Text className="text-slate-400 dark:text-slate-500 font-medium text-[11px] uppercase tracking-wider mb-0.5">{t('profile.fields.phone')}</Text>
                          <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">+55 (11) 98765-4321</Text>
                      </View>
                  </View>

              </View>
          </View>

          {/* DOCUMENTS */}
          <View className="px-6 mb-8">
              <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs tracking-wider mb-3 ml-2">{t('profile.sections.documents')}</Text>
              <View className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
                  
                  {/* CPF */}
                  <View className="flex-row items-center p-3">
                      <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-4">
                          <FileBadge color={isDark ? '#60a5fa' : '#3B82F6'} size={20} />
                      </View>
                      <View className="flex-1">
                          <Text className="text-slate-400 dark:text-slate-500 font-medium text-[11px] uppercase tracking-wider mb-0.5">CPF</Text>
                          <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">***.456.789-**</Text>
                      </View>
                      <TouchableOpacity className="p-2">
                          <EyeOff color={isDark ? '#475569' : '#cbd5e1'} size={18} />
                      </TouchableOpacity>
                  </View>

                  <View className="h-[1px] bg-slate-50 dark:bg-slate-800 ml-16 mr-4" />

                  {/* RG */}
                  <View className="flex-row items-center p-3">
                      <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-4">
                          <Fingerprint color={isDark ? '#60a5fa' : '#3B82F6'} size={20} />
                      </View>
                      <View className="flex-1">
                          <Text className="text-slate-400 dark:text-slate-500 font-medium text-[11px] uppercase tracking-wider mb-0.5">RG</Text>
                          <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">12.***.456-*</Text>
                      </View>
                      <TouchableOpacity className="p-2">
                          <EyeOff color={isDark ? '#475569' : '#cbd5e1'} size={18} />
                      </TouchableOpacity>
                  </View>

              </View>
          </View>

          {/* SETTINGS */}
          <View className="px-6 mb-8">
              <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs tracking-wider mb-3 ml-2">{t('profile.sections.settings')}</Text>
              <View className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
                  
                  <TouchableOpacity onPress={() => router.push('/(app)/edit-profile')} className="flex-row items-center p-4">
                      <Edit3 color={isDark ? '#94a3b8' : '#334155'} size={20} style={{ marginRight: 16 }} />
                      <Text className="flex-1 text-slate-800 dark:text-slate-200 font-bold text-[15px]">{t('profile.fields.editProfile')}</Text>
                      <ChevronRight color={isDark ? '#475569' : '#cbd5e1'} size={20} />
                  </TouchableOpacity>

                  <View className="h-[1px] bg-slate-50 dark:bg-slate-800 mx-4" />

                  <TouchableOpacity onPress={() => router.push('/(app)/change-password')} className="flex-row items-center p-4">
                      <KeyRound color={isDark ? '#94a3b8' : '#334155'} size={20} style={{ marginRight: 16 }} />
                      <Text className="flex-1 text-slate-800 dark:text-slate-200 font-bold text-[15px]">{t('profile.fields.changePassword')}</Text>
                      <ChevronRight color={isDark ? '#475569' : '#cbd5e1'} size={20} />
                  </TouchableOpacity>

              </View>
          </View>

          {/* SUPPORT */}
          <View className="px-6 mb-8">
              <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs tracking-wider mb-3 ml-2">{t('profile.sections.support')}</Text>
              <View className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
                  
                  <TouchableOpacity className="flex-row items-center p-4">
                      <HelpCircle color={isDark ? '#94a3b8' : '#334155'} size={20} style={{ marginRight: 16 }} />
                      <Text className="flex-1 text-slate-800 dark:text-slate-200 font-bold text-[15px]">{t('profile.fields.help')}</Text>
                      <ChevronRight color={isDark ? '#475569' : '#cbd5e1'} size={20} />
                  </TouchableOpacity>

                  <View className="h-[1px] bg-slate-50 dark:bg-slate-800 mx-4" />

                  <TouchableOpacity className="flex-row items-center p-4">
                      <FileText color={isDark ? '#94a3b8' : '#334155'} size={20} style={{ marginRight: 16 }} />
                      <Text className="flex-1 text-slate-800 dark:text-slate-200 font-bold text-[15px]">{t('profile.fields.terms')}</Text>
                      <ChevronRight color={isDark ? '#475569' : '#cbd5e1'} size={20} />
                  </TouchableOpacity>

              </View>
          </View>

          {/* Logout Button */}
          <View className="px-6 mt-2 mb-4">
              <TouchableOpacity 
                  onPress={logout}
                  className="bg-red-50/80 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex-row items-center justify-center py-4 rounded-2xl"
              >
                  <LogOut color="#EF4444" size={20} style={{ marginRight: 8 }} />
                  <Text className="text-red-500 font-bold text-[15px]">{t('profile.fields.logout')}</Text>
              </TouchableOpacity>
          </View>

      </ScrollView>
    </SafeAreaView>
  );
}
