import { Stack } from 'expo-router';
import BiometryGate from '@/components/BiometryGate';

export default function AppStackLayout() {
  return (
    <BiometryGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="register-point" />
        <Stack.Screen name="confirm-point" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="notification-detail" />
      </Stack>
    </BiometryGate>
  );
}
