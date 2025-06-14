import LeaveRequestForm from "@/components/LeaveRequestForm";
import { LeaveRequestHistory } from "@/components/LeaveRequestHistory";
import { View, ScrollView, StyleSheet, Text, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from "react";

const { width } = Dimensions.get('window');

export default function Leave() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {/* Enhanced Header with Gradient and Decorative Elements */}
      <LinearGradient 
        colors={['#ff8c00', '#ffa500', '#ffb700']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Leave Management</Text>
          <Text style={styles.subtitle}>Manage your time off requests</Text>
        </View>
        
        {/* Decorative circles with orange theme */}
        <View style={[styles.decorativeCircle1, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]} />
        <View style={[styles.decorativeCircle2, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
        <View style={[styles.decorativeCircle3, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]} />
      </LinearGradient>

      {/* Background gradient overlay */}
      <LinearGradient 
        colors={['#f8fafc', '#f1f5f9']} 
        style={styles.backgroundGradient}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Leave Request Section */}
          <Animated.View 
            style={[
              styles.section, 
              styles.primarySection,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <View style={styles.icon}>
                  <Text style={styles.iconText}>📝</Text>
                </View>
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Request Leave</Text>
                <Text style={styles.sectionDescription}>
                  Submit a new leave request
                </Text>
              </View>
            </View>
            <View style={styles.formContainer}>
              <LeaveRequestForm />
            </View>
          </Animated.View>

          {/* Leave History Section */}
          <Animated.View 
            style={[
              styles.section,
              styles.secondarySection,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <View style={[styles.icon, styles.historyIcon]}>
                  <Text style={styles.iconText}>📋</Text>
                </View>
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Leave History</Text>
                <Text style={styles.sectionDescription}>
                  View your past requests
                </Text>
              </View>
            </View>
            <View style={styles.historyContainer}>
              <LeaveRequestHistory />
            </View>
          </Animated.View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ff8c00',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Manrope-Bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  primarySection: {
    backgroundColor: '#ffffff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  secondarySection: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    marginRight: 16,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff8c00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  historyIcon: {
    backgroundColor: '#ffa500',
    shadowColor: '#ffa500',
  },
  iconText: {
    fontSize: 20,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Manrope-Bold',
    color: '#1e293b',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope-Medium',
    color: '#64748b',
    letterSpacing: 0.1,
  },
  formContainer: {
    padding: 24,
  },
  historyContainer: {
    padding: 24,
  },
  bottomSpacing: {
    height: 32,
  },
});
