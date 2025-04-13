import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

type RoutePath = '/home' | '/explore' | '/chat' | '/profile';

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: { label: string; icon: any; path: RoutePath }[] = [
    { label: 'Home', icon: 'home', path: '/home' },
    { label: 'Search', icon: 'search', path: '/explore' },
    { label: 'Chat', icon: 'message-square', path: '/chat' },
    { label: 'Profile', icon: 'user', path: '/profile' },
  ];

  return (
    <View style={styles.navbar}>
      {navItems.map(({ label, icon, path }) => {
        const isActive = pathname === path;

        return (
          <TouchableOpacity
            key={label}
            style={styles.navItem}
            onPress={() => router.push(path)}
          >
            <Feather
              name={icon}
              size={24}
              color={isActive ? '#253528' : '#49654E'}
            />
            <Text
              style={[
                styles.navText,
                !isActive && styles.navTextInactive
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(37, 53, 40, 0.1)',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#253528',
    fontWeight: 'bold',
  },
  navTextInactive: {
    color: '#49654E',
    fontWeight: 'normal',
  },
});

export default Navbar;
