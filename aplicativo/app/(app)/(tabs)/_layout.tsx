import { Tabs } from 'expo-router';
import { Home, Clock, FileText, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme'; 

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#f8b133',
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
          height: 60 + (Platform.OS === 'android' ? insets.bottom + 10 : insets.bottom),
          paddingBottom: Platform.OS === 'android' ? insets.bottom + 10 : Math.max(insets.bottom, 8),
          paddingTop: 8,
          backgroundColor: isDark ? '#020617' : '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen 
        name="history" 
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen 
        name="reports" 
        options={{
          title: t('tabs.reports'),
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          href: null, // Oculto a pedido do usuário
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          href: null, // Oculto a pedido do usuário
        }}
      />
    </Tabs>
  );
}
