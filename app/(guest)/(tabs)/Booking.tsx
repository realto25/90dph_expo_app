import {
  VisitRequest as ApiVisitRequest,
  getVisitRequests,
  submitFeedback,
  cancelVisitRequest, // Add import
} from '@/lib/api';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, scale, scaleFont } from '../../../components/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface VisitRequest extends ApiVisitRequest {}

interface FeedbackState {
  rating: number;
  experience: string;
  suggestions: string;
  purchaseInterest: boolean | null;
  submitted: boolean;
}

type IconName = 'person-circle-outline' | 'calendar-outline' | 'alert-circle-outline';

const Booking: React.FC = () => {
  const { userId, isSignedIn } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<Record<string, FeedbackState>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setError('Please sign in to view your bookings');
      setLoading(false);
      return;
    }
    if (!isOnline) {
      setError('No internet connection. Please try again later.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getVisitRequests(userId);
      setBookings(data);
      setFeedbackData(
        data.reduce(
          (acc, booking) => {
            acc[booking.id] = {
              rating: 0,
              experience: '',
              suggestions: '',
              purchaseInterest: null,
              submitted: !!booking.feedback,
            };
            return acc;
          },
          {} as Record<string, FeedbackState>
        )
      );
      setError(null);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err.message);
      setError(err.message || 'Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, userId, isOnline]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  // Handle feedback submission
  const handleSubmitFeedback = useCallback(
    async (id: string) => {
      if (!isSignedIn || !userId) {
        Alert.alert('Error', 'Please sign in to submit feedback');
        return;
      }
      if (!isOnline) {
        Alert.alert('Error', 'No internet connection. Please try again later.');
        return;
      }

      const feedback = feedbackData[id];
      if (
        !feedback ||
        feedback.rating < 1 ||
        feedback.rating > 5 ||
        !feedback.experience.trim() ||
        !feedback.suggestions.trim() ||
        feedback.purchaseInterest === null
      ) {
        Alert.alert('Error', 'Please complete all feedback fields');
        return;
      }

      setSubmitting((prev) => ({ ...prev, [id]: true }));

      try {
        await submitFeedback({
          visitRequestId: id,
          rating: feedback.rating,
          experience: feedback.experience.trim(),
          suggestions: feedback.suggestions.trim(),
          purchaseInterest: feedback.purchaseInterest,
          clerkId: userId,
        });

        Alert.alert('Success', 'Your feedback has been submitted successfully.');
        setFeedbackData((prev) => ({
          ...prev,
          [id]: { ...prev[id], submitted: true },
        }));
        setExpandedId(null);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to submit feedback. Please try again.');
      } finally {
        setSubmitting((prev) => ({ ...prev, [id]: false }));
      }
    },
    [isSignedIn, userId, feedbackData, isOnline]
  );

  // Handle cancel visit
  const handleCancelVisit = useCallback(
    async (id: string) => {
      if (!isSignedIn || !userId) {
        Alert.alert('Error', 'Please sign in to cancel bookings');
        return;
      }
      if (!isOnline) {
        Alert.alert('Error', 'No internet connection. Please try again later.');
        return;
      }

      Alert.alert('Cancel Visit', 'Are you sure you want to cancel this visit?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelVisitRequest(id, userId);
              setBookings((prev) => prev.filter((booking) => booking.id !== id));
              Alert.alert('Success', 'Visit request cancelled successfully.');
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel visit. Please try again.');
            }
          },
        },
      ]);
    },
    [isSignedIn, userId, isOnline]
  );

  // Fetch bookings on mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Optimize FlatList rendering
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: scale(120),
      offset: scale(120) * index,
      index,
    }),
    []
  );

  // Render content
  const content = useMemo(() => {
    if (!isSignedIn) {
      return (
        <EmptyState
          title="Please sign in to view your bookings."
          iconName="person-circle-outline"
          buttonText="Sign In Now"
          onPress={() => router.push('/(auth)/sign-in')}
        />
      );
    }

    if (loading) {
      return <LoadingState message="Loading your bookings..." />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={fetchBookings} />;
    }

    if (bookings.length === 0) {
      return (
        <EmptyState
          title="You don't have any upcoming visit requests yet."
          iconName="calendar-outline"
          buttonText="Book a Visit"
          onPress={() => router.push('/(guest)/(tabs)/Home')}
        />
      );
    }

    return (
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookingItem
            item={item}
            expandedId={expandedId}
            toggleExpand={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
            feedbackData={feedbackData[item.id]}
            setFeedbackData={(data) =>
              setFeedbackData((prev) => ({
                ...prev,
                [item.id]: { ...prev[item.id], ...data },
              }))
            }
            submitting={submitting[item.id]}
            handleSubmitFeedback={() => handleSubmitFeedback(item.id)}
            handleCancelVisit={() => handleCancelVisit(item.id)}
          />
        )}
        contentContainerStyle={{ padding: scale(16) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentOrange} />
        }
        getItemLayout={getItemLayout}
      />
    );
  }, [
    isSignedIn,
    loading,
    error,
    bookings,
    expandedId,
    feedbackData,
    submitting,
    refreshing,
    onRefresh,
    handleSubmitFeedback,
    handleCancelVisit,
    router,
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceElevated} translucent />
      <LinearGradient
        colors={[colors.surface, colors.surfaceElevated]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Bookings</Text>
      </LinearGradient>
      {content}
    </SafeAreaView>
  );
};

