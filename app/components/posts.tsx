// components/Posts.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PostType } from '../types/types';

interface PostsProps {
  post: PostType;
}

const Posts: React.FC<PostsProps> = ({ post }) => {
  return (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        {post.userProfilePic ? (
          <Image source={{ uri: post.userProfilePic }} style={styles.userProfilePic} />
        ) : (
          <View style={styles.userProfilePlaceholder}>
            <Text style={styles.userInitial}>{post.userName.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.postHeaderContent}>
          <Text style={styles.userName}>{post.userName}</Text>
          <Text style={styles.userTitle}>{post.userTitle}</Text>
          <View style={styles.postMeta}>
            <Text style={styles.postTime}>{post.timePosted}</Text>
            <Text style={styles.separator}>•</Text>
            <Feather name="globe" size={12} color="#49654E" />
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="more-horizontal" size={20} color="#49654E" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={styles.postText}>{post.text}</Text>
        {post.image && (
          <Image 
            source={{ uri: post.image }} 
            style={styles.postImage} 
            resizeMode="cover" 
          />
        )}
      </View>

      {/* Post Stats */}
      <View style={styles.postStats}>
        <View style={styles.reactions}>
          <View style={[styles.reactionIcon, styles.reactionLike]}>
            <Feather name="thumbs-up" size={12} color="#FFFFFF" />
          </View>
          <View style={[styles.reactionIcon, styles.reactionHeart]}>
            <Feather name="heart" size={12} color="#FFFFFF" />
          </View>
          <Text style={styles.reactionCount}>{post.likes}</Text>
        </View>
        <Text style={styles.commentCount}>{post.comments} comments</Text>
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="thumbs-up" size={18} color="#49654E" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="message-square" size={18} color="#49654E" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="share-2" size={18} color="#49654E" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="send" size={18} color="#49654E" />
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  userProfilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userProfilePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#49654E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  postHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#253528',
  },
  userTitle: {
    fontSize: 14,
    color: '#49654E',
    marginVertical: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 12,
    color: '#49654E',
  },
  separator: {
    marginHorizontal: 4,
    color: '#49654E',
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#253528',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(37, 53, 40, 0.1)',
  },
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -4,
  },
  reactionLike: {
    backgroundColor: '#0077B5',
    zIndex: 1,
  },
  reactionHeart: {
    backgroundColor: '#E74C3C',
  },
  reactionCount: {
    marginLeft: 8,
    fontSize: 12,
    color: '#49654E',
  },
  commentCount: {
    fontSize: 12,
    color: '#49654E',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#49654E',
  },
});

export default Posts;