import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, ArrowLeft, Clock } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';

export default function SuccessResetScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-6">
        {/* Header / Back Button */}
        <TouchableOpacity 
          onPress={() => router.replace('/(auth)/login')}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 mb-12"
        >
          <ArrowLeft color="#1E293B" size={20} />
        </TouchableOpacity>

        {/* Success Icon */}
        <View className="items-center justify-center mb-8 mt-12">
          <View className="h-24 w-24 bg-success/10 rounded-full items-center justify-center">
            <CheckCircle2 color="#10B981" size={48} />
          </View>
        </View>

        {/* Titles */}
        <Text className="text-3xl font-bold text-text-main text-center mb-4 leading-9">
          Senha Redefinida com Sucesso!
        </Text>
        <Text className="text-text-muted text-center text-base mb-12 leading-6 px-4">
          Sua nova senha foi salva. Agora você já pode acessar sua conta normalmente e continuar registrando seu tempo.
        </Text>

        {/* Button */}
        <Button 
          label="Voltar ao Login" 
          onPress={() => router.replace('/(auth)/login')}
          className="w-full mb-8"
        />

        {/* Reminder Box */}
        <View className="bg-secondary/30 rounded-2xl p-4 flex-row items-center">
          <View className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center mr-3">
            <Clock color="#f8b133" size={20} />
          </View>
          <View className="flex-1">
            <Text className="text-primary font-bold text-xs mb-1 uppercase tracking-wider">Lembrete</Text>
            <Text className="text-text-main text-sm">Não esqueça de bater o ponto hoje!</Text>
          </View>
        </View>

        {/* Bottom Help */}
        <View className="flex-row justify-center mt-auto pb-10">
          <Text className="text-text-muted">Precisa de ajuda? </Text>
          <TouchableOpacity>
            <Text className="text-primary font-bold">Contate o suporte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
