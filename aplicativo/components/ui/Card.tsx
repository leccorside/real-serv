import React from 'react';
import { View, ViewProps } from 'react-native';

export function Card({ className = '', children, ...props }: ViewProps) {
  return (
    <View 
      className={`rounded-2xl border border-gray-100 bg-card p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
