// app/_layout.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="chat/[id]" 
          options={{ 
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' }
          }} 
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});