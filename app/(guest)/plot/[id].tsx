import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { getPlotById, PlotType } from "../../../lib/api";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: width,
    height: 320,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  headerControls: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: 48,
    right: 80,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
  },
  contentCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  contentPadding: {
    padding: 24,
  },
  priceBadge: {
    backgroundColor: '#F97316',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  priceText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationText: {
    color: '#4B5563',
    marginLeft: 8,
    fontSize: 16,
  },
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    color: '#111827',
    fontWeight: '600',
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  aboutText: {
    color: '#4B5563',
    lineHeight: 24,
  },
  amenitiesContainer: {
    marginBottom: 24,
  },
  amenityTag: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    color: '#C2410C',
    fontWeight: '500',
  },
  mapContainer: {
    marginBottom: 24,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  mapView: {
    height: 192,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bottomButton: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  bookButton: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    color: '#4B5563',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorCard: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  aboutContainer: {
    marginBottom: 24,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: '#6B7280',
    marginTop: 8,
    fontSize: 14,
  },
});

export default function PlotDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [plot, setPlot] = useState<PlotType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) {
      setError("Plot ID is missing");
      setLoading(false);
      return;
    }
    fetchPlotDetails();
  }, [id]);

  useEffect(() => {
    if (plot?.imageUrls && plot.imageUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % (plot?.imageUrls?.length || 1);
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [plot]);

  const fetchPlotDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        throw new Error("Plot ID is required");
      }

      const plotId = Array.isArray(id) ? id[0] : id;
      const data = await getPlotById(plotId);

      if (!data) {
        throw new Error("Plot not found");
      }

      setPlot(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load plot details";
      setError(errorMessage);
      console.error("Error fetching plot details:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderImageItem = ({ item }: { item: string }) => (
    <View style={{ width }}>
      <Image
        source={{ uri: item }}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );

  const renderPaginationDots = () => {
    if (!plot?.imageUrls || plot.imageUrls.length <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        {plot.imageUrls.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentImageIndex ? 'white' : 'white/50',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const onScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentImageIndex(newIndex);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>
          Loading plot details...
        </Text>
      </View>
    );
  }

  if (error || !plot) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B35" />
          <Text style={styles.errorText}>
            {error || "Plot not found"}
          </Text>
          <TouchableOpacity
            onPress={fetchPlotDetails}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <FlatList
            ref={flatListRef}
            data={plot.imageUrls || []}
            renderItem={renderImageItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            keyExtractor={(item, index) => index.toString()}
          />
          {renderPaginationDots()}

          <View style={styles.headerControls}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="heart-outline" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {plot.status.toLowerCase() === "available" && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Available</Text>
            </View>
          )}
        </View>

        <View style={styles.contentCard}>
          <View style={styles.contentPadding}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>₹{(plot.price / 100000).toFixed(2)} Lac</Text>
            </View>

            <Text style={styles.title}>{plot.title}</Text>

            <View style={styles.locationContainer}>
              <Ionicons name="location" size={18} color="#FF6B35" />
              <Text style={styles.locationText}>{plot.location}</Text>
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Property Details</Text>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Plot Area</Text>
                  <Text style={styles.detailValue}>{plot.dimension}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Facing</Text>
                  <Text style={styles.detailValue}>{plot.facing.charAt(0).toUpperCase() + plot.facing.slice(1)}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailValue}>{plot.priceLabel}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>Farm Land</Text>
                </View>
              </View>
            </View>

            <View style={styles.aboutContainer}>
              <Text style={styles.aboutTitle}>About Property</Text>
              <Text style={styles.aboutText}>
                This agriculture/farm plot is available for sale at {plot.location}. It is a licensed plot in a very good area, the plot is measuring {plot.dimension} and priced {plot.priceLabel}.
              </Text>
            </View>

            {plot.amenities && plot.amenities.length > 0 && (
              <View style={styles.amenitiesContainer}>
                <Text style={styles.aboutTitle}>Amenities</Text>
                <View style={styles.detailsGrid}>
                  {plot.amenities.map((amenity, index) => (
                    <View key={index} style={styles.detailItem}>
                      <Text style={styles.detailLabel}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.mapContainer}>
              <Text style={styles.mapTitle}>Location</Text>
              <View style={styles.mapView}>
                {plot.mapEmbedUrl ? (
                  <WebView
                    source={{
                      html: `
                        <html>
                          <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                            <style>
                              body { margin: 0; padding: 0; }
                              iframe { width: 100%; height: 100%; border: none; }
                            </style>
                          </head>
                          <body>
                            <iframe
                              src="${plot.mapEmbedUrl}"
                              width="100%"
                              height="100%"
                              style="border:0;"
                              allowfullscreen=""
                              loading="lazy"
                              referrerpolicy="no-referrer-when-downgrade"
                            ></iframe>
                          </body>
                        </html>
                      `,
                    }}
                    style={{ flex: 1 }}
                    scrollEnabled={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                      <View style={styles.mapPlaceholder}>
                        <Ionicons name="location-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.mapPlaceholderText}>
                          Map not available
                        </Text>
                      </View>
                    )}
                  />
                ) : (
                  <View style={styles.mapPlaceholder}>
                    <Ionicons name="location-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.mapPlaceholderText}>
                      Map not available
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {plot.status.toLowerCase() === "available" && (
        <View style={styles.bottomButton}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push(`/(guest)/book-visit/${plot.id}`)}
          >
            <Text style={styles.bookButtonText}>Book visit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