// Components
const EmptyState: React.FC<{
  title: string;
  iconName: IconName;
  buttonText: string;
  onPress: () => void;
}> = ({ title, iconName, buttonText, onPress }) => (
  <View style={styles.emptyState}>
    <Ionicons name={iconName as any} size={scale(80)} color={colors.text.tertiary} />
    <Text style={styles.emptyStateText}>{title}</Text>
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
      accessibilityLabel={buttonText}
      accessibilityRole="button"
    >
      <Text style={styles.buttonText}>{buttonText}</Text>
    </TouchableOpacity>
  </View>
);

const LoadingState: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.loadingState}>
    <ActivityIndicator size="large" color={colors.accentOrange} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <View style={styles.errorState}>
    <Ionicons name="alert-circle-outline" size={scale(80)} color={colors.error} />
    <Text style={styles.errorText}>{message}</Text>
    <TouchableOpacity
      onPress={onRetry}
      style={styles.button}
      accessibilityLabel="Retry loading bookings"
      accessibilityRole="button"
    >
      <Text style={styles.buttonText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

const BookingItem: React.FC<{
  item: VisitRequest;
  expandedId: string | null;
  toggleExpand: () => void;
  feedbackData: FeedbackState;
  setFeedbackData: (data: Partial<FeedbackState>) => void;
  submitting: boolean | undefined;
  handleSubmitFeedback: () => void;
  handleCancelVisit: () => void;
}> = React.memo(
  ({
    item,
    expandedId,
    toggleExpand,
    feedbackData,
    setFeedbackData,
    submitting,
    handleSubmitFeedback,
    handleCancelVisit,
  }) => {
    const isExpanded = expandedId === item.id;
    const isApproved = item.status === 'APPROVED';
    const { rating, experience, suggestions, purchaseInterest, submitted } = feedbackData;

    // Date and time formatting
    const visitDateTime = new Date(`${item.date}T${item.time}`);
    const formattedDate = visitDateTime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = visitDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bookingContainer}
      >
        <TouchableOpacity
          onPress={() => {
            toggleExpand();
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
          style={styles.bookingHeader}
          accessibilityLabel={`Expand booking details for ${item.plot.title}`}
          accessibilityRole="button"
        >
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingTitle}>{item.plot.title}</Text>
            <Text style={styles.bookingSubTitle}>Project: {item.plot.project.name}</Text>
            <Text style={styles.bookingSubTitle}>Location: {item.plot.location}</Text>
            <Text style={styles.bookingDate}>
              Date: {formattedDate} at {formattedTime}
            </Text>
            <View style={[styles.statusBadge, getStatusColor(item.status)]}>
              <Text style={styles.statusText}>Status: {item.status}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={scale(24)}
            color={colors.text.secondary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedSection}>
            {isApproved ? <QrCodeSection item={item} /> : <PendingApproval />}
            {item.status === 'PENDING' && (
              <TouchableOpacity
                onPress={() => {
                  handleCancelVisit();
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                }}
                style={styles.cancelButton}
                accessibilityLabel="Cancel this visit request"
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>Cancel Visit</Text>
              </TouchableOpacity>
            )}
            <FeedbackForm
              feedbackData={feedbackData}
              setFeedbackData={setFeedbackData}
              submitting={submitting}
              handleSubmitFeedback={handleSubmitFeedback}
              submitted={submitted}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    );
  }
);

