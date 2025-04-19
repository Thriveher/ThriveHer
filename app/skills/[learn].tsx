import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { getLessonById } from '../data/learn';
import { Ionicons } from '@expo/vector-icons';

// Define types for our data structure
type InformationCard = {
  type: 'information';
  id: string;
  title: string;
  content: string;
  youtubeId?: string;
}

type QuestionCard = {
  type: 'question';
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

type CompletionCard = {
  type: 'completion';
  id: string;
  title: string;
  message: string;
  score?: number;
}

type LessonCard = InformationCard | QuestionCard | CompletionCard;

type Lesson = {
  id: string;
  title: string;
  description: string;
  cards: LessonCard[];
}

// Define route param type
type RouteParams = {
  Skills: {
    id: string;
  }
}

const { width } = Dimensions.get('window');

export default function LearnScreen() {
  const route = useRoute<RouteProp<RouteParams, 'Skills'>>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        // Fetch the lesson data for this specific ID
        const data = await getLessonById(id);
        setLesson(data);
        
        // Count total questions for scoring
        const questions = data.cards.filter(card => card.type === 'question');
        setTotalQuestions(questions.length);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lesson:', error);
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  const handleNextCard = () => {
    if (lesson && currentCardIndex < lesson.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    }
  };

  const handleSelectAnswer = (optionId: string) => {
    if (!isAnswerSubmitted) {
      setSelectedAnswer(optionId);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer && !isAnswerSubmitted) {
      setIsAnswerSubmitted(true);
      
      // Get current card
      const currentCard = lesson?.cards[currentCardIndex] as QuestionCard;
      
      // Check if selected answer is correct
      const selectedOption = currentCard.options.find(option => option.id === selectedAnswer);
      
      if (selectedOption?.isCorrect) {
        setCorrectAnswers(correctAnswers + 1);
      }
    }
  };

  const handleRestartLesson = () => {
    setCurrentCardIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setCorrectAnswers(0);
  };

  const renderInformationCard = (card: InformationCard) => (
    <View style={styles.cardContainer}>
      <Text style={styles.cardTitle}>{card.title}</Text>
      <Text style={styles.informationText}>{card.content}</Text>
      
      {card.youtubeId && (
        <View style={styles.videoContainer}>
          <Image 
            source={{ uri: `https://img.youtube.com/vi/${card.youtubeId}/hqdefault.jpg` }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
          <View style={styles.playButtonOverlay}>
            <Ionicons name="play-circle" size={50} color="#FFFFFF" />
          </View>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.nextButton}
        onPress={handleNextCard}
      >
        <Text style={styles.nextButtonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderQuestionCard = (card: QuestionCard) => (
    <View style={styles.cardContainer}>
      <Text style={styles.cardTitle}>Question</Text>
      <Text style={styles.questionText}>{card.question}</Text>
      
      <View style={styles.optionsContainer}>
        {card.options.map((option) => {
          // Determine option styling based on selection and submission
          const isSelected = selectedAnswer === option.id;
          const showCorrectAnswer = isAnswerSubmitted;
          const isCorrect = option.isCorrect;
          
          return (
            <TouchableOpacity 
              key={option.id}
              style={[
                styles.optionButton,
                isSelected && styles.selectedOption,
                showCorrectAnswer && isCorrect && styles.correctOption,
                showCorrectAnswer && isSelected && !isCorrect && styles.incorrectOption
              ]}
              onPress={() => handleSelectAnswer(option.id)}
              disabled={isAnswerSubmitted}
            >
              <Text style={[
                styles.optionText,
                isSelected && styles.selectedOptionText,
                showCorrectAnswer && isCorrect && styles.correctOptionText,
                showCorrectAnswer && isSelected && !isCorrect && styles.incorrectOptionText
              ]}>
                {option.text}
              </Text>
              
              {showCorrectAnswer && isCorrect && (
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" style={styles.answerIcon} />
              )}
              
              {showCorrectAnswer && isSelected && !isCorrect && (
                <Ionicons name="close-circle" size={22} color="#FFFFFF" style={styles.answerIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {!isAnswerSubmitted ? (
        <TouchableOpacity 
          style={[styles.submitButton, !selectedAnswer && styles.disabledButton]}
          onPress={handleSubmitAnswer}
          disabled={!selectedAnswer}
        >
          <Text style={styles.submitButtonText}>Submit Answer</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNextCard}
        >
          <Text style={styles.nextButtonText}>Next Question</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCompletionCard = (card: CompletionCard) => (
    <View style={styles.cardContainer}>
      <View style={styles.completionIconContainer}>
        <Ionicons name="trophy" size={60} color="#FFD700" />
      </View>
      <Text style={styles.completionTitle}>{card.title}</Text>
      <Text style={styles.completionMessage}>{card.message}</Text>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>
          You scored {correctAnswers} out of {totalQuestions}
        </Text>
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              {width: `${(correctAnswers / totalQuestions) * 100}%`}
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.completionButtonsContainer}>
        <TouchableOpacity 
          style={styles.restartButton}
          onPress={handleRestartLesson}
        >
          <Ionicons name="refresh" size={18} color="#49654E" />
          <Text style={styles.restartButtonText}>Restart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.completeButtonText}>Complete</Text>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentCard = () => {
    if (!lesson || !lesson.cards.length) return null;
    
    const currentCard = lesson.cards[currentCardIndex];
    
    switch (currentCard.type) {
      case 'information':
        return renderInformationCard(currentCard);
      case 'question':
        return renderQuestionCard(currentCard);
      case 'completion':
        return renderCompletionCard(currentCard);
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8BA889" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#253528" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{lesson?.title || ''}</Text>
        
        <View style={styles.progressIndicatorContainer}>
          {lesson?.cards.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.progressDot,
                currentCardIndex === index && styles.activeProgressDot
              ]} 
            />
          ))}
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderCurrentCard()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#49654E',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFE8',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#253528',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#253528',
    marginBottom: 16,
  },
  progressIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8EFE8',
    marginHorizontal: 4,
  },
  activeProgressDot: {
    backgroundColor: '#8BA889',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#253528',
    marginBottom: 16,
  },
  informationText: {
    fontSize: 16,
    color: '#49654E',
    lineHeight: 24,
    marginBottom: 20,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  nextButton: {
    backgroundColor: '#8BA889',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  questionText: {
    fontSize: 18,
    color: '#253528',
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: '#F6F9F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#E8EFE8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#8BA889',
    backgroundColor: '#F0F5F0',
  },
  correctOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  incorrectOption: {
    borderColor: '#F44336',
    backgroundColor: '#F44336',
  },
  optionText: {
    fontSize: 16,
    color: '#49654E',
    flex: 1,
  },
  selectedOptionText: {
    color: '#253528',
    fontWeight: '500',
  },
  correctOptionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  incorrectOptionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  answerIcon: {
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#8BA889',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#D0D0D0',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completionIconContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 20,
    borderRadius: 40,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#253528',
    textAlign: 'center',
    marginBottom: 12,
  },
  completionMessage: {
    fontSize: 16,
    color: '#49654E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  scoreContainer: {
    marginBottom: 28,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#253528',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#E8EFE8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8BA889',
    borderRadius: 10,
  },
  completionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8BA889',
    flex: 1,
    marginRight: 10,
  },
  restartButtonText: {
    color: '#49654E',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  completeButton: {
    backgroundColor: '#8BA889',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 6,
  },
});