import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, Building2 } from 'lucide-react-native';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetLink = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/(auth)/reset-password');
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 pt-6"
      >
        {/* Header / Back Button */}
        <TouchableOpacity 
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 mb-6"
        >
          <ArrowLeft color="#1E293B" size={20} />
        </TouchableOpacity>

        {/* Logo Placeholder */}
        <View className="flex-row items-center mb-6">
          <View className="h-8 w-8 bg-primary/10 rounded-lg items-center justify-center mr-3">
            <Building2 color="#f8b133" size={16} />
          </View>
          <Text className="text-text-main font-bold text-lg">Ponto Eletrônico</Text>
        </View>

        {/* Titles */}
        <Text className="text-3xl font-bold text-text-main mb-3">Esqueci minha senha</Text>
        <Text className="text-text-muted text-base mb-8 leading-6">
          Digite seu e-mail para receber um link de recuperação de senha.
        </Text>

        {/* Input */}
        <View className="mb-6">
          <Input 
            label="E-MAIL"
            placeholder="ex: nome@empresa.com"
            icon={<Mail color="#94A3B8" size={20} />}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Button */}
        <Button 
          label="Enviar Link de Recuperação" 
          onPress={handleSendResetLink}
          isLoading={isLoading}
          className="w-full mb-8"
        />

        {/* Bottom Link */}
        <View className="flex-row justify-center mt-auto pb-10">
          <Text className="text-text-muted">Lembrou da senha? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-primary font-bold">Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
