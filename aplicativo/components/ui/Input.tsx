import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, icon, rightIcon, className = '', ...props }: InputProps) {
  return (
    <View className={`w-full ${className}`}>
      {label && <Text className="text-text-muted mb-2 text-sm font-medium">{label}</Text>}
      
      <View className={`h-12 flex-row items-center rounded-xl border ${error ? 'border-danger' : 'border-gray-300'} bg-white px-4`}>
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className="flex-1 font-medium text-text-main"
          placeholderTextColor="#94A3B8"
          {...props}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>

      {error && <Text className="text-danger mt-1 text-xs">{error}</Text>}
    </View>
  );
}
