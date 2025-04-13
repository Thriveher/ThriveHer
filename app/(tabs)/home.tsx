import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Posts from '../components/posts';
import { posts } from '../data/post';
import Navbar from '../components/navbar';

const Home = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F5F7F5" barStyle="dark-content" />
      
      <ScrollView style={styles.scrollView}>
        {/* Create Post Section */}
        <View style={styles.createPost}>
          <View style={styles.createPostHeader}>
            <View style={styles.profilePicSmall}>
              <Text style={styles.profileInitialSmall}>P</Text>
            </View>
            <TouchableOpacity style={styles.postInput} activeOpacity={0.7}>
              <Text style={styles.postInputText}>What's on your mind?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageIcon}>
              <Feather name="message-square" size={22} color="#49654E" />
            </TouchableOpacity>
          </View>
          <View style={styles.createPostActions}>
            <TouchableOpacity style={styles.actionItem}>
              <Feather name="image" size={20} color="#49654E" />
              <Text style={styles.actionText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Feather name="video" size={20} color="#49654E" />
              <Text style={styles.actionText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Feather name="calendar" size={20} color="#49654E" />
              <Text style={styles.actionText}>Event</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Feather name="file-text" size={20} color="#49654E" />
              <Text style={styles.actionText}>Article</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Divider */}
        <View style={styles.divider} />
        
        {/* Posts Feed */}
        <View style={styles.feed}>
          {posts.map((post, index) => (
            <Posts key={index} post={post} />
          ))}
        </View>
      </ScrollView>
      
      {/* Navbar */}
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  scrollView: {
    flex: 1,
  },
  createPost: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    marginHorizontal: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  createPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#49654E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitialSmall: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  postInput: {
    flex: 1,
    backgroundColor: '#F5F7F5',
    padding: 14,
    borderRadius: 24,
  },
  postInputText: {
    color: '#888',
    fontSize: 15,
  },
  messageIcon: {
    marginLeft: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F7F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostActions: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#F5F7F5',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#49654E',
    fontWeight: '500',
  },
  divider: {
    height: 8,
    backgroundColor: '#F5F7F5',
  },
  feed: {
    flex: 1,
    paddingHorizontal: 10,
  },
});

export default Home;