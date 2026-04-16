import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSavePassword = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/(auth)/success-reset');
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 }}>
          {/* Header / Back Button */}
          <TouchableOpacity 
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 mb-6"
          >
            <ArrowLeft color="#1E293B" size={20} />
          </TouchableOpacity>

          <Text className="text-center text-text-muted font-bold mb-6">Ponto Eletrônico</Text>

          {/* Titles */}
          <Text className="text-3xl font-bold text-text-main mb-3">Redefinir Senha</Text>
          <Text className="text-text-muted text-base mb-8 leading-6">
            Crie uma nova senha segura para acessar sua conta. Certifique-se de que ela seja difícil de adivinhar.
          </Text>

          {/* Form */}
          <View className="mb-6">
            <View className="mb-4">
              <Input 
                label="Nova Senha"
                placeholder="Digite sua nova senha"
                icon={<Lock color="#94A3B8" size={20} />}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff color="#94A3B8" size={20} /> : <Eye color="#94A3B8" size={20} />}
                  </TouchableOpacity>
                }
              />
            </View>

            <View className="mb-6">
              <Input 
                label="Confirmar Nova Senha"
                placeholder="Confirme sua nova senha"
                icon={<Lock color="#94A3B8" size={20} />}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff color="#94A3B8" size={20} /> : <Eye color="#94A3B8" size={20} />}
                  </TouchableOpacity>
                }
              />
            </View>

            {/* Checklist */}
            <View className="bg-secondary/50 p-4 rounded-xl mb-8">
              <Text className="font-bold text-primary mb-2 text-sm">Requisitos de Segurança:</Text>
              <View className="flex-row items-center mb-1">
                <CheckCircle2 color={password.length >= 8 ? "#10B981" : "#94A3B8"} size={16} />
                <Text className={`ml-2 text-sm ${password.length >= 8 ? 'text-success font-medium' : 'text-text-muted'}`}>Mínimo de 8 caracteres</Text>
              </View>
              <View className="flex-row items-center">
                <CheckCircle2 color={/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? "#10B981" : "#94A3B8"} size={16} />
                <Text className={`ml-2 text-sm ${/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? 'text-success font-medium' : 'text-text-muted'}`}>Pelo menos um número e um símbolo</Text>
              </View>
            </View>
          </View>

          {/* Button */}
          <Button 
            label="Salvar Nova Senha" 
            onPress={handleSavePassword}
            isLoading={isLoading}
            className="w-full"
          />

          {/* Bottom Help */}
          <View className="flex-row justify-center mt-auto pb-10 pt-6">
            <Text className="text-text-muted">Precisa de ajuda? </Text>
            <TouchableOpacity>
              <Text className="text-primary font-bold">Contate o suporte</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
