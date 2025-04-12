import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const Navbar = () => {
  return (
    <View style={styles.navbar}>
      <TouchableOpacity style={styles.navItem}>
        <Feather name="home" size={24} color="#253528" />
        <Text style={styles.navText}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navItem}>
        <Feather name="search" size={24} color="#49654E" />
        <Text style={[styles.navText, styles.navTextInactive]}>Search</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navItem}>
        <Feather name="message-square" size={24} color="#49654E" />
        <Text style={[styles.navText, styles.navTextInactive]}>Chat</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navItem}>
        <Feather name="user" size={24} color="#49654E" />
        <Text style={[styles.navText, styles.navTextInactive]}>Profile</Text>
      </TouchableOpacity>
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
  }
});

export default Navbar;