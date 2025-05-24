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

interface JobPortalData {
  name: string;
  description: string;
  link: string;
  category: string;
}

interface JobPortalsCardProps {
  message: string;
}

const JobPortalsCard: React.FC<JobPortalsCardProps> = ({ message }) => {
  // Hardcoded job portals data
  const jobPortals: JobPortalData[] = [
    {
      name: "Herkey",
      description: "AI-powered job matching platform for tech professionals",
      link: "https://herkey.app",
      category: "Tech"
    },
    {
      name: "LinkedIn Jobs",
      description: "Professional network with comprehensive job listings",
      link: "https://linkedin.com/jobs",
      category: "General"
    },
    {
      name: "Indeed",
      description: "World's largest job search engine with millions of listings",
      link: "https://indeed.com",
      category: "General"
    },
    {
      name: "AngelList",
      description: "Startup jobs and equity opportunities",
      link: "https://angel.co/jobs",
      category: "Startup"
    },
    {
      name: "Stack Overflow Jobs",
      description: "Developer-focused job board for tech positions",
      link: "https://stackoverflow.com/jobs",
      category: "Tech"
    }
  ];

  // Get favicon URL for a given website
  const getFaviconUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return 'https://via.placeholder.com/50x50?text=J';
    }
  };

  // Get category icon based on category name
  const getCategoryIcon = (category: string): string => {
    const categoryLower = category.toLowerCase();
    
    switch (categoryLower) {
      case 'tech':
        return 'computer';
      case 'startup':
        return 'rocket-launch';
      case 'general':
        return 'work';
      case 'remote':
        return 'home';
      case 'freelance':
        return 'person';
      default:
        return 'work';
    }
  };

  // Get category color based on category name (green theme)
  const getCategoryColor = (category: string): string => {
    const categoryLower = category.toLowerCase();
    
    switch (categoryLower) {
      case 'tech':
        return '#2E7D32'; // Dark green
      case 'startup':
        return '#388E3C'; // Medium green
      case 'general':
        return '#4CAF50'; // Standard green
      case 'remote':
        return '#66BB6A'; // Light green
      case 'freelance':
        return '#81C784'; // Lighter green
      default:
        return '#49654E'; // Default green from community theme
    }
  };

  // Handle job portal link press
  const handlePortalPress = async (link: string) => {
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

  // Check if message contains /jobportals command
  const isJobPortalsCommand = message.toLowerCase().includes('/jobportals');

  // If not a job portals command, don't render anything
  if (!isJobPortalsCommand) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MaterialIcons name="work" size={24} color="#49654E" />
        <Text style={styles.headerTitle}>Job Search Platforms</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {jobPortals.map((portal, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.portalCard}
            onPress={() => handlePortalPress(portal.link)}
            activeOpacity={0.7}
          >
            {/* Header with favicon and basic info */}
            <View style={styles.cardHeader}>
              <Image 
                source={{ uri: getFaviconUrl(portal.link) }} 
                style={styles.portalLogo}
                defaultSource={{ uri: 'https://via.placeholder.com/50x50?text=J' }}
              />
              <View style={styles.cardTextContainer}>
                <Text style={styles.portalName} numberOfLines={1}>
                  {portal.name}
                </Text>
                <Text style={styles.portalDescription} numberOfLines={2}>
                  {portal.description}
                </Text>
                <View style={styles.categoryContainer}>
                  <MaterialIcons 
                    name={getCategoryIcon(portal.category) as any} 
                    size={16} 
                    color={getCategoryColor(portal.category)} 
                  />
                  <Text style={[styles.categoryText, { color: getCategoryColor(portal.category) }]}>
                    {portal.category}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#CCCCCC" />
            </View>

            {/* Link preview */}
            <View style={styles.linkContainer}>
              <MaterialIcons name="link" size={14} color="#888888" />
              <Text style={styles.linkText} numberOfLines={1}>
                {portal.link}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Footer with additional info */}
      <View style={styles.footerContainer}>
        <MaterialIcons name="info" size={16} color="#666666" />
        <Text style={styles.footerText}>
          Tap any platform to explore job opportunities
        </Text>
      </View>
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
    maxHeight: 600,
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
    color: '#253528', // Dark green text matching community theme
    marginLeft: 8,
  },
  scrollView: {
    maxHeight: 450,
  },
  portalCard: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  portalLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  cardTextContainer: {
    flex: 1,
  },
  portalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528', // Dark green text matching community theme
    lineHeight: 22,
    marginBottom: 4,
  },
  portalDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 6,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'uppercase',
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
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 6,
    fontStyle: 'italic',
  },
});

export default JobPortalsCard;