import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Linking 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CommunityData {
  name: string;
  platform: string;
  link: string;
}

interface CommunityCardProps {
  message: string;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ message }) => {
  // Parse community data from message
  const parseCommunityData = (message: string): CommunityData[] => {
    try {
      // Look for /community command followed by data
      const lines = message.split('\n');
      const communities: CommunityData[] = [];
      
      let foundCommand = false;
      for (const line of lines) {
        if (line.trim().toLowerCase() === '/community') {
          foundCommand = true;
          continue;
        }
        
        if (foundCommand && line.trim()) {
          const parts = line.split(':');
          if (parts.length >= 3) {
            const name = parts[0].trim();
            const platform = parts[1].trim();
            const link = parts.slice(2).join(':').trim(); // Handle URLs with colons
            
            communities.push({ name, platform, link });
          }
        }
      }
      
      return communities;
    } catch (error) {
      console.error('Error parsing community data:', error);
      return [];
    }
  };

  // Get favicon URL for a given website
  const getFaviconUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return 'https://via.placeholder.com/50x50?text=C';
    }
  };

  // Get platform icon based on platform name
  const getPlatformIcon = (platform: string): string => {
    const platformLower = platform.toLowerCase();
    
    switch (platformLower) {
      case 'facebook':
        return 'facebook';
      case 'linkedin':
        return 'language'; // Using language as MaterialIcons doesn't have linkedin
      case 'discord':
        return 'chat';
      case 'twitter':
        return 'alternate-email';
      case 'reddit':
        return 'forum';
      case 'github':
        return 'code';
      case 'instagram':
        return 'photo-camera';
      case 'youtube':
        return 'play-circle-filled';
      case 'telegram':
        return 'send';
      case 'slack':
        return 'chat-bubble';
      default:
        return 'language';
    }
  };

  // Get platform color based on platform name
  const getPlatformColor = (platform: string): string => {
    const platformLower = platform.toLowerCase();
    
    switch (platformLower) {
      case 'facebook':
        return '#1877F2';
      case 'linkedin':
        return '#0A66C2';
      case 'discord':
        return '#5865F2';
      case 'twitter':
        return '#1DA1F2';
      case 'reddit':
        return '#FF4500';
      case 'github':
        return '#333333';
      case 'instagram':
        return '#E4405F';
      case 'youtube':
        return '#FF0000';
      case 'telegram':
        return '#0088CC';
      case 'slack':
        return '#4A154B';
      default:
        return '#49654E';
    }
  };

  // Handle community link press
  const handleCommunityPress = async (link: string) => {
    try {
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      } else {
        console.error("Can't open URL:", link);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  // Check if message contains /community command
  const isCommunityCommand = message.toLowerCase().includes('/community');
  const communityData = parseCommunityData(message);

  // If not a community command or no community data, don't render anything
  if (!isCommunityCommand || communityData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MaterialIcons name="groups" size={24} color="#49654E" />
        <Text style={styles.headerTitle}>Developer Communities</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {communityData.map((community, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.communityCard}
            onPress={() => handleCommunityPress(community.link)}
            activeOpacity={0.7}
          >
            {/* Header with favicon and basic info */}
            <View style={styles.cardHeader}>
              <Image 
                source={{ uri: getFaviconUrl(community.link) }} 
                style={styles.communityLogo}
                defaultSource={{ uri: 'https://via.placeholder.com/50x50?text=C' }}
              />
              <View style={styles.cardTextContainer}>
                <Text style={styles.communityName} numberOfLines={2}>
                  {community.name}
                </Text>
                <View style={styles.platformContainer}>
                  <MaterialIcons 
                    name={getPlatformIcon(community.platform) as any} 
                    size={16} 
                    color={getPlatformColor(community.platform)} 
                  />
                  <Text style={[styles.platformText, { color: getPlatformColor(community.platform) }]}>
                    {community.platform}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#CCCCCC" />
            </View>

            {/* Link preview */}
            <View style={styles.linkContainer}>
              <MaterialIcons name="link" size={14} color="#888888" />
              <Text style={styles.linkText} numberOfLines={1}>
                {community.link}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 500,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#253528',
    marginLeft: 8,
  },
  scrollView: {
    maxHeight: 400,
  },
  communityCard: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  communityLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  cardTextContainer: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528',
    lineHeight: 22,
    marginBottom: 4,
  },
  platformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  linkText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 6,
    flex: 1,
  },
});

export default CommunityCard;