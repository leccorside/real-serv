import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ScanFace, Building2, MapPin, Camera, User } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { API_CONFIG } from '@/constants/api';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

export default function FacialRecognitionScreen() {
  const router = useRouter();
  const { cpf: paramCpf } = useLocalSearchParams<{ cpf: string }>();
  const insets = useSafeAreaInsets();
  const { login, isEnrolled, user: loggedUser } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [status, setStatus] = useState<ScanStatus>(paramCpf ? 'scanning' : 'idle');
  const [cpf, setCpf] = useState(paramCpf || loggedUser?.re || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!permission) {
        requestPermission();
    }
  }, [permission]);

  const handleStartScan = () => {
    const cleanCpf = cpf.replace(/[^\d]/g, '');
    if (cleanCpf.length < 3) { // CPF
      Alert.alert("Atenção", "Por favor, informe seu CPF antes de iniciar o reconhecimento.");
      return;
    }
    setStatus('scanning');
  };

  const processScan = async () => {
    if (!cameraRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Menor qualidade para ser rápido
        base64: true,
        skipProcessing: true
      });

      const formData = new FormData();
      formData.append('foto', photo.base64);
      formData.append('cpf', cpf.replace(/[^\d]/g, ''));

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.FACE_AUTH_URL}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 'ok') {
        setStatus('success');
        setTimeout(() => {
          login({ 
            id: result.usuarioId, 
            re: result.re, 
            name: result.nome, 
            email: '', 
            pessoaId: result.pessoaId, 
            empresaId: result.empresaId 
          }, 'facial');
          router.replace('/(app)/(tabs)/home');
        }, 1500);
      } else {
        setStatus('error');
        Alert.alert("Reconhecimento Falhou", result.message || "Rosto não reconhecido.");
      }
    } catch (error) {
      console.error("Erro na autenticação facial:", error);
      setStatus('error');
      Alert.alert("Erro de Conexão", "Não foi possível conectar ao servidor de biometria.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Gatilho automático quando entrar em modo scanning
  useEffect(() => {
    if (status === 'scanning') {
      const timer = setTimeout(() => {
        processScan();
      }, 2000); // 2 segundos parado para bater o ponto
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!permission || !permission.granted) {
      return (
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Text className="text-center mb-6">Acesso à câmera é necessário para o reconhecimento facial.</Text>
          <Button label="Conceder Permissão" onPress={requestPermission} />
        </View>
      );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 items-center" style={{ paddingTop: Math.max(insets.top, 20) }}>
        {/* Header / Back Button */}
        <View className="w-full flex-row items-center justify-between mb-8">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
          >
            <ArrowLeft color="#1E293B" size={20} />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Building2 color="#1E293B" size={16} />
            <Text className="text-slate-800 font-bold ml-2">Ponto Eletrônico</Text>
          </View>
          <View className="w-10" />
        </View>

        {status === 'idle' ? (
          <View className="w-full items-center">
             <View className="bg-blue-50 p-6 rounded-full mb-6">
                <ScanFace color="#3B82F6" size={48} />
             </View>
             <Text className="text-2xl font-black text-slate-800 text-center mb-2">Entrada por Biometria</Text>
             <Text className="text-slate-500 text-center mb-10 px-4">Para sua segurança, valide seu rosto para acessar o controle de ponto.</Text>
             
             <View className="w-full mb-8">
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                   <User color="#64748B" size={20} className="mr-3" />
                   <TextInput
                      className="flex-1 text-slate-800 font-bold py-1"
                      placeholder="Seu CPF"
                      placeholderTextColor="#94A3B8"
                      value={cpf}
                      onChangeText={setCpf}
                      keyboardType="numeric"
                   />
                </View>
             </View>

             <Button 
                label="Iniciar Reconhecimento" 
                onPress={handleStartScan}
                className="w-full h-16 rounded-2xl"
             />
          </View>
        ) : (
          <>
            {/* Badge */}
            <View className={`px-3 py-1.5 rounded-full mb-8 ${status === 'scanning' ? 'bg-blue-50' : status === 'error' ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <Text className={`font-bold tracking-wider text-xs ${status === 'scanning' ? 'text-blue-600' : status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                {status === 'scanning' ? 'RECONHECIMENTO FACIAL' : status === 'error' ? 'FALHA NA AUTENTICAÇÃO' : 'AUTENTICADO COM SUCESSO'}
              </Text>
            </View>

            {/* Camera Frame */}
            <View className="relative w-72 h-72 mb-8 items-center justify-center">
              <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-3xl z-10" />
              <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-600 rounded-tr-3xl z-10" />
              <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-600 rounded-bl-3xl z-10" />
              <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-3xl z-10" />
              
              <View className="w-64 h-64 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50 relative">
                      <CameraView 
                        ref={cameraRef}
                        style={StyleSheet.absoluteFill}
                        facing="front"
                      />
                      {(status === 'success' || isProcessing) && (
                          <View className="absolute inset-0 bg-emerald-500/20 items-center justify-center">
                              {isProcessing ? <ActivityIndicator color="#10B981" size="large" /> : <ScanFace color="#10B981" size={80} />}
                          </View>
                      )}
                      {status === 'error' && (
                          <View className="absolute inset-0 bg-red-500/20 items-center justify-center">
                              <ScanFace color="#EF4444" size={80} />
                          </View>
                      )}
              </View>

              {status === 'scanning' && !isProcessing && (
                <View className="absolute w-64 h-[2px] bg-blue-500/80 shadow-md transform -translate-y-12 z-20" />
              )}
            </View>

            {/* Instructions */}
            {status === 'scanning' && (
              <View className="items-center">
                <Text className="text-xl font-bold text-slate-800 text-center mb-2">Posicione seu rosto</Text>
                <Text className="text-slate-500 text-center px-4 leading-5 mb-6">
                  Mantenha o rosto dentro da moldura para validação automática.
                </Text>
                <View className="flex-row items-center">
                  <ActivityIndicator color="#3B82F6" className="mr-2" />
                  <Text className="text-slate-500 font-medium">{isProcessing ? 'Verificando no servidor...' : 'Analisando biometria...'}</Text>
                </View>
              </View>
            )}

            {status === 'error' && (
              <View className="items-center">
                <Text className="text-xl font-bold text-slate-800 text-center mb-2">Falha no Reconhecimento</Text>
                <Text className="text-slate-500 text-center px-4 leading-5 mb-8">
                  Não foi possível reconhecer seu rosto. Certifique-se de estar em um local bem iluminado.
                </Text>
                <Button 
                  label="Tentar Novamente" 
                  onPress={() => setStatus('scanning')}
                  className="w-full min-w-[300px] mb-4"
                />
                <Button 
                  label="Entrar com Senha" 
                  variant="outline"
                  onPress={() => router.replace('/(auth)/login')}
                  className="w-full min-w-[300px]"
                />
              </View>
            )}

            {status === 'success' && (
              <View className="items-center">
                <Text className="text-xl font-bold text-slate-800 text-center mb-2">Bem-vindo(a) de volta!</Text>
                <Text className="text-emerald-600 text-center px-4 leading-5 mb-8 font-medium">Reconhecimento concluído com sucesso.</Text>
                <ActivityIndicator color="#10B981" size="large" />
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    circle: {
      width: 250,
      height: 250,
      borderRadius: 125,
      borderWidth: 40,
      borderColor: 'white',
      backgroundColor: 'transparent',
    },
});
