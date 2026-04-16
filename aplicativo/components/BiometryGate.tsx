import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';
import { authenticateWithBiometry } from '@/utils/biometry';
import { Fingerprint, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface BiometryGateProps {
  children: React.ReactNode;
}

export default function BiometryGate({ children }: BiometryGateProps) {
  const { isBiometryEnabled } = useSettingsStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { t } = useTranslation();

  const handleAuthentication = async () => {
    const success = await authenticateWithBiometry(t('settings.biometryPrompt'));
    if (success) {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  };

  useEffect(() => {
    if (isBiometryEnabled) {
      handleAuthentication();
    } else {
      setIsAuthenticated(true);
      setIsChecking(false);
    }
  }, [isBiometryEnabled]);

  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (isBiometryEnabled && !isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Lock color="#3B82F6" size={48} />
          </View>
          <Text style={styles.title}>{t('settings.biometryRequiredTitle', { defaultValue: 'Acesso Bloqueado' })}</Text>
          <Text style={styles.subtitle}>{t('settings.biometryRequiredSubtitle', { defaultValue: 'Use sua biometria para acessar o aplicativo' })}</Text>
          
          <TouchableOpacity 
            onPress={handleAuthentication}
            style={styles.button}
          >
            <Fingerprint color="#ffffff" size={24} style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>{t('settings.authenticateNow', { defaultValue: 'Autenticar' })}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 24,
    width: '100%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
