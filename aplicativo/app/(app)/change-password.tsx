import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, CheckCircle2, Circle, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password validation logic
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%]/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);

  const RequirementItem = ({ met, text }: { met: boolean, text: string }) => (
    <View className="flex-row items-center mb-2">
      {met ? (
        <CheckCircle2 color="#10b981" size={16} className="mr-2" />
      ) : (
        <Circle color={isDark ? '#475569' : '#94a3b8'} size={16} fill={isDark ? '#334155' : '#94a3b8'} className="mr-2 opacity-50" />
      )}
      <Text className="text-slate-600 dark:text-slate-400 text-[13px]">
        {text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: Platform.OS === 'android' ? insets.top + 16 : 0 }}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-2 pt-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center mr-2">
             <ArrowLeft color="#3B82F6" size={24} />
          </TouchableOpacity>
          <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-lg">Alterar Senha</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-6 pt-6">
          
          <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-2xl mb-2">Atualize sua senha</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-5">
            Para garantir a segurança dos seus registros de ponto, escolha uma senha forte e única.
          </Text>

          {/* Form Fields */}
          <View className="gap-y-5 mb-6">
              
              <View>
                  <Text className="text-slate-600 dark:text-slate-400 font-bold text-sm mb-2 ml-1">Senha Atual</Text>
                  <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 h-[52px]">
                      <TextInput 
                          value={currentPassword}
                          onChangeText={setCurrentPassword}
                          secureTextEntry={!showCurrent}
                          className="flex-1 text-slate-800 dark:text-slate-100 font-medium text-[15px] h-full"
                          placeholder="Digite sua senha atual"
                          placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
                      />
                      <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} className="p-2 -mr-2">
                          {showCurrent ? <Eye color="#64748b" size={20} /> : <EyeOff color="#64748b" size={20} />}
                      </TouchableOpacity>
                  </View>
              </View>

              <View>
                  <Text className="text-slate-600 dark:text-slate-400 font-bold text-sm mb-2 ml-1">Nova Senha</Text>
                  <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 h-[52px]">
                      <TextInput 
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showNew}
                          className="flex-1 text-slate-800 dark:text-slate-100 font-medium text-[15px] h-full"
                          placeholder="Crie uma nova senha"
                          placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
                      />
                      <TouchableOpacity onPress={() => setShowNew(!showNew)} className="p-2 -mr-2">
                          {showNew ? <Eye color="#64748b" size={20} /> : <EyeOff color="#64748b" size={20} />}
                      </TouchableOpacity>
                  </View>
              </View>

              <View>
                  <Text className="text-slate-600 dark:text-slate-400 font-bold text-sm mb-2 ml-1">Confirmar Nova Senha</Text>
                  <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 h-[52px]">
                      <TextInput 
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirm}
                          className="flex-1 text-slate-800 dark:text-slate-100 font-medium text-[15px] h-full"
                          placeholder="Repita a nova senha"
                          placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
                      />
                      <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="p-2 -mr-2">
                          {showConfirm ? <Eye color="#64748b" size={20} /> : <EyeOff color="#64748b" size={20} />}
                      </TouchableOpacity>
                  </View>
              </View>

          </View>

          {/* Requirements Box */}
          <View className="bg-slate-100/80 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800 mb-8">
              <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-sm mb-4">Requisitos da senha:</Text>
              <RequirementItem met={hasMinLength} text="Mínimo de 8 caracteres" />
              <RequirementItem met={hasNumber} text="Pelo menos um número" />
              <RequirementItem met={hasSpecial} text="Pelo menos um caractere especial (!@#$%)" />
              <RequirementItem met={hasUpper} text="Uma letra maiúscula" />
          </View>

          {/* Action Buttons */}
          <View className="gap-y-4">
              <TouchableOpacity className="bg-blue-500 rounded-xl h-[56px] flex-row items-center justify-center border border-blue-600 shadow-sm shadow-blue-500/30">
                  <Text className="text-white font-bold text-base">Salvar Nova Senha</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.back()} className="h-[48px] items-center justify-center">
                  <Text className="text-blue-500 font-bold text-base">Cancelar</Text>
              </TouchableOpacity>
          </View>

          {/* Footer Branding */}
          <View className="items-center justify-center flex-row mt-12 opacity-30">
              <Clock color={isDark ? '#475569' : '#cbd5e1'} size={16} fill={isDark ? '#334155' : '#cbd5e1'} className="mr-2" />
              <Text className="text-slate-400 font-bold text-sm">TimeClock Pro</Text>
          </View>

      </ScrollView>
    </SafeAreaView>
  );
}