const QrCodeSection: React.FC<{ item: VisitRequest }> = ({ item }) => {
  const expiresAtDate = item.expiresAt ? new Date(item.expiresAt) : null;
  const isQrCodeExpired = expiresAtDate ? expiresAtDate < new Date() : false;
  const qrCodeValue = item.id;

  return (
    <View style={styles.qrCodeSection}>
      <Text style={styles.qrCodeTitle}>Your Visit QR Code</Text>
      {qrCodeValue ? (
        <>
          <QRCode
            value={qrCodeValue}
            size={scale(200)}
            backgroundColor={colors.surfaceHover}
            color={colors.text.primary}
          />
          <Text style={styles.qrCodeExpiry}>
            Expires at:{' '}
            {expiresAtDate && !isNaN(expiresAtDate.getTime())
              ? expiresAtDate.toLocaleString()
              : 'N/A'}
          </Text>
          {isQrCodeExpired && <Text style={styles.qrCodeExpired}>This QR code has expired.</Text>}
        </>
      ) : (
        <Text style={styles.qrCodeNotAvailable}>QR Code not available.</Text>
      )}
    </View>
  );
};

const PendingApproval: React.FC = () => (
  <View style={styles.pendingApproval}>
    <Text style={styles.pendingApprovalText}>
      QR Code will be available once your visit request is approved.
    </Text>
    <Text style={styles.pendingApprovalDescription}>
      Please check back later or contact support if you have questions.
    </Text>
  </View>
);

const FeedbackForm: React.FC<{
  feedbackData: FeedbackState;
  setFeedbackData: (data: Partial<FeedbackState>) => void;
  submitting: boolean | undefined;
  handleSubmitFeedback: () => void;
  submitted: boolean;
}> = ({ feedbackData, setFeedbackData, submitting, handleSubmitFeedback, submitted }) => {
  const { rating, experience, suggestions, purchaseInterest } = feedbackData;

  if (submitted) {
    return (
      <View style={styles.feedbackSubmitted}>
        <Ionicons name="checkmark-circle" size={scale(24)} color={colors.success} />
        <Text style={styles.feedbackSubmittedText}>Feedback already submitted for this visit!</Text>
      </View>
    );
  }

  return (
    <View style={styles.feedbackForm}>
      <Text style={styles.feedbackFormTitle}>Share Your Feedback</Text>
      <RatingSection rating={rating} setRating={(value) => setFeedbackData({ rating: value })} />
      <TextInputSection
        label="Tell us about your experience"
        value={experience}
        onChangeText={(text) => setFeedbackData({ experience: text })}
      />
      <TextInputSection
        label="Do you have any suggestions for improvement?"
        value={suggestions}
        onChangeText={(text) => setFeedbackData({ suggestions: text })}
      />
      <PurchaseInterest
        value={purchaseInterest}
        setPurchaseInterest={(value) => setFeedbackData({ purchaseInterest: value })}
      />
      <SubmitButton submitting={submitting} onPress={handleSubmitFeedback} />
    </View>
  );
};

