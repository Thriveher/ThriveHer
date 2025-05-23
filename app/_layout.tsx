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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Only include routes that actually exist in your project structure */}
        {/* If these routes exist, uncomment them */}
        {/* 
        <Stack.Screen 
          name="chat/[id]" 
          options={{ 
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' }
          }} 
        />
        */}
        
        {/* Removed missing routes: (tabs), skills/[name], skills/lesson/[topicId] */}
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});