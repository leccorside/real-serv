import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

export const checkBiometrySupport = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  return {
    hasHardware,
    isEnrolled,
    isSupported: hasHardware && isEnrolled
  };
};

export const authenticateWithBiometry = async (reason: string = 'Autentique-se para continuar') => {
  try {
    const results = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Usar senha',
      disableDeviceFallback: false,
    });

    if (results.success) {
      return true;
    } else {
      if (results.error !== 'user_cancel') {
        // Handle other errors if needed
      }
      return false;
    }
  } catch (error) {
    console.error('Biometry error:', error);
    return false;
  }
};
