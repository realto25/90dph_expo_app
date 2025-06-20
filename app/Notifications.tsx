import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';

// --- Mock Notification Data ---
const MOCK_NOTIFICATIONS = [
  {
    id: 'mock_1',
    title: 'Welcome to Our App!',
    body: 'Thanks for joining. We\'re excited to have you here.',
    timestamp: '2025-06-19T10:00:00Z',
  },
  {
    id: 'mock_2',
    title: 'New Feature Alert: Dark Mode',
    body: 'Check out our brand new dark mode feature in settings!',
    timestamp: '2025-06-18T15:30:00Z',
  },
  {
    id: 'mock_3',
    title: 'Your Order #12345 Has Shipped!',
    body: 'It\'s on its way! Track your package for real-time updates.',
    timestamp: '2025-06-17T09:15:00Z',
  },
  {
    id: 'mock_4',
    title: 'Reminder: Upcoming Webinar',
    body: 'Don\'t miss our webinar on "Mastering React Native" tomorrow at 2 PM IST.',
    timestamp: '2025-06-16T18:00:00Z',
  },
  {
    id: 'mock_5',
    title: 'Special Offer Just for You!',
    body: 'Get 20% off your next purchase with code MOCK20. Limited time only!',
    timestamp: '2025-06-15T12:45:00Z',
  },
];
// ------------------------------

// iOS-style safe area constants
const SAFE_AREA_TOP = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;


export default function NotificationsScreen() { // Renamed to avoid conflict if you had a component called Notifications
  const notifications = MOCK_NOTIFICATIONS;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            {item.timestamp && (
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Changed background to match dashboard for consistency
    paddingTop: SAFE_AREA_TOP + 10, // Adjust padding for safe area and header
    paddingHorizontal: 16, // Added horizontal padding
  },
  header: {
    fontSize: 28, // Larger header
    fontWeight: 'bold',
    marginBottom: 20, // More space
    color: '#1C1C1E',
    textAlign: 'left', // Align to left
  },
  card: {
    backgroundColor: '#fff', // White background for cards
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Consistent shadow
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF', // Primary accent color
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1a202c',
  },
  body: {
    fontSize: 15,
    color: '#4a5568',
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 32,
    fontSize: 16,
    fontStyle: 'italic',
  },
});