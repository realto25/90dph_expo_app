import React, { useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Animated,
  StatusBar,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function Onboarding() {
  const router = useRouter();
  
  // Animation refs
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoTranslateY = useRef(new Animated.Value(50)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(50)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  
  // Floating animation
  const floatingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Set status bar
    StatusBar.setBarStyle('light-content');
    
    // Start animations sequence
    startAnimationSequence();
    
    // Start floating animation
    startFloatingAnimation();
  }, []);

  const startAnimationSequence = () => {
    // Background fade in
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Logo animation sequence
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(logoTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Title animation
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Subtitle animation
    Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Button animation
    Animated.sequence([
      Animated.delay(1600),
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const startFloatingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleGetStarted = useCallback(async () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    await AsyncStorage.setItem('onboardingComplete', 'true');
    router.replace('/(auth)/sign-in');
  }, [router, buttonScale]);

  const floatingTranslateY = floatingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Animated Background */}
      <Animated.View 
        style={[
          styles.backgroundContainer,
          { opacity: backgroundOpacity }
        ]}
      >
        <LinearGradient
          colors={['#ff6b35', '#f97316', '#ea580c']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Decorative Elements */}
      <View style={styles.decorativeElements}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo with Animation */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: Animated.add(logoTranslateY, floatingTranslateY) }
              ],
            }
          ]}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/adaptive-icon.png')} // Your logo image
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            }
          ]}
        >
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.brandName}>90 Degree</Text>
          <Text style={styles.brandSubName}>Pride Homes</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View
          style={[
            styles.subtitleContainer,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            }
          ]}
        >
          <Text style={styles.subtitle}>
            Find, book, and manage your dream property with ease.
          </Text>
        </Animated.View>

        {/* Get Started Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonOpacity,
              transform: [{ scale: buttonScale }],
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bottom Wave */}
      <View style={styles.bottomWave}>
        <View style={styles.wave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1000,
  },
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 150,
    height: 150,
    top: height * 0.2,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    bottom: height * 0.1,
    right: -50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  logoContainer: {
    marginBottom: 60,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  brandName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandSubName: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleContainer: {
    marginBottom: 80,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.5,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 50,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f97316',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bottomWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
});