// app/_layout.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, Redirect } from 'expo-router';

// This component handles redirecting from /skills to /skills/[name]
function SkillsRedirect() {
  return <Redirect href="/skills/default" />;
}

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
        <Stack.Screen 
          name="skills/[name]" 
          options={{ 
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' }
          }} 
        />
        {/* Add this to handle the "skills" route with params */}
        <Stack.Screen 
          name="skills" 
          options={{ headerShown: false }}
          component={SkillsRedirect} 
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