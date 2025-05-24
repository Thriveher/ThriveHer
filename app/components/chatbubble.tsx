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
    const lines = text.split('\n');
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle headers (including #### for h4)
      if (line.startsWith('#### ')) {
        elements.push(
          <Text key={key++} style={styles.h4}>
            {line.substring(5)}
          </Text>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <Text key={key++} style={styles.h3}>
            {line.substring(4)}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <Text key={key++} style={styles.h2}>
            {line.substring(3)}
          </Text>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <Text key={key++} style={styles.h1}>
            {line.substring(2)}
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
              {line.substring(2)}
            </Text>
          </View>
        );
      }
      // Handle bullet points (-, *, and + for unordered lists)
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
      // Handle regular paragraphs (including empty lines as line breaks)
      else if (line.trim()) {
        elements.push(
          <Text key={key++} style={styles.paragraph}>
            {parseInlineMarkdown(line)}
          </Text>
        );
      }
      // Handle empty lines as line breaks (enhanced \n handling)
      else {
        elements.push(<View key={key++} style={styles.lineBreak} />);
      }
    }

    return elements;
  };

  // Parse inline markdown with proper link handling (both markdown links and plain URLs)
  const parseInlineMarkdown = (text: string): JSX.Element => {
    // Check for both markdown links and plain URLs
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    
    const hasMarkdownLinks = markdownLinkRegex.test(text);
    const hasPlainUrls = urlRegex.test(text);
    
    if (!hasMarkdownLinks && !hasPlainUrls) {
      // No links, parse other markdown normally
      return parseTextWithFormatting(text);
    }

    // Find all links (both types)
    const allLinks: Array<{
      start: number;
      end: number;
      text: string;
      url: string;
      type: 'markdown' | 'plain';
    }> = [];

    // Reset regex
    markdownLinkRegex.lastIndex = 0;
    urlRegex.lastIndex = 0;

    // Find markdown links
    let match;
    while ((match = markdownLinkRegex.exec(text)) !== null) {
      allLinks.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        url: match[2],
        type: 'markdown'
      });
    }

    // Find plain URLs
    while ((match = urlRegex.exec(text)) !== null) {
      const url = match[0];
      // Check if this URL is already part of a markdown link
      const isPartOfMarkdownLink = allLinks.some(link => 
        link.type === 'markdown' && 
        match.index >= link.start && 
        match.index < link.end
      );
      
      if (!isPartOfMarkdownLink) {
        allLinks.push({
          start: match.index,
          end: match.index + match[0].length,
          text: url,
          url: url,
          type: 'plain'
        });
      }
    }

    // Sort links by start position
    allLinks.sort((a, b) => a.start - b.start);

    // Parse text with links
    const elements: JSX.Element[] = [];
    let lastIndex = 0;
    let key = 0;
    
    allLinks.forEach(link => {
      // Add text before link
      if (link.start > lastIndex) {
        const beforeText = text.substring(lastIndex, link.start);
        if (beforeText) {
          elements.push(
            <Text key={key++}>
              {parseTextWithFormatting(beforeText)}
            </Text>
          );
        }
      }
      
      // Add clickable link
      elements.push(
        <Text
          key={key++}
          style={styles.link}
          onPress={() => handleLinkPress(link.url)}
        >
          {link.text}
        </Text>
      );
      
      lastIndex = link.end;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        elements.push(
          <Text key={key++}>
            {parseTextWithFormatting(remainingText)}
          </Text>
        );
      }
    }
    
    return <Text>{elements}</Text>;
  };

  // Parse text formatting (bold, italic, code, and { } blocks) without links, handling newlines
  const parseTextWithFormatting = (text: string): JSX.Element => {
    // Enhanced newline handling - treat ALL newlines as line breaks, including connected words
    if (text.includes('\n')) {
      const parts = text.split('\n');
      return (
        <Text>
          {parts.map((part, index) => (
            <Text key={index}>
              {part ? parseLineFormatting(part) : ''}
              {index < parts.length - 1 && '\n'}
            </Text>
          ))}
        </Text>
      );
    }
    
    return parseLineFormatting(text);
  };

  // Parse formatting for a single line
  const parseLineFormatting = (text: string): JSX.Element => {
    const elements: JSX.Element[] = [];
    let currentIndex = 0;
    let key = 0;

    // Regex patterns for inline markdown (including { } for special formatting)
    const patterns = [
      { regex: /\*\*((?:[^*]|\*(?!\*))+?)\*\*/g, style: styles.bold },   // **bold** (improved)
      { regex: /\*([^*]+?)\*/g, style: styles.italic },                  // *italic* (improved)
      { regex: /`([^`]+?)`/g, style: styles.inlineCode },                // `code` (improved)
      { regex: /\{([^}]+?)\}/g, style: styles.specialBlock },            // {special formatting} (improved)
    ];

    // Find all matches
    const allMatches: Array<{
      match: RegExpExecArray;
      pattern: typeof patterns[0];
      index: number;
    }> = [];

    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          match,
          pattern,
          index: match.index
        });
      }
    });

    // Sort matches by index and handle overlapping matches
    allMatches.sort((a, b) => a.index - b.index);

    // Remove overlapping matches (keep the first one)
    const filteredMatches = [];
    let lastEnd = 0;
    
    for (const matchObj of allMatches) {
      if (matchObj.match.index >= lastEnd) {
        filteredMatches.push(matchObj);
        lastEnd = matchObj.match.index + matchObj.match[0].length;
      }
    }

    // Process matches
    filteredMatches.forEach(({ match, pattern }) => {
      // Add text before this match
      if (match.index > currentIndex) {
        const beforeText = text.substring(currentIndex, match.index);
        if (beforeText) {
          elements.push(
            <Text key={key++} style={styles.normalText}>
              {beforeText}
            </Text>
          );
        }
      }

      // Handle the match
      elements.push(
        <Text key={key++} style={[styles.normalText, pattern.style]}>
          {match[1]}
        </Text>
      );

      currentIndex = match.index + match[0].length;
    });

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        elements.push(
          <Text key={key++} style={styles.normalText}>
            {remainingText}
          </Text>
        );
      }
    }

    // If no matches found, return the original text
    if (elements.length === 0) {
      return (
        <Text style={styles.normalText}>
          {text}
        </Text>
      );
    }

    return <Text>{elements}</Text>;
  };

  // Enhanced markdown detection including new elements
  const hasMarkdown = /[*_`#\[\]!+{}-]/.test(message) || 
                     message.includes('```') || 
                     message.includes('> ') ||
                     message.includes('#### ') ||
                     /^\d+\.\s/.test(message) ||
                     /^[+*-]\s/.test(message) ||
                     /https?:\/\//.test(message) ||
                     message.includes('\n') ||
                     /\{.*?\}/.test(message) ||
                     /\*\*.*?\*\*/.test(message) ||
                     /\n\S/.test(message) || // Detect newline followed by any non-whitespace
                     message.split('\n').length > 1; // Any multiline text should be treated as markdown

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
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.botText
          ]}>
            {message.split('\n').map((line, index, array) => (
              <Text key={index}>
                {line}
                {index < array.length - 1 && '\n'}
              </Text>
            ))}
          </Text>
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
  lineBreak: {
    height: 8,
  },
});

export default MessageBubble;