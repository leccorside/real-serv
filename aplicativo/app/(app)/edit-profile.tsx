import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Platform, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, User, Mail, Phone, MapPin, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuthStore();

  const [name, setName] = useState(user?.name || 'Ricardo Oliveira dos Santos');
  const [email, setEmail] = useState(user?.email || 'ricardo.santos@empresa.com.br');
  const [phone, setPhone] = useState('(11) 98765-4321');
  const [address, setAddress] = useState('Av. Paulista, 1000 - Bela Vista, São P...');

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: Platform.OS === 'android' ? insets.top + 16 : 0 }}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-2 pt-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center mr-2">
             <ArrowLeft color="#3B82F6" size={24} />
          </TouchableOpacity>
          <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-lg">Editar Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-6">
          
          {/* Avatar Section */}
          <View className="items-center mt-8 mb-8">
              <View className="relative">
                  <View className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-sm shadow-slate-200 dark:shadow-none items-center justify-center overflow-hidden bg-slate-200 dark:bg-slate-800">
                     <Image 
                        source={{ uri: 'https://i.pravatar.cc/300?img=11' }} 
                        className="w-full h-full"
                        resizeMode="cover"
                     />
                  </View>
                  <TouchableOpacity className="absolute bottom-1 right-1 bg-blue-500 w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-slate-800">
                      <Camera color="#ffffff" size={14} />
                  </TouchableOpacity>
              </View>
              <TouchableOpacity className="mt-4">
                 <Text className="text-blue-500 font-bold text-sm">Alterar Foto</Text>
              </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="gap-y-5">
              
              <View>
                  <Text className="text-slate-600 dark:text-slate-400 font-bold text-sm mb-2 ml-1">Nome Completo</Text>
                  <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 h-[52px]">
                      <User color="#94A3B8" size={20} className="mr-3" />
                      <TextInput 
                          value={name}
                          onChangeText={setName}
                          className="flex-1 text-slate-800 dark:text-slate-100 font-medium text-[15px] h-full"
                          placeholderTextColor="#94A3B8"
                      />
                  </View>
              </View>

              <View>
                  <Text className="text-slate-600 dark:text-slate-400 font-bold text-sm mb-2 ml-1">E-mail</Text>
                  <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 h-[52px]">
                      <Mail color="#94A3B8" size={20} className="mr-3" />
                      <TextInput 
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          className="flex-1 text-slate-800 dark:text-slate-100 font-medium text-[15px] h-full"
                          placeholderTextColor="#94A3B8"
                      />
                  </View>
              </View>

              <View>
                  <Text className="text-slate-600 dark:text-slate-400 font-bold text-sm mb-2 ml-1">Telefone</Text>
                  <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 h-[52px]">
                      <Phone color="#94A3B8" size={20} className="mr-3" />
                      <TextInput 
                          value={phone}
                          onChangeText={setPhone}
                          keyboardType="phone-pad"
                          className="flex-1 text-slate-800 dark:text-slate-100 font-medium text-[15px] h-full"
                          placeholderTextColor="#94A3B8"
                      />
                  </View>
              </View>

              <View>
                  <Text className="text-slate-600 dark:text-slate-400 font-bold text-sm mb-2 ml-1">Endereço</Text>
                  <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 h-[52px]">
                      <MapPin color="#94A3B8" size={20} className="mr-3" />
                      <TextInput 
                          value={address}
                          onChangeText={setAddress}
                          className="flex-1 text-slate-800 dark:text-slate-100 font-medium text-[15px] h-full"
                          placeholderTextColor="#94A3B8"
                      />
                  </View>
              </View>

          </View>

          {/* Action Buttons */}
          <View className="mt-8 gap-y-4">
              <TouchableOpacity className="bg-blue-500 rounded-xl h-[56px] flex-row items-center justify-center border border-blue-600 shadow-sm shadow-blue-500/30">
                  <Save color="#ffffff" size={20} className="mr-2" />
                  <Text className="text-white font-bold text-base">Salvar Alterações</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.back()} className="h-[48px] items-center justify-center">
                  <Text className="text-slate-500 dark:text-slate-400 font-medium text-base">Cancelar</Text>
              </TouchableOpacity>
          </View>

      </ScrollView>
    </SafeAreaView>
  );
}
