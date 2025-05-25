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

interface CourseWebsiteData {
  name: string;
  description: string;
  link: string;
  category: string;
}

interface CourseWebsitesCardProps {
  message: string;
}

const CourseWebsitesCard: React.FC<CourseWebsitesCardProps> = ({ message }) => {
  // Hardcoded course websites data
  const courseWebsites: CourseWebsiteData[] = [
    {
      name: "Herkey",
      description: "AI-powered learning platform with personalized course recommendations",
      link: "https://herkey.app",
      category: "Tech"
    },
    {
      name: "Naukri.com",
      description: "Professional courses and skill development programs",
      link: "https://naukri.com/learning",
      category: "Professional"
    },
    {
      name: "Indeed.com",
      description: "Career advancement courses and skill assessments",
      link: "https://indeed.com/career-advice/courses",
      category: "Career"
    },
    {
      name: "Internshala",
      description: "Online training courses and certification programs",
      link: "https://internshala.com/trainings",
      category: "Training"
    },
    {
      name: "LinkedIn Learning",
      description: "Professional development courses by industry experts",
      link: "https://linkedin.com/learning",
      category: "Professional"
    }
  ];

  // Get favicon URL for a given website
  const getFaviconUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return 'https://via.placeholder.com/50x50?text=C';
    }
  };

  // Get category icon based on category name
  const getCategoryIcon = (category: string): string => {
    const categoryLower = category.toLowerCase();
    
    switch (categoryLower) {
      case 'tech':
        return 'computer';
      case 'professional':
        return 'business-center';
      case 'career':
        return 'trending-up';
      case 'training':
        return 'school';
      case 'certification':
        return 'verified';
      default:
        return 'book';
    }
  };

  // Get category color based on category name (green theme)
  const getCategoryColor = (category: string): string => {
    const categoryLower = category.toLowerCase();
    
    switch (categoryLower) {
      case 'tech':
        return '#2E7D32'; // Dark green
      case 'professional':
        return '#388E3C'; // Medium green
      case 'career':
        return '#4CAF50'; // Standard green
      case 'training':
        return '#66BB6A'; // Light green
      case 'certification':
        return '#81C784'; // Lighter green
      default:
        return '#49654E'; // Default green from community theme
    }
  };

  // Handle course website link press
  const handleWebsitePress = async (link: string) => {
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

  // Check if message contains /courses command
  const isCoursesCommand = message.toLowerCase().includes('/jobportals');

  // If not a courses command, don't render anything
  if (!isCoursesCommand) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MaterialIcons name="school" size={24} color="#49654E" />
        <Text style={styles.headerTitle}>Learning Platforms</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {courseWebsites.map((website, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.websiteCard}
            onPress={() => handleWebsitePress(website.link)}
            activeOpacity={0.7}
          >
            {/* Header with favicon and basic info */}
            <View style={styles.cardHeader}>
              <Image 
                source={{ uri: getFaviconUrl(website.link) }} 
                style={styles.websiteLogo}
                defaultSource={{ uri: 'https://via.placeholder.com/50x50?text=C' }}
              />
              <View style={styles.cardTextContainer}>
                <Text style={styles.websiteName} numberOfLines={1}>
                  {website.name}
                </Text>
                <Text style={styles.websiteDescription} numberOfLines={2}>
                  {website.description}
                </Text>
                <View style={styles.categoryContainer}>
                  <MaterialIcons 
                    name={getCategoryIcon(website.category) as any} 
                    size={16} 
                    color={getCategoryColor(website.category)} 
                  />
                  <Text style={[styles.categoryText, { color: getCategoryColor(website.category) }]}>
                    {website.category}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#CCCCCC" />
            </View>

            {/* Link preview */}
            <View style={styles.linkContainer}>
              <MaterialIcons name="link" size={14} color="#888888" />
              <Text style={styles.linkText} numberOfLines={1}>
                {website.link}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Footer with additional info */}
      <View style={styles.footerContainer}>
        <MaterialIcons name="info" size={16} color="#666666" />
        <Text style={styles.footerText}>
          Tap any platform to explore learning opportunities
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
  websiteCard: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  websiteLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  cardTextContainer: {
    flex: 1,
  },
  websiteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528', // Dark green text matching community theme
    lineHeight: 22,
    marginBottom: 4,
  },
  websiteDescription: {
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

export default CourseWebsitesCard;