import React from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string;
}

const MessageBubble = ({
  message,
  isUser,
  timestamp
}: MessageBubbleProps) => {
  
  // Handle link press
  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    const elements: JSX.Element[] = [];
    // Split by newline characters and preserve them
    const lines = text.split('\n');
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Add line break before each line except the first
      if (i > 0) {
        elements.push(<Text key={`lb-${key++}`}>{'\n'}</Text>);
      }
      
      // Handle headers
      if (line.startsWith('#### ')) {
        elements.push(
          <Text key={key++} style={styles.h4}>
            {parseInlineMarkdown(line.substring(5))}
          </Text>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <Text key={key++} style={styles.h3}>
            {parseInlineMarkdown(line.substring(4))}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <Text key={key++} style={styles.h2}>
            {parseInlineMarkdown(line.substring(3))}
          </Text>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <Text key={key++} style={styles.h1}>
            {parseInlineMarkdown(line.substring(2))}
          </Text>
        );
      }
      // Handle code blocks
      else if (line.startsWith('```')) {
        const codeLines = [];
        i++; // Skip the opening ```
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        elements.push(
          <View key={key++} style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {codeLines.join('\n')}
            </Text>
          </View>
        );
      }
      // Handle blockquotes
      else if (line.startsWith('> ')) {
        elements.push(
          <View key={key++} style={styles.blockquote}>
            <Text style={styles.blockquoteText}>
              {parseInlineMarkdown(line.substring(2))}
            </Text>
          </View>
        );
      }
      // Handle bullet points
      else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
        elements.push(
          <View key={key++} style={styles.listItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.listText}>
              {parseInlineMarkdown(line.substring(2))}
            </Text>
          </View>
        );
      }
      // Handle numbered lists
      else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.*)$/);
        if (match) {
          elements.push(
            <View key={key++} style={styles.listItem}>
              <Text style={styles.bulletPoint}>{match[1]}.</Text>
              <Text style={styles.listText}>
                {parseInlineMarkdown(match[2])}
              </Text>
            </View>
          );
        }
      }
      // Handle regular paragraphs and empty lines
      else if (line.trim() !== '') {
        elements.push(
          <Text key={key++} style={styles.paragraph}>
            {parseInlineMarkdown(line)}
          </Text>
        );
      }
      // Handle empty lines - add a small space element
      else {
        elements.push(
          <Text key={key++} style={styles.emptyLine}>
            {' '}
          </Text>
        );
      }
    }

    return elements;
  };

  // Parse inline markdown (bold, italic, code, links, special blocks)
  const parseInlineMarkdown = (text: string): (string | JSX.Element)[] => {
    const elements: (string | JSX.Element)[] = [];
    let currentIndex = 0;
    let key = 0;

    // Combined regex to find all inline markdown patterns
    const patterns = [
      { regex: /\*\*((?:[^*]|\*(?!\*))+?)\*\*/g, style: styles.bold, type: 'bold' },
      { regex: /\*([^*]+?)\*/g, style: styles.italic, type: 'italic' },
      { regex: /`([^`]+?)`/g, style: styles.inlineCode, type: 'code' },
      { regex: /\{([^}]+?)\}/g, style: styles.specialBlock, type: 'special' },
      { regex: /\[([^\]]+)\]\(([^)]+)\)/g, style: styles.link, type: 'markdown_link' },
      { regex: /https?:\/\/[^\s<>"{}|\\^`[\]]+/g, style: styles.link, type: 'plain_link' }
    ];

    // Find all matches with their positions
    const allMatches: Array<{
      start: number;
      end: number;
      text: string;
      url?: string;
      style: any;
      type: string;
    }> = [];

    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      while ((match = regex.exec(text)) !== null) {
        if (pattern.type === 'markdown_link') {
          allMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[1],
            url: match[2],
            style: pattern.style,
            type: pattern.type
          });
        } else if (pattern.type === 'plain_link') {
          // Check if this URL is already part of a markdown link
          const isPartOfMarkdownLink = allMatches.some(m => 
            m.type === 'markdown_link' && 
            match.index >= m.start && 
            match.index < m.end
          );
          
          if (!isPartOfMarkdownLink) {
            allMatches.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0],
              url: match[0],
              style: pattern.style,
              type: pattern.type
            });
          }
        } else {
          allMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[1],
            style: pattern.style,
            type: pattern.type
          });
        }
      }
    });

    // Sort matches by start position and remove overlaps
    allMatches.sort((a, b) => a.start - b.start);
    
    const filteredMatches = [];
    let lastEnd = 0;
    
    for (const match of allMatches) {
      if (match.start >= lastEnd) {
        filteredMatches.push(match);
        lastEnd = match.end;
      }
    }

    // Build the final elements array
    filteredMatches.forEach(match => {
      // Add text before this match
      if (match.start > currentIndex) {
        const beforeText = text.substring(currentIndex, match.start);
        if (beforeText) {
          elements.push(beforeText);
        }
      }

      // Add the formatted element
      if (match.type === 'markdown_link' || match.type === 'plain_link') {
        elements.push(
          <Text
            key={key++}
            style={match.style}
            onPress={() => handleLinkPress(match.url!)}
          >
            {match.text}
          </Text>
        );
      } else {
        elements.push(
          <Text key={key++} style={[styles.normalText, match.style]}>
            {match.text}
          </Text>
        );
      }

      currentIndex = match.end;
    });

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        elements.push(remainingText);
      }
    }

    // If no matches found, return the original text
    if (elements.length === 0) {
      elements.push(text);
    }

    return elements;
  };

  // Enhanced markdown detection
  const hasMarkdown = /[*_`#\[\]!+{}-]/.test(message) || 
                     message.includes('```') || 
                     message.includes('> ') ||
                     message.includes('#### ') ||
                     /^\d+\.\s/m.test(message) ||
                     /^[+*-]\s/m.test(message) ||
                     /https?:\/\//.test(message) ||
                     message.includes('\n') ||
                     /\{.*?\}/.test(message) ||
                     /\*\*.*?\*\*/.test(message);

  // Render plain text with proper newline handling
  const renderPlainText = (text: string) => {
    // Split by \n and create Text elements
    const parts = text.split('\n');
    
    return (
      <Text style={[
        styles.messageText,
        isUser ? styles.userText : styles.botText
      ]}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 && '\n'}
            {part}
          </React.Fragment>
        ))}
      </Text>
    );
  };

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.botContainer
    ]}>
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        {!isUser && hasMarkdown ? (
          <View style={styles.markdownContainer}>
            {parseMarkdown(message)}
          </View>
        ) : (
          renderPlainText(message)
        )}
      </View>
      <Text style={[
        styles.timestamp,
        isUser ? styles.userTimestamp : styles.botTimestamp
      ]}>
        {timestamp}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  botContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: '#8BA889',
    borderColor: '#8BA889',
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E7E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'justify',
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#253528',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  userTimestamp: {
    color: '#49654E',
  },
  botTimestamp: {
    color: '#49654E',
    opacity: 0.7,
  },
  // Markdown styles
  markdownContainer: {
    flexDirection: 'column',
  },
  normalText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#253528',
    textAlign: 'justify',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
    color: '#253528',
    marginBottom: 4,
    textAlign: 'justify',
  },
  emptyLine: {
    fontSize: 16,
    lineHeight: 11,
    color: '#253528',
  },
  h1: {
    fontSize: 20,
    fontWeight: '700',
    color: '#253528',
    marginBottom: 8,
    marginTop: 4,
    textAlign: 'justify',
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#253528',
    marginBottom: 6,
    marginTop: 4,
    textAlign: 'justify',
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528',
    marginBottom: 4,
    marginTop: 4,
    textAlign: 'justify',
  },
  h4: {
    fontSize: 15,
    fontWeight: '600',
    color: '#253528',
    marginBottom: 4,
    marginTop: 4,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    backgroundColor: '#F0F4F0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  specialBlock: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#8BA889',
    fontWeight: '500',
  },
  codeBlock: {
    backgroundColor: '#F0F4F0',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  codeText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#253528',
    lineHeight: 18,
  },
  blockquote: {
    backgroundColor: '#F0F4F0',
    borderLeftWidth: 4,
    borderLeftColor: '#8BA889',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 4,
  },
  blockquoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#253528',
    lineHeight: 22,
    textAlign: 'justify',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 16,
    color: '#253528',
    marginRight: 8,
    lineHeight: 22,
    fontWeight: '600',
  },
  listText: {
    fontSize: 16,
    color: '#253528',
    lineHeight: 22,
    flex: 1,
    textAlign: 'justify',
  },
  link: {
    color: '#8BA889',
    textDecorationLine: 'underline',
    fontSize: 16,
    lineHeight: 22,
  },
});

export default MessageBubble;