import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CommandSuggestionsProps {
  onSelectCommand: (command: string) => void;
}

// Define a type for valid MaterialIcons names
type MaterialIconName = 'work' | 'description' | 'attach-money';

interface CommandItem {
  command: string;
  description: string;
  icon: MaterialIconName;
  examples: string[];
}

const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({ onSelectCommand }) => {
  const commands: CommandItem[] = [
    {
      command: '/job',
      description: 'Search for jobs',
      icon: 'work',
      examples: ['software engineer', 'data scientist', 'project manager']
    },
    {
      command: '/job-details',
      description: 'Get detailed information about a specific job',
      icon: 'description',
      examples: ['<job-id>']
    },
    {
      command: '/salary',
      description: 'Get salary information for a job role',
      icon: 'attach-money',
      examples: ['software engineer', 'marketing manager in New York']
    }
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {commands.map((item) => (
          <TouchableOpacity
            key={item.command}
            style={styles.commandItem}
            onPress={() => onSelectCommand(item.command)}
          >
            <MaterialIcons 
              name={item.icon as any} 
              size={24} 
              color="#49654E" 
              style={styles.commandIcon} 
            />
            <View style={styles.commandTextContainer}>
              <Text style={styles.commandText}>{item.command}</Text>
              <Text style={styles.commandDescription}>{item.description}</Text>
              <Text style={styles.examplesText}>
                Examples: {item.examples.map((example, i) => (
                  <Text key={i} style={styles.exampleText}>
                    {`${item.command} ${example}`}{i < item.examples.length - 1 ? ', ' : ''}
                  </Text>
                ))}
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
    position: 'absolute',
    bottom: 70, // Position above the input container
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    maxHeight: 200,
    borderRadius: 8,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollView: {
    maxHeight: 200,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  commandIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  commandTextContainer: {
    flex: 1,
  },
  commandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528',
    marginBottom: 2,
  },
  commandDescription: {
    fontSize: 14,
    color: '#49654E',
    marginBottom: 4,
  },
  examplesText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  exampleText: {
    fontSize: 12,
    color: '#49654E',
  },
});

export default CommandSuggestions;