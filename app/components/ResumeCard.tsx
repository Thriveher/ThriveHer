import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ResumeCardProps {
  message: string;
  onSelectCommand?: (command: string) => void;
  onExampleClick?: (fullCommand: string) => void;
}

const ResumeCard: React.FC<ResumeCardProps> = ({ 
  message, 
  onSelectCommand = () => {}, 
  onExampleClick = () => {} 
}) => {
  // Parse resume URL from message
  const parseResumeUrl = (message: string): string | null => {
    try {
      // Look for /resume command followed by URL
      const resumeMatch = message.match(/\/resume\s*:\s*(https?:\/\/[^\s]+)/);
      if (resumeMatch) {
        return resumeMatch[1];
      }
      return null;
    } catch (error) {
      console.error('Error parsing resume URL:', error);
      return null;
    }
  };

  // Extract filename from URL
  const extractFilename = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'resume.pdf';
      
      // Clean up the filename - remove UUID and timestamp parts
      const cleanFilename = filename
        .replace(/^resume_/, '')
        .replace(/_\d{4}-\d{2}-\d{2}T[\d-]+Z\.pdf$/, '.pdf')
        .replace(/^[a-f0-9-]{36}_/, '') // Remove UUID prefix if present
        .replace(/_+/g, '_'); // Replace multiple underscores with single
      
      return cleanFilename.startsWith('_') ? cleanFilename.substring(1) : cleanFilename;
    } catch {
      return 'resume.pdf';
    }
  };

  // Get file size (mock - in real app you might want to fetch this)
  const getFileSize = (): string => {
    return '~1.2 MB'; // Mock file size
  };

  // Handle resume open
  const handleOpenResume = async (resumeUrl: string) => {
    try {
      const supported = await Linking.canOpenURL(resumeUrl);
      if (supported) {
        await Linking.openURL(resumeUrl);
      } else {
        console.error("Can't open URL:", resumeUrl);
      }
    } catch (error) {
      console.error('Error opening resume:', error);
    }
  };

  // Check if message contains /resume command
  const isResumeCommand = message.toLowerCase().includes('/resume');
  const resumeUrl = parseResumeUrl(message);

  // If not a resume command or no URL found, don't render anything
  if (!isResumeCommand || !resumeUrl) {
    return null;
  }

  const filename = extractFilename(resumeUrl);
  const fileSize = getFileSize();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.documentCard}
        onPress={() => handleOpenResume(resumeUrl)}
        activeOpacity={0.7}
      >
        {/* Document Icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons name="picture-as-pdf" size={32} color="#D32F2F" />
        </View>

        {/* Document Info */}
        <View style={styles.documentInfo}>
          <Text style={styles.filename} numberOfLines={2}>
            {filename}
          </Text>
          <View style={styles.metaInfo}>
            <Text style={styles.fileSize}>{fileSize}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.fileType}>PDF</Text>
          </View>
        </View>

        {/* Action Icon */}
        <View style={styles.actionContainer}>
          <MaterialIcons name="open-in-new" size={20} color="#49654E" />
        </View>
      </TouchableOpacity>

      {/* Download/View Button */}
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => handleOpenResume(resumeUrl)}
      >
        <MaterialIcons name="visibility" size={18} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>View Resume</Text>
      </TouchableOpacity>
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
    overflow: 'hidden',
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentInfo: {
    flex: 1,
    marginRight: 12,
  },
  filename: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528',
    lineHeight: 20,
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileSize: {
    fontSize: 13,
    color: '#666666',
  },
  separator: {
    fontSize: 13,
    color: '#666666',
    marginHorizontal: 6,
  },
  fileType: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  actionContainer: {
    padding: 4,
  },
  actionButton: {
    backgroundColor: '#49654E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 12,
    marginTop: 0,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ResumeCard;