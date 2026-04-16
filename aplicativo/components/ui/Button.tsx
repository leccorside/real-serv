import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export function Button({ label, variant = 'primary', isLoading, className = '', ...props }: ButtonProps) {
  const baseClasses = 'h-12 flex-row items-center justify-center rounded-xl px-6';
  
  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    outline: 'border-2 border-primary bg-transparent',
    danger: 'bg-danger',
  };

  const textClasses = {
    primary: 'text-white font-bold',
    secondary: 'text-primary font-bold',
    outline: 'text-primary font-bold',
    danger: 'text-white font-bold',
  };

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${props.disabled ? 'opacity-50' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'secondary' ? '#0066FF' : '#FFFFFF'} />
      ) : (
        <Text className={`${textClasses[variant]} text-base`}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