const RatingSection: React.FC<{
  rating: number;
  setRating: (value: number) => void;
}> = ({ rating, setRating }) => (
  <View style={styles.ratingSection}>
    <Text style={styles.sectionLabel}>
      How would you rate your visit? <Text style={styles.required}>*</Text>
    </Text>
    <View style={styles.ratingStars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => {
            setRating(star);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
          style={styles.starButton}
          accessibilityLabel={`Rate ${star} stars`}
          accessibilityRole="button"
        >
          <Ionicons
            name={rating >= star ? 'star' : 'star-outline'}
            size={scale(36)}
            color={rating >= star ? colors.accentOrange : colors.text.tertiary}
          />
        </TouchableOpacity>
      ))}
    </View>
    <Text style={styles.ratingDescription}>
      {rating > 0
        ? ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]
        : 'Tap to rate your experience'}
    </Text>
  </View>
);

const TextInputSection: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}> = ({ label, value, onChangeText }) => (
  <View style={styles.textInputSection}>
    <Text style={styles.sectionLabel}>
      {label} <Text style={styles.required}>*</Text>
    </Text>
    <TextInput
      style={styles.textInput}
      placeholder="Your thoughts..."
      placeholderTextColor={colors.text.tertiary}
      multiline
      numberOfLines={4}
      value={value || ''}
      onChangeText={onChangeText}
      accessibilityLabel={label}
      accessibilityRole="text"
    />
  </View>
);

