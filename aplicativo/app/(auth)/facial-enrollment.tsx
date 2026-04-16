import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, RotateCcw, Check, X, Info, User, ChevronRight, Glasses } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { API_CONFIG } from '@/constants/api';

type EnrollmentStep = {
  id: number;
  title: string;
  instruction: string;
  icon: any;
  isOptional?: boolean;
};

const steps: EnrollmentStep[] = [
  { id: 1, title: 'Passo 1 de 6', instruction: 'Posicione seu rosto de frente e remova os óculos', icon: User },
  { id: 2, title: 'Passo 2 de 6', instruction: 'Vire o rosto levemente para a direita', icon: User },
  { id: 3, title: 'Passo 3 de 6', instruction: 'Vire o rosto levemente para a esquerda', icon: User },
  { id: 4, title: 'Passo 4 de 6', instruction: 'Incline o rosto levemente para cima', icon: User },
  { id: 5, title: 'Passo 5 de 6', instruction: 'Incline o rosto levemente para baixo', icon: User },
  { id: 6, title: 'Passo 6 de 6', instruction: 'Posicione seu rosto de frente (com óculos, se usar)', icon: Glasses, isOptional: true },
];

export default function FacialEnrollmentScreen() {
  const router = useRouter();
  const { cpf: paramCpf } = useLocalSearchParams<{ cpf: string }>();
  const insets = useSafeAreaInsets();
  const { setEnrolled, user: loggedUser } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  
  const cameraRef = useRef<any>(null);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (!permission) {
        requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#3B82F6" /></View>;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center mb-6 text-slate-600">Precisamos de permissão para usar a câmera.</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-blue-600 px-8 py-3 rounded-full">
          <Text className="text-white font-bold">Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          skipProcessing: false,
          imageType: 'jpg'
        });
        setTempImage(photo.uri);
      } catch (error) {
        console.error("Failed to take picture:", error);
      }
    }
  };

  const confirmPhoto = () => {
    if (tempImage) {
      const newImages = [...capturedImages];
      newImages[currentStepIndex] = tempImage;
      setCapturedImages(newImages);
      setTempImage(null);
      
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        finishEnrollment(newImages);
      }
    }
  };

  const skipStep = () => {
    if (currentStep.isOptional) {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            finishEnrollment(capturedImages);
        }
    }
  };

  const finishEnrollment = async (finalImages: string[] = capturedImages) => {
    setIsFinishing(true);
    
    try {
      const { user } = useAuthStore.getState();
      const identificador = paramCpf || user?.re || ''; 
      
      const formData = new FormData();
      if (user?.pessoaId) formData.append('pessoaId', user.pessoaId.toString());
      if (user?.empresaId) formData.append('empresaId', user.empresaId.toString());
      formData.append('cpf', identificador); 

      // Adiciona cada uma das fotos capturadas
      finalImages.forEach((uri, index) => {
        if (uri) {
          formData.append(`foto${index}`, {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: `face_${index}.jpg`,
            type: 'image/jpeg'
          } as any);
        }
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.BIO_URL}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      
      if (result.status === 'ok') {
        setEnrolled(true);
        Alert.alert("Sucesso", "Cadastro facial concluído com sucesso!", [
          { text: "Continuar", onPress: () => router.replace('/(app)/(tabs)/home') }
        ]);
      } else {
        Alert.alert("Erro no Cadastro", result.message || "Não foi possível salvar sua biometria. Tente novamente.");
        setCurrentStepIndex(0);
        setCapturedImages([]);
      }
    } catch (error) {
      console.error("Erro no upload da biometria:", error);
      Alert.alert("Erro de Conexão", "Não foi possível conectar ao servidor. Verifique sua internet.");
    } finally {
      setIsFinishing(false);
    }
  };

  const StepProgress = () => (
    <View className="flex-row items-center justify-center gap-x-2 mb-6">
      {steps.map((_, index) => (
        <View 
          key={index} 
          className={`h-1.5 rounded-full ${index <= currentStepIndex ? 'bg-blue-600 w-8' : 'bg-slate-200 w-4'}`} 
        />
      ))}
    </View>
  );

  if (isFinishing) {
    return (
        <View className="flex-1 items-center justify-center bg-white px-6" style={{ paddingTop: Math.max(insets.top, 20) }}>
            <ActivityIndicator size="large" color="#3B82F6" className="mb-4" />
            <Text className="text-slate-800 font-bold text-xl mb-2">Processando biometria facial...</Text>
            <Text className="text-slate-500 text-center">Aguarde enquanto validamos sua identidade para controle de ponto.</Text>
            
            <View className="w-full h-2 bg-slate-100 rounded-full mt-8 overflow-hidden">
                <View className="h-full bg-blue-600 w-3/4" />
            </View>
            <Text className="text-blue-600 font-bold mt-2">Sincronizando com o servidor... 95%</Text>
        </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6" style={{ paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-50">
            <ArrowLeft color="#1E293B" size={24} />
          </TouchableOpacity>
          <Text className="text-slate-800 font-bold text-lg">Registro Facial</Text>
          <View className="w-10" />
        </View>

        {tempImage ? (
          /* PREVIEW MODE */
          <View className="flex-1">
            <StepProgress />
            <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest text-center mb-1">Passo {currentStepIndex + 1} de 6</Text>
            <Text className="text-slate-800 font-black text-2xl text-center mb-8">A foto ficou boa?</Text>
            
            <View className="flex-1 items-center justify-center mb-8">
                <View className="w-72 h-72 rounded-full overflow-hidden border-4 border-blue-600 shadow-xl">
                    <Image source={{ uri: tempImage }} className="w-full h-full" resizeMode="cover" />
                </View>
            </View>

            <View className="gap-y-4 mb-4">
                <TouchableOpacity 
                    onPress={confirmPhoto}
                    className="bg-blue-600 flex-row items-center justify-center py-4 rounded-2xl shadow-lg border-b-4 border-blue-800"
                >
                    <Check color="white" size={20} className="mr-2" />
                    <Text className="text-white font-bold text-base">Ficou boa, prosseguir</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => setTempImage(null)}
                    className="bg-slate-100 flex-row items-center justify-center py-4 rounded-2xl"
                >
                    <RotateCcw color="#64748B" size={20} className="mr-2" />
                    <Text className="text-slate-600 font-bold text-base">Capturar uma nova foto</Text>
                </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* CAMERA MODE */
          <View className="flex-1">
            <StepProgress />
            <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">{currentStep.title}</Text>
            <Text className="text-slate-800 font-black text-2xl mb-2">{currentStep.instruction}</Text>
            <Text className="text-slate-500 mb-8 leading-5">Garante que seu rosto esteja bem iluminado e visível dentro do círculo.</Text>

            <View className="flex-1 items-center justify-center mb-8">
               <View className="w-72 h-72 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 relative">
                  <CameraView 
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="front"
                  />
                  {/* Circle Overlay */}
                  <View style={styles.overlay} className="opacity-40">
                    <View style={styles.circle} />
                  </View>
               </View>
               
               <View className="mt-4 flex-row items-center bg-blue-50 px-4 py-1.5 rounded-full">
                  <View className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                  <Text className="text-blue-600 font-bold text-[10px] uppercase tracking-wider">Câmera Ativa</Text>
               </View>
            </View>

            <View className="bg-slate-50 p-4 rounded-2xl mb-8 flex-row items-center">
                <Info color="#3B82F6" size={18} className="mr-3" />
                <Text className="text-slate-500 text-xs flex-1">Evite fundos com muitos detalhes ou luzes fortes atrás de você.</Text>
            </View>

            <View className="flex-row items-center gap-x-4 mb-4">
                <TouchableOpacity 
                    onPress={takePicture}
                    className="flex-1 bg-blue-600 flex-row items-center justify-center py-4 rounded-2xl shadow-lg border-b-4 border-blue-800"
                >
                    <Camera color="white" size={24} className="mr-2" />
                    <Text className="text-white font-bold text-base">Capturar</Text>
                </TouchableOpacity>

                {currentStep.isOptional && (
                    <TouchableOpacity 
                        onPress={skipStep}
                        className="bg-slate-100 flex-row items-center justify-center py-4 px-6 rounded-2xl"
                    >
                        <Text className="text-slate-600 font-bold">Pular</Text>
                    </TouchableOpacity>
                )}
            </View>
          </View>
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
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 60,
    borderColor: 'white',
    backgroundColor: 'transparent',
  },
});
