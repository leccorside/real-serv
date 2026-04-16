import React, { useState } from 'react';
import 'react-native-get-random-values';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, Image, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ScanFace, Building2, UserPlus, LogIn, X, User, WifiOff, CheckCircle2, Navigation, Clock, LogOut, Coffee, RotateCcw, Camera, Info } from 'lucide-react-native';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { format, isToday, parseISO } from 'date-fns';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { ptBR } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useTimeTrackingStore } from '@/store/useTimeTrackingStore';
import { PointType } from '@/types';
import { API_CONFIG } from '@/constants/api';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();
  
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometryOptions, setShowBiometryOptions] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineLoading, setOfflineLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [tempBase64, setTempBase64] = useState<string | null>(null);
  const [selectedPointType, setSelectedPointType] = useState<PointType | null>(null);
  const cameraRef = React.useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const { addRecord, records, pendingSyncRecords } = useTimeTrackingStore();
  
  const offlineCombinedRecords = React.useMemo(() => {
    return [...records, ...pendingSyncRecords].filter(r => r.timestamp && isToday(parseISO(r.timestamp)));
  }, [records, pendingSyncRecords]);

  const { t } = useTranslation();

  // Monitorar conexão e disparar sync se voltar
  React.useEffect(() => {
    let lastConnected = false;
    
    const trySync = async () => {
      const netState = await NetInfo.fetch();
      const online = !!netState.isConnected;
      setIsOnline(online);
      
      // Se passou de offline para online, sincronizar e atualizar dados
      if (online && !lastConnected) {
        useTimeTrackingStore.getState().simulateSync();
        // Se tiver CPF preenchido, atualizar registros do servidor
        const cleanCpf = cpf.replace(/\D/g, '');
        if (cleanCpf.length >= 11) {
          useTimeTrackingStore.getState().fetchTodayRecords(cleanCpf);
        }
      }
      lastConnected = online;
    };

    // Verifica imediatamente ao montar
    trySync();
    
    // Polling a cada 5 segundos para garantir que a reconexão seja detectada
    const interval = setInterval(trySync, 5000);
    
    // Listener NetInfo como backup do polling
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = !!state.isConnected;
      setIsOnline(online);
      if (online && !lastConnected) {
        useTimeTrackingStore.getState().simulateSync();
        const cleanCpf = cpf.replace(/\D/g, '');
        if (cleanCpf.length >= 11) {
          useTimeTrackingStore.getState().fetchTodayRecords(cleanCpf);
        }
      }
      lastConnected = online;
    });
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [cpf]);

  const formatDocument = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      // CPF: 000.000.000-00
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .substring(0, 14);
    } else {
      // CNPJ: 00.000.000/0000-00
      return cleaned
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .substring(0, 18);
    }
  };

  const handleLogin = async () => {
    if (!cpf || !password) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Captura da localização (opcional no login, mas bom para log)
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          await Location.getCurrentPositionAsync({});
        }
      } catch (e) {
        console.log("Erro ao buscar localização", e);
      }

      // Chamada real para a API
      const formData = new FormData();
      const cleanCpf = cpf.replace(/[^\d]/g, '');
      formData.append('cpf', cleanCpf);
      formData.append('senha', password);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.LOGIN_URL}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 'ok') {
        login({ 
          id: result.usuarioId.toString(), 
          re: result.re,
          name: result.nome, 
          email: cleanCpf, // CPF
          pessoaId: result.pessoaId,
          empresaId: result.empresaId
        }, 'credentials');
        router.replace('/(app)/(tabs)/home');
      } else {
        Alert.alert('Erro', result.message || 'Falha ao autenticar.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.6,
          skipProcessing: false,
          // Removemos o base64 brutal da câmera nativa para evitar Memory Leak
        });
        
        // Mantemos a URI temporária para o preview na tela
        setTempPhoto(photo.uri);
        
        // Comprimimos brutalmente a imagem assim que ela bate para um Base64 muito leve (~50 KB)
        // Essa string leve é perfeita para salvar no AsyncStorage eternamente até a internet voltar
        const manipResult = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { base64: true, compress: 0.6 }
        );
        
        setTempBase64(manipResult.base64 || null);
      } catch (error) {
        console.error("Failed to take photo:", error);
      }
    }
  };

  const handleOfflinePointRecord = async (photoUri: string) => {
    if (!selectedPointType) return;
    
    setOfflineLoading(true);
    const cleanCpf = cpf.replace(/[^\d]/g, '');

    // Captura localização básica se possível
    let locationLabel = undefined;
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      locationLabel = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch (e) {}

    // Para garantir que a foto sobreviva mesmo se o usuário fechar o app e o celular deletar o Cache, 
    // nós usaremos a string Base64 comprimida (MUITO leve e rápida) como Payload permanente do Sync.
    const photoData = tempBase64 || photoUri;

    const record = {
      id: uuidv4(),
      userId: cleanCpf,
      type: selectedPointType,
      timestamp: new Date().toISOString(),
      location: locationLabel,
      synced: false,
      photo: photoData
    };

    addRecord(record);
    
    // Se estiver online agora, tenta sincronizar imediatamente
    if (isOnline) {
      useTimeTrackingStore.getState().simulateSync();
    }
    
    setTimeout(() => {
      setOfflineLoading(false);
      setShowOfflineModal(false);
      setShowCamera(false);
      setTempPhoto(null);
      setTempBase64(null);
      setSelectedPointType(null);
      setCpf('');
      setPassword('');
      Alert.alert(
        "Ponto Registrado!",
        "Seu registro com foto foi salvo offline e será sincronizado quando houver internet.",
        [{ text: "Entendido" }]
      );
    }, 800);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        contentContainerStyle={{ 
          flexGrow: 1, 
          justifyContent: 'center', 
          paddingHorizontal: 24, 
          paddingBottom: 40,
          paddingTop: Math.max(insets.top, 20)
        }}
      >
        
        {/* Logo */}
        <View className="items-center mb-8">
          <Image 
            source={require('@/assets/images/logo-realserv.png')} 
            style={{ width: 180, height: 110 }}
            resizeMode="contain"
          />
          <Text className="text-text-muted mt-4 text-center text-sm">
            Acesse sua jornada de trabalho
          </Text>
        </View>

        {/* Form */}
        <View className="w-full mb-6">
          <Input 
            label="CPF ou CNPJ"
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            icon={<User color="#94A3B8" size={20} />}
            value={cpf}
            onChangeText={(text) => setCpf(formatDocument(text))}
            autoCapitalize="none"
            keyboardType="numeric"
            className="mb-4"
          />

          <View className="mb-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-text-muted text-sm font-medium">Senha</Text>
            </View>
            <Input 
              placeholder="Digite sua senha"
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
        </View>

        {/* Login Button */}
        <Button 
          label="Entrar" 
          onPress={handleLogin}
          isLoading={isLoading}
          className="w-full mb-6"
        />

        <View className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl mb-8 border border-amber-100 dark:border-amber-900/30">
          <View className="flex-row items-center mb-1">
            <Building2 color="#D97706" size={16} style={{ marginRight: 8 }} />
            <Text className="text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">Acesso de Contingência</Text>
          </View>
          <Text className="text-amber-700/80 dark:text-amber-500/80 text-[11px] leading-4">
            Este método deve ser usado exclusivamente pela Portaria caso o reconhecimento facial não funcione. Registros via senha exigirão captura de foto.
          </Text>
        </View>

        {/* Divider */}
        <View className="flex-row items-center w-full mb-6">
          <View className="flex-1 h-[1px] bg-gray-200 dark:bg-slate-800" />
          <Text className="mx-4 text-text-muted dark:text-slate-500 font-medium text-xs">ou acesse por</Text>
          <View className="flex-1 h-[1px] bg-gray-200 dark:bg-slate-800" />
        </View>

        {/* Biometrics Login */}
        <TouchableOpacity 
          className="h-12 flex-row items-center justify-center rounded-xl border border-gray-300 bg-white"
          onPress={() => setShowBiometryOptions(true)}
        >
          <ScanFace color="#1E293B" size={20} className="mr-3" />
          <Text className="text-text-main font-bold">Entrar com biometria</Text>
        </TouchableOpacity>

        {!isOnline && (
          <View className="mt-8">
            <View className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl mb-4 border border-red-100 dark:border-red-900/30 flex-row items-center">
              <WifiOff color="#DC2626" size={20} className="mr-3" />
              <View className="flex-1">
                <Text className="text-red-800 dark:text-red-400 font-bold text-xs uppercase">Sem conexão com a internet</Text>
                <Text className="text-red-700/80 dark:text-red-500/80 text-[11px] leading-4 mt-0.5">
                  Tente mais tarde ou efetue o registro Offline abaixo.
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              className="h-14 flex-row items-center justify-center rounded-2xl bg-slate-900 dark:bg-slate-800 shadow-lg shadow-slate-300"
              onPress={async () => {
                const cleanCpf = cpf.replace(/\D/g, '');
                if (cleanCpf.length < 11) {
                  Alert.alert("Atenção", "Por favor, digite seu CPF/CNPJ no campo acima para realizar o registro offline.");
                  return;
                }
                
                // Se conectado, busca discretamente o cenário do banco. 
                // Uma eventual exclusão/limpeza por parte do Admin no banco desbloqueará a tela de Offline imediatamente.
                if (isOnline) {
                  useTimeTrackingStore.getState().fetchTodayRecords(cleanCpf);
                }
                
                setShowOfflineModal(true);
              }}
            >
              <Navigation color="white" size={20} className="mr-3" />
              <Text className="text-white font-bold text-base">Ponto Offline</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Biometry Options Modal */}
        <Modal
          visible={showBiometryOptions}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBiometryOptions(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableOpacity 
                activeOpacity={1} 
                className="absolute inset-0" 
                onPress={() => setShowBiometryOptions(false)} 
            />
            <View className="bg-white rounded-t-[40px] px-8 pt-6 pb-12 shadow-2xl">
                <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mb-8" />
                
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-black text-slate-800">Escolha o acesso</Text>
                    <TouchableOpacity onPress={() => setShowBiometryOptions(false)}>
                        <X color="#94A3B8" size={24} />
                    </TouchableOpacity>
                </View>

                <View className="gap-y-4">
                    <TouchableOpacity 
                        className="flex-row items-center bg-blue-50 p-6 rounded-3xl border border-blue-100"
                        onPress={async () => {
                            if (!cpf.trim()) {
                                Alert.alert("Atenção", "Por favor, digite seu CPF no formulário de acesso antes de prosseguir com o cadastro facial.");
                                return;
                            }
                            
                             try {
                                const cleanCpf = cpf.replace(/[^\d]/g, '');
                                
                                // Usando URLSearchParams para maior compatibilidade com ASP.NET ASHX
                                const params = new URLSearchParams();
                                params.append('cpf', cleanCpf);
                                params.append('checkonly', 'true');
                                
                                const valResp = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.LOGIN_URL}`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: params.toString()
                                });

                                if (!valResp.ok) {
                                  throw new Error(`Erro HTTP ${valResp.status}`);
                                }

                                const valResult = await valResp.json();
                                
                                if (valResult.status === 'ok') {
                                    setShowBiometryOptions(false);
                                    router.push({
                                        pathname: '/(auth)/facial-enrollment',
                                        params: { cpf: cleanCpf }
                                    });
                                } else {
                                    Alert.alert("Acesso Negado", valResult.message || "O usuário não existe ou o número é inválido.");
                                }
                            } catch (e: any) {
                                Alert.alert("Erro de Conexão", `Não foi possível validar seu CPF. ${e.message || "Verifique sua conexão."}`);
                            }
                        }}
                    >
                        <View className="w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center mr-4">
                            <UserPlus color="white" size={24} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-800 font-bold text-lg">Primeiro acesso</Text>
                            <Text className="text-slate-500 text-xs">Cadastrar biometria facial para começar.</Text>
                        </View>
                        <ArrowRight color="#3B82F6" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        className="flex-row items-center bg-slate-50 p-6 rounded-3xl border border-slate-100"
                        onPress={async () => {
                            if (!cpf.trim()) {
                                Alert.alert("Atenção", "Por favor, digite seu CPF no formulário de acesso antes de iniciar o reconhecimento facial.");
                                return;
                            }

           try {
                                const cleanCpf = cpf.replace(/[^\d]/g, '');
                                
                                // Usando URLSearchParams para maior compatibilidade com ASP.NET ASHX
                                const params = new URLSearchParams();
                                params.append('cpf', cleanCpf);
                                params.append('checkonly', 'true');
                                
                                const valResp = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.LOGIN_URL}`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: params.toString()
                                });
                                
                                if (!valResp.ok) {
                                    throw new Error(`Erro HTTP ${valResp.status}`);
                                }

                                const valResult = await valResp.json();
                                
                                if (valResult.status === 'ok') {
                                    setShowBiometryOptions(false);
                                    router.push({
                                        pathname: '/(auth)/facial-recognition',
                                        params: { cpf: cleanCpf }
                                    });
                                } else {
                                    Alert.alert("Acesso Negado", valResult.message || "O usuário não existe ou o número é inválido.");
                                }
                            } catch (e: any) {
                                Alert.alert("Erro de Conexão", `Não foi possível validar seu CPF. ${e.message || "Verifique sua conexão."}`);
                            }
                        }}
                    >
                        <View className="w-12 h-12 bg-slate-800 rounded-2xl items-center justify-center mr-4">
                            <LogIn color="white" size={24} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-800 font-bold text-lg">Entrar</Text>
                            <Text className="text-slate-500 text-xs">Acessar usando reconhecimento facial.</Text>
                        </View>
                        <ArrowRight color="#64748B" size={20} />
                    </TouchableOpacity>
                </View>
            </View>
          </View>
        </Modal>

      </ScrollView>

      {/* Offline Point Modal */}
      <Modal
        visible={showOfflineModal}
        transparent={false}
        animationType="slide"
      >
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
          <View className="flex-1 px-6 pt-8">
            <View className="flex-row items-center justify-between mb-8">
              <TouchableOpacity 
                onPress={() => setShowOfflineModal(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
              >
                <X color="#1E293B" size={24} />
              </TouchableOpacity>
              <Text className="text-slate-800 dark:text-slate-100 font-bold text-lg">Registro Offline</Text>
              <View className="w-10" />
            </View>

            <View className="bg-white dark:bg-slate-900 rounded-[40px] p-8 items-center shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
               <View className="bg-blue-50 dark:bg-blue-900/20 h-16 w-16 rounded-3xl items-center justify-center mb-4">
                  <User color="#2563EB" size={32} />
               </View>
               <Text className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-[2px] mb-1">Colaborador Identificado</Text>
               <Text className="text-slate-800 dark:text-slate-100 font-black text-xl mb-4">{cpf}</Text>
               
               <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl">
                  <Clock color="#94A3B8" size={14} className="mr-2" />
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                    {format(new Date(), "HH:mm")} • {format(new Date(), "dd/MM/yyyy")}
                  </Text>
               </View>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {[
                { id: 'ENTRADA', label: 'Entrada', icon: <LogIn color="#059669" size={28} />, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700' },
                { id: 'SAIDA_ALMOCO', label: 'P. Almoço', icon: <Coffee color="#2563EB" size={28} />, bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700' },
                { id: 'RETORNO_ALMOCO', label: 'R. Almoço', icon: <RotateCcw color="#D97706" size={28} />, bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700' },
                { id: 'SAIDA', label: 'Saída', icon: <LogOut color="#DC2626" size={28} />, bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700' }
              ].map((opt) => {
                const cleanCpf = cpf.replace(/[^\d]/g, '');
                // Verifica por TIPO apenas (não por userId) pois após sync o servidor retorna userId=RE (matrícula)
                // enquanto o registro offline salva userId=CPF. O fetchTodayRecords já garante que
                // os records na store são sempre do CPF digitado neste campo.
                const existingRecord = offlineCombinedRecords.find(r => r.type === opt.id);
                const isBlocked = !!existingRecord;
                
                return (
                  <TouchableOpacity
                    key={opt.id}
                    disabled={offlineLoading || isBlocked}
                    onPress={async () => {
                      if (!permission?.granted) {
                        const res = await requestPermission();
                        if (!res.granted) {
                          Alert.alert("Permissão Necessária", "Precisamos de acesso à câmera para registrar seu ponto com foto.");
                          return;
                        }
                      }
                      setSelectedPointType(opt.id as PointType);
                      setShowCamera(true);
                    }}
                    className={`w-[48%] aspect-[0.8] rounded-[36px] mb-4 p-6 items-center justify-center border-2 border-white shadow-sm shadow-slate-200 ${opt.bg} ${isBlocked ? 'opacity-60' : ''}`}
                  >
                    <View className="bg-white/80 dark:bg-white/10 h-16 w-16 rounded-full items-center justify-center mb-4">
                      {isBlocked ? <CheckCircle2 color="#94A3B8" size={32} /> : opt.icon}
                    </View>
                    <Text className={`font-black text-xs uppercase tracking-widest ${opt.text}`}>{opt.label}</Text>
                    
                    {isBlocked && (
                      <View className="mt-2 bg-white/50 px-3 py-1 rounded-full">
                        <Text className="text-slate-500 font-bold text-[10px]">
                          {format(new Date(existingRecord.timestamp), 'HH:mm')}
                        </Text>
                      </View>
                    )}
                    
                    {offlineLoading && !isBlocked && <ActivityIndicator size="small" color="#94A3B8" style={{ marginTop: 8 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="mt-auto pb-8">
              <Text className="text-center text-slate-400 text-[10px] leading-4 px-8">
                O registro será autenticado pelo servidor através do seu CPF/CNPJ assim que houver conexão.
              </Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Camera Overlay */}
        <Modal visible={showCamera} animationType="fade">
          <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
            <View className="flex-1 px-6 pt-6">
              <View className="flex-row items-center justify-between mb-8">
                <TouchableOpacity 
                   onPress={() => {
                     setShowCamera(false);
                     setTempPhoto(null);
                     setTempBase64(null);
                   }} 
                   className="h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900"
                >
                  <ArrowLeft color="#1E293B" size={24} />
                </TouchableOpacity>
                <Text className="text-slate-800 dark:text-slate-100 font-bold text-lg">Foto de Identificação</Text>
                <View className="w-10" />
              </View>

              {tempPhoto ? (
                <View className="flex-1">
                  <Text className="text-slate-800 dark:text-slate-100 font-black text-2xl text-center mb-2">A foto ficou boa?</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-center mb-8 px-4">
                    Sua foto é obrigatória para comprovar este registro offline.
                  </Text>
                  
                  <View className="flex-1 items-center justify-center mb-8">
                    <View className="w-72 h-72 rounded-[40px] overflow-hidden border-4 border-blue-600 shadow-2xl">
                        <Image source={{ uri: tempPhoto }} className="w-full h-full" resizeMode="cover" />
                    </View>
                  </View>

                  <View className="gap-y-4 mb-8">
                    <TouchableOpacity 
                      onPress={() => handleOfflinePointRecord(tempPhoto)}
                      disabled={offlineLoading}
                      className="bg-blue-600 flex-row items-center justify-center py-5 rounded-2xl shadow-lg shadow-blue-200"
                    >
                      {offlineLoading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <CheckCircle2 color="white" size={20} className="mr-2" />
                          <Text className="text-white font-bold text-base">Enviar Registro</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => {
                        setTempPhoto(null);
                        setTempBase64(null);
                      }}
                      disabled={offlineLoading}
                      className="bg-slate-100 dark:bg-slate-800 flex-row items-center justify-center py-5 rounded-2xl"
                    >
                      <RotateCcw color="#64748B" size={20} className="mr-2" />
                      <Text className="text-slate-600 dark:text-slate-400 font-bold text-base">Tirar outra foto</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View className="flex-1">
                  <Text className="text-slate-800 dark:text-slate-100 font-black text-2xl mb-2">Selfie Obrigatória</Text>
                  <Text className="text-slate-500 dark:text-slate-400 mb-8 leading-5">
                    Centralize seu rosto para o registro de {selectedPointType ? selectedPointType.replace('_', ' ') : 'ponto'}.
                  </Text>

                  <View className="flex-1 items-center justify-center mb-8">
                    <View className="w-72 h-72 rounded-[40px] overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-inner">
                        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
                    </View>
                  </View>

                  <View className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-3xl mb-8 flex-row items-center border border-amber-100 dark:border-amber-900/30">
                    <Info color="#D97706" size={20} className="mr-3" />
                    <Text className="text-amber-700 dark:text-amber-500 text-xs flex-1 leading-4">
                      Como você está desconectado, esta foto servirá como comprovante de presença.
                    </Text>
                  </View>

                  <TouchableOpacity 
                    onPress={takePicture}
                    className="bg-slate-900 dark:bg-blue-600 flex-row items-center justify-center py-5 rounded-2xl shadow-xl mb-8"
                  >
                    <Camera color="white" size={24} className="mr-2" />
                    <Text className="text-white font-black text-base">Capturar Foto</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>
      </Modal>

    </SafeAreaView>
  );
}
