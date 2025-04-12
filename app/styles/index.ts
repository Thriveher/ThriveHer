import { StyleSheet, Dimensions } from 'react-native';

// Color constants
const SOFT_GREEN = '#8BA889';
const DEEP_GREEN = '#253528';
const MEDIUM_OLIVE = '#49654E';
const WHITE = '#FFFFFF';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 24,
  },
  imageContainer: {
    flex: 2,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeImage: {
    width: '100%',
    height: '100%',
    maxHeight: height * 0.45,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold', // A sophisticated font similar to Zara's aesthetic
    fontSize: 42,
    letterSpacing: 1,
    color: DEEP_GREEN,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Montserrat-Medium', // A clean, modern font for contrast
    fontSize: 18,
    letterSpacing: 2,
    color: DEEP_GREEN,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  descriptionContainer: {
    width: '85%',
    marginVertical: 24,
  },
  descriptionText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: DEEP_GREEN,
  },
  button: {
    backgroundColor: DEEP_GREEN,
    paddingVertical: 16,
    width: '85%',
    borderRadius: 12,
    marginTop: 24,
    elevation: 4,
  },
  buttonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: WHITE,
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default styles;