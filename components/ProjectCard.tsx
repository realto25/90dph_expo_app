import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { ProjectType } from '../lib/api';
import { colors, scale, scaleFont } from '../components/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

const DEFAULT_IMAGE = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

interface ProjectCardProps {
  project: ProjectType;
  index: number;
  style?: object;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, style }) => {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const formatPrice = (priceRange?: string) => {
    if (!priceRange) return 'Price on request';
    try {
      if (priceRange.includes('-')) {
        const minPrice = priceRange.split('-')[0].trim();
        return minPrice;
      }
      return priceRange.trim();
    } catch (err) {
      console.error('Error formatting price:', err);
      return 'Price on request';
    }
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      import('expo-haptics').then((Haptics) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      });
    }
    router.push(`/(guest)/(tabs)/Explore`);
    if (Platform.OS !== 'web' && AccessibilityInfo.announceForAccessibility) {
      AccessibilityInfo.announceForAccessibility(`Navigating to ${project.name || 'project details'}`);
    }
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          width: CARD_WIDTH,
        },
        style,
      ]}
    >
      <TouchableOpacity
        accessible
        accessibilityLabel={`View details for ${project.name || 'project'}`}
        accessibilityRole="button"
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: project.imageUrl || DEFAULT_IMAGE }}
            style={styles.image}
            resizeMode="cover"
            onError={(e) => {
              e.currentTarget.setNativeProps({
                source: { uri: DEFAULT_IMAGE },
              });
            }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{formatPrice(project.priceRange)}</Text>
          </View>
          <TouchableOpacity
            accessible
            accessibilityLabel="Add to favorites"
            accessibilityRole="button"
            style={styles.favoriteButton}
            onPress={() => {
              console.log('Favorite toggled for:', project.id);
            }}
          >
            <Ionicons name="heart-outline" size={scale(22)} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {project.name || 'Unnamed Project'}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={scale(14)} color={colors.warning} />
              <Text style={styles.ratingText}>{project.rating?.toFixed(1) || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={scale(16)} color={colors.text.tertiary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {project.location || 'Location not specified'}
            </Text>
          </View>
          {project.amenities && project.amenities.length > 0 && (
            <View style={styles.amenitiesContainer}>
              {project.amenities.slice(0, 3).map((amenity, idx) => (
                <View key={idx} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
              {project.amenities.length > 3 && (
                <View style={styles.amenityTag}>
                  <Text style={styles.amenityText}>+{project.amenities.length - 3} more</Text>
                </View>
              )}
            </View>
          )}
          <View style={styles.footer}>
            <View style={styles.availabilityContainer}>
              <View style={styles.availabilityDot} />
              <Text style={styles.availabilityText}>{project.plotsAvailable ?? 0} Available</Text>
            </View>
            <TouchableOpacity
              accessible
              accessibilityLabel="View project details"
              accessibilityRole="button"
              style={styles.viewDetailsButton}
              onPress={handlePress}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: scale(12),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignSelf: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    height: scale(200),
    width: '100%',
    borderTopLeftRadius: scale(12),
    borderTopRightRadius: scale(12),
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scale(80),
  },
  priceTag: {
    position: 'absolute',
    bottom: scale(16),
    left: scale(16),
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(16),
  },
  priceText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    color: colors.success,
  },
  favoriteButton: {
    position: 'absolute',
    top: scale(12),
    right: scale(12),
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: scale(8),
    borderRadius: scale(16),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: scale(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scale(8),
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    marginRight: scale(8),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border.light,
    paddingHorizontal: scale(6),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  ratingText: {
    fontSize: scaleFont(12),
    fontWeight: '500',
    color: colors.text.secondary,
    marginLeft: scale(4),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  locationText: {
    fontSize: scaleFont(12),
    fontWeight: '400',
    color: colors.text.secondary,
    marginLeft: scale(4),
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    marginBottom: scale(12),
  },
  amenityTag: {
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  amenityText: {
    fontSize: scaleFont(10),
    fontWeight: '500',
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: colors.success,
    marginRight: scale(6),
  },
  availabilityText: {
    fontSize: scaleFont(12),
    fontWeight: '500',
    color: colors.text.secondary,
  },
  viewDetailsButton: {
    backgroundColor: colors.success,
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: 10,
  },
  viewDetailsText: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    color: colors.text.inverse,
  },
});

export default ProjectCard;