const PurchaseInterest: React.FC<{
  value: boolean | null;
  setPurchaseInterest: (value: boolean | null) => void;
}> = ({ value, setPurchaseInterest }) => (
  <View style={styles.purchaseInterest}>
    <Text style={styles.sectionLabel}>
      Are you interested in purchasing this property? <Text style={styles.required}>*</Text>
    </Text>
    <View style={styles.purchaseButtons}>
      {['Yes', 'No', 'Maybe'].map((option) => (
        <TouchableOpacity
          key={option}
          onPress={() => {
            setPurchaseInterest(option === 'Yes' ? true : option === 'No' ? false : null);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
          style={[
            styles.purchaseButton,
            value === (option === 'Yes' ? true : option === 'No' ? false : null)
              ? styles.activePurchaseButton
              : null,
          ]}
          accessibilityLabel={`Select ${option} for purchase interest`}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.purchaseButtonText,
              value === (option === 'Yes' ? true : option === 'No' ? false : null)
                ? styles.activePurchaseButtonText
                : null,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const SubmitButton: React.FC<{
  submitting: boolean | undefined;
  onPress: () => void;
}> = ({ submitting, onPress }) => (
  <TouchableOpacity
    onPress={() => {
      onPress();
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }}
    disabled={submitting}
    style={[styles.submitButton, submitting ? styles.disabledButton : null]}
    accessibilityLabel="Submit feedback"
    accessibilityRole="button"
  >
    {submitting ? (
      <ActivityIndicator color={colors.text.inverse} />
    ) : (
      <Text style={styles.submitButtonText}>Submit Feedback</Text>
    )}
  </TouchableOpacity>
);

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
  },
  header: {
    paddingHorizontal: scale(15),
    paddingVertical: scale(15),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: scaleFont(24),
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(16),
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: scaleFont(18),
    fontWeight: '500',
    color: colors.text.tertiary,
    marginVertical: scale(8),
  },
  button: {
    backgroundColor: colors.accentOrange,
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(12),
    marginTop: scale(16),
    shadowColor: colors.accentOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: scaleFont(16),
    textAlign: 'center',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: scaleFont(16),
    color: colors.text.tertiary,
    marginTop: scale(8),
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(16),
  },
  errorText: {
    textAlign: 'center',
    fontSize: scaleFont(18),
    fontWeight: '500',
    color: colors.error,
    marginVertical: scale(8),
  },
  bookingContainer: {
    marginBottom: scale(16),
  },
  bookingHeader: {
    backgroundColor: colors.surface,
    borderRadius: scale(12),
    padding: scale(16),
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderColor: colors.border.light,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: scale(4),
  },
  bookingSubTitle: {
    fontSize: scaleFont(14),
    color: colors.text.secondary,
    marginBottom: scale(2),
  },
  bookingDate: {
    fontSize: scaleFont(16),
    fontWeight: '500',
    color: colors.text.secondary,
  },
  statusBadge: {
    marginTop: scale(8),
    alignSelf: 'flex-start',
    paddingVertical: scale(4),
    paddingHorizontal: scale(12),
    borderRadius: scale(16),
    borderWidth: 1,
  },
  statusText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: colors.text.inverse,
  },
  expandedSection: {
    marginTop: scale(8),
  },
  qrCodeSection: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surfaceHover,
    borderRadius: scale(12),
    padding: scale(16),
    alignItems: 'center',
    marginBottom: scale(16),
  },
  qrCodeTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: colors.accentOrange,
    marginBottom: scale(12),
  },
  qrCodeExpiry: {
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: scale(8),
    fontSize: scaleFont(14),
  },
  qrCodeExpired: {
    fontWeight: '700',
    color: colors.error,
    marginTop: scale(8),
    textAlign: 'center',
    fontSize: scaleFont(14),
  },
  qrCodeNotAvailable: {
    fontWeight: '700',
    color: colors.error,
    textAlign: 'center',
    fontSize: scaleFont(14),
  },
  pendingApproval: {
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.surfaceElevated,
    borderRadius: scale(12),
    padding: scale(16),
    textAlign: 'center',
  },
  pendingApprovalText: {
    fontSize: scaleFont(16),
    fontWeight: '500',
    color: colors.accent,
  },
  pendingApprovalDescription: {
    fontSize: scaleFont(14),
    color: colors.text.secondary,
    marginTop: scale(4),
  },
  cancelButton: {
    backgroundColor: colors.error,
    borderRadius: scale(12),
    padding: scale(12),
    alignItems: 'center',
    marginBottom: scale(16),
  },
  cancelButtonText: {
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: scaleFont(16),
  },
  feedbackForm: {
    backgroundColor: colors.surface,
    borderRadius: scale(12),
    padding: scale(16),
    shadowColor: colors.primary,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  feedbackFormTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: scale(16),
  },
  feedbackSubmitted: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(16),
    backgroundColor: colors.success + '15',
    borderRadius: scale(12),
  },
  feedbackSubmittedText: {
    fontWeight: '600',
    color: colors.success,
    marginLeft: scale(8),
    fontSize: scaleFont(14),
  },
  ratingSection: {
    marginBottom: scale(24),
  },
  sectionLabel: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: scale(8),
  },
  required: {
    color: colors.error,
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starButton: {
    padding: scale(8),
  },
  ratingDescription: {
    fontSize: scaleFont(14),
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: scale(4),
  },
  textInputSection: {
    marginBottom: scale(24),
  },
  textInput: {
    fontSize: scaleFont(16),
    color: colors.text.primary,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: scale(8),
    padding: scale(12),
    textAlignVertical: 'top',
  },
  purchaseInterest: {
    marginBottom: scale(32),
  },
  purchaseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  purchaseButton: {
    flex: 1,
    marginHorizontal: scale(4),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.surfaceElevated,
  },
  activePurchaseButton: {
    backgroundColor: colors.accentOrange,
    borderColor: colors.accentOrange,
  },
  activePurchaseButtonText: {
    color: colors.text.inverse,
  },
  purchaseButtonText: {
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: scaleFont(14),
  },
  submitButton: {
    backgroundColor: colors.accentOrange,
    borderRadius: scale(12),
    paddingVertical: scale(12),
    alignItems: 'center',
    shadowColor: colors.accentOrange,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.text.inverse,
    fontWeight: '700',
    fontSize: scaleFont(16),
  },
});

// Utility function
const getStatusColor = (status: string) => {
  const colorsMap = {
    APPROVED: { backgroundColor: colors.success + '20', borderColor: colors.success },
    PENDING: { backgroundColor: colors.warning + '20', borderColor: colors.warning },
    REJECTED: { backgroundColor: colors.error + '20', borderColor: colors.error },
    COMPLETED: { backgroundColor: colors.accent + '20', borderColor: colors.accent },
  };
  return (
    colorsMap[status as keyof typeof colorsMap] || {
      backgroundColor: colors.border.light,
      borderColor: colors.border.medium,
    }
  );
};

export default Booking;
