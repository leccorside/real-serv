import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, StyleSheet, Image, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, CheckCircle2, Navigation, Camera, RotateCcw, Check, User, Info, LogOut, Clock } from 'lucide-react-native';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { format } from 'date-fns';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ptBR } from 'date-fns/locale';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { Button } from '@/components/ui/Button';
import { PointType } from '@/types';
import { useTimeTrackingStore } from '@/store/useTimeTrackingStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function ConfirmPointScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: string }>();
  const pointType = type as PointType;
  
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { addRecord } = useTimeTrackingStore();
  const { user, loginMethod } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  const [showCamera, setShowCamera] = useState(false);
  const [tempSelfie, setTempSelfie] = useState<string | null>(null);
  const [tempBase64, setTempBase64] = useState<string | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const { logout } = useAuthStore();

  const currentTime = new Date();

  // Load Network Status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Logout Countdown logic
  useEffect(() => {
    let timer: any;
    if (showLogoutModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (showLogoutModal && countdown === 0) {
      logout();
    }
    return () => clearInterval(timer);
  }, [showLogoutModal, countdown, logout]);

  // A captura de localização detalhada e obstrutiva foi removida daqui,
  // pois será reativada globalmente no tracking background do app.
  useEffect(() => {
    // Apenas garante que não tenhamos lixo se precisar no futuro, mas
    // não bloqueamos a UI mais com promises lentas de GPS.
  }, []);

  const getLabelByType = (type_param?: PointType) => {
    switch(type_param) {
      case 'ENTRADA': return t('registerPoint.types.entrance');
      case 'SAIDA_ALMOCO': return t('registerPoint.types.break');
      case 'RETORNO_ALMOCO': return t('registerPoint.types.return');
      case 'SAIDA': return t('registerPoint.types.exit');
      default: return t('confirmPoint.title');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          skipProcessing: false,
          base64: true, // Habilitado para sincronização robusta
          imageType: 'jpg'
        });
        setTempSelfie(photo.uri);
        // Armazenamos o base64 para uso no registro
        setTempBase64(photo.base64);
      } catch (error) {
        console.error("Failed to take selfie:", error);
      }
    }
  };

  const handleConfirm = () => {
    if (!user) return;

    // Se o login foi por credenciais e ainda não capturou a selfie, abre a câmera
    if (loginMethod === 'credentials' && !capturedSelfie) {
      if (!permission?.granted) {
          requestPermission().then(res => {
              if (res.granted) setShowCamera(true);
          });
      } else {
          setShowCamera(true);
      }
      return;
    }
    
    setIsSaving(true);

    const record = {
      id: uuidv4(),
      userId: user.id || '1',
      type: pointType,
      timestamp: currentTime.toISOString(),
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      } : undefined,
      synced: false,
      photo: capturedBase64 || capturedSelfie || undefined // Prefere base64 string
    };

    // Simulate saving delay
    setTimeout(() => {
      addRecord(record);
      setIsSaving(false);
      setShowLogoutModal(true);
    }, 1500);
  };

  if (showCamera) {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-6" style={{ paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }}>
                <View className="flex-row items-center justify-between mb-8">
                    <TouchableOpacity onPress={() => setShowCamera(false)} className="h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                        <ArrowLeft color="#1E293B" size={24} />
                    </TouchableOpacity>
                    <Text className="text-slate-800 font-bold text-lg">Captura de Foto</Text>
                    <View className="w-10" />
                </View>

                {tempSelfie ? (
                    <View className="flex-1">
                        <Text className="text-slate-800 font-black text-2xl text-center mb-2">A foto ficou boa?</Text>
                        <Text className="text-slate-500 text-center mb-8">Devido ao acesso por contingência, sua foto é obrigatória para este registro.</Text>
                        
                        <View className="flex-1 items-center justify-center mb-8">
                            <View className="w-72 h-72 rounded-3xl overflow-hidden border-4 border-blue-600">
                                <Image source={{ uri: tempSelfie }} className="w-full h-full" resizeMode="cover" />
                            </View>
                        </View>

                        <View className="gap-y-4 mb-4">
                            <TouchableOpacity 
                                onPress={() => {
                                    setCapturedSelfie(tempSelfie);
                                    setCapturedBase64(tempBase64);
                                    setTempSelfie(null);
                                    setTempBase64(null);
                                    setShowCamera(false);
                                }}
                                className="bg-blue-600 flex-row items-center justify-center py-4 rounded-2xl shadow-lg"
                            >
                                <Check color="white" size={20} className="mr-2" />
                                <Text className="text-white font-bold text-base">Ficou boa, confirmar ponto</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => {
                                    setTempSelfie(null);
                                    setTempBase64(null);
                                }}
                                className="bg-slate-100 flex-row items-center justify-center py-4 rounded-2xl"
                            >
                                <RotateCcw color="#64748B" size={20} className="mr-2" />
                                <Text className="text-slate-600 font-bold text-base">Tirar outra foto</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View className="flex-1">
                        <Text className="text-slate-800 font-black text-2xl mb-2">Selfie obrigatória</Text>
                        <Text className="text-slate-500 mb-8 leading-5">Posicione seu rosto de frente para a câmera.</Text>

                        <View className="flex-1 items-center justify-center mb-8">
                            <View className="w-72 h-72 rounded-3xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
                            </View>
                        </View>

                        <View className="bg-amber-50 p-4 rounded-2xl mb-8 flex-row items-center">
                            <Info color="#D97706" size={18} className="mr-3" />
                            <Text className="text-amber-700 text-xs flex-1">Como você entrou via senha, precisamos registrar uma foto deste momento.</Text>
                        </View>

                        <TouchableOpacity 
                            onPress={takePicture}
                            className="bg-blue-600 flex-row items-center justify-center py-4 rounded-2xl shadow-lg mb-4"
                        >
                            <Camera color="white" size={24} className="mr-2" />
                            <Text className="text-white font-bold text-base">Capturar Foto</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 px-6" style={{ paddingTop: Math.max(insets.top, 20) }}>
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
          >
            <ArrowLeft color={isDark ? '#cbd5e1' : '#1E293B'} size={20} />
          </TouchableOpacity>
          <Text className="text-slate-800 dark:text-slate-100 font-bold text-lg">{t('confirmPoint.title')}</Text>
          <View className="w-10" />
        </View>

        {/* Info Card */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          
          <View className="items-center mb-6">
            <View className="bg-orange-50 dark:bg-orange-900/20 h-16 w-16 rounded-full items-center justify-center mb-3">
              <CheckCircle2 color="#f8b133" size={32} />
            </View>
            <Text className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest text-xs mb-1">
              {t('confirmPoint.prompt')}
            </Text>
            <Text className="text-slate-800 dark:text-slate-100 font-bold text-2xl">
              {getLabelByType(pointType)}
            </Text>
          </View>

          <View className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-6">
             <View className="flex-row justify-between items-center mb-3">
               <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('confirmPoint.date')}</Text>
               <Text className="text-slate-800 dark:text-slate-100 font-bold">{format(currentTime, "dd/MM/yyyy")}</Text>
             </View>
             <View className="flex-row justify-between items-center mb-3">
               <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('confirmPoint.time')}</Text>
               <Text className="text-slate-800 dark:text-slate-100 font-bold text-lg">{format(currentTime, "HH:mm")}</Text>
             </View>
             <View className="flex-row justify-between items-start mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
               <View className="flex-row items-center">
                 <View className={`h-2 w-2 rounded-full mr-2 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                 <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('confirmPoint.connection')}</Text>
               </View>
               <Text className={`font-bold text-sm ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                 {isOnline ? t('confirmPoint.online') : t('confirmPoint.offline')}
               </Text>
             </View>
          </View>

          <Button 
            label="Confirmar Ponto" 
            onPress={handleConfirm}
            isLoading={isSaving}
            className="w-full"
          />

        </View>

        <View className="px-6 mt-8">
           <Text className="text-center text-slate-500 dark:text-slate-400 text-xs leading-5">
             {t('confirmPoint.disclaimer')}
           </Text>
        </View>

      </View>
    </SafeAreaView>

    {/* Auto Logout Modal */}
    <Modal
      visible={showLogoutModal}
      transparent={true}
      animationType="fade"
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-white dark:bg-slate-900 w-full rounded-[40px] p-8 items-center shadow-2xl">
          {/* Success Icon Animation Wrapper */}
          <View className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center mb-6 border-4 border-emerald-100 dark:border-emerald-800">
             <CheckCircle2 color="#10B981" size={48} strokeWidth={2.5} />
          </View>

          <Text className="text-slate-800 dark:text-slate-100 font-black text-2xl text-center mb-2">
            Ponto Registrado!
          </Text>
          
          <Text className="text-slate-500 dark:text-slate-400 text-center mb-8 px-2 leading-5">
             {t('confirmPoint.successMessage', { type: getLabelByType(pointType), time: format(currentTime, 'HH:mm') })}
          </Text>

          {/* Timer Box */}
          <View className="bg-slate-50 dark:bg-slate-800/50 w-full rounded-3xl p-6 items-center mb-8 border border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center mb-2">
                 <Clock color={isDark ? '#64748b' : '#94A3B8'} size={16} className="mr-2" />
                 <Text className="text-slate-400 dark:text-slate-500 font-bold text-[11px] uppercase tracking-widest">
                   Logout Automático em
                 </Text>
              </View>
              <Text className="text-blue-600 dark:text-blue-400 font-black text-4xl">
                {countdown}s
              </Text>
              
              {/* Progress Bar Mock */}
              <View className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                  <View 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${(countdown / 15) * 100}%` }}
                  />
              </View>
          </View>

          <TouchableOpacity 
            onPress={() => logout()}
            className="bg-slate-900 dark:bg-blue-600 w-full flex-row items-center justify-center py-5 rounded-2xl shadow-lg shadow-slate-300 dark:shadow-none"
          >
            <LogOut color="white" size={20} className="mr-2" />
            <Text className="text-white font-bold text-base">Deslogar Agora</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </>
);
}
