import { getOwnedLands } from '@/lib/api';
import { useAuth } from '@clerk/clerk-expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OwnedLand {
  id: string;
  number: string;
  size: string;
  price: number;
  status: 'REGISTERED' | 'PENDING' | 'AVAILABLE';
  imageUrl: string;
  plotId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  plot: {
    title: string;
    dimension: string;
    price: number;
    location: string;
    imageUrls: string[];
    mapEmbedUrl: string | null;
    qrUrl: string | null;
  };
}

const Home = () => {
  const { userId } = useAuth();
  const [ownedLands, setOwnedLands] = useState<OwnedLand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'REGISTERED' | 'PENDING' | 'AVAILABLE'>('ALL');

  useEffect(() => {
    const fetchOwnedLands = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getOwnedLands(userId);
        setOwnedLands(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch lands');
        console.error('Failed to fetch owned lands:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnedLands();
  }, [userId]);

  const filteredLands = ownedLands.filter((land) =>
    filter === 'ALL' ? true : land.status === filter
  );

  const totalLands = ownedLands.length;
  const estimatedValue = ownedLands.reduce((sum, land) => sum + land.price, 0);
  const formattedValue =
    estimatedValue >= 10000000
      ? `₹${(estimatedValue / 10000000).toFixed(2)} Cr`
      : `₹${(estimatedValue / 100000).toFixed(2)} L`;
  const registeredLands = ownedLands.filter((land) => land.status === 'REGISTERED').length;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Lands</Text>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Lands</Text>
              <Text style={styles.summaryValue}>{totalLands}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Estimated Value</Text>
              <Text style={styles.summaryValue}>{formattedValue}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Registered</Text>
              <Text style={styles.summaryValue}>{registeredLands}</Text>
            </View>
          </View>

          {/* Filter Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}>
            {['ALL', 'REGISTERED', 'PENDING', 'AVAILABLE'].map((item) => (
              <View
                key={item}
                style={[styles.filterButton, filter === item && styles.activeFilterButton]}>
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === item && styles.activeFilterButtonText,
                  ]}>
                  {item.charAt(0) + item.slice(1).toLowerCase()}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Lands List */}
          {filteredLands.length > 0 ? (
            filteredLands.map((land) => (
              <View key={land.id} style={styles.landCard}>
                <View style={styles.landImageContainer}>
                  <Image
                    source={{
                      uri:
                        land.plot.imageUrls?.[0] ||
                        'https://via.placeholder.com/400x200?text=Land+Plot',
                    }}
                    style={styles.landImage}
                    resizeMode="cover"
                  />
                  <View
                    style={[
                      styles.statusBadge,
                      land.status === 'REGISTERED' && styles.statusRegistered,
                      land.status === 'PENDING' && styles.statusPending,
                      land.status === 'AVAILABLE' && styles.statusAvailable,
                    ]}>
                    <Text style={styles.statusBadgeText}>{land.status}</Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceTagText}>
                      {land.price >= 10000000
                        ? `₹${(land.price / 10000000).toFixed(2)} Cr`
                        : `₹${(land.price / 100000).toFixed(2)} L`}
                    </Text>
                  </View>
                </View>

                <View style={styles.landInfo}>
                  <Text style={styles.landTitle} numberOfLines={1}>
                    {land.plot.title}
                  </Text>
                  <Text style={styles.landLocation} numberOfLines={1}>
                    <Ionicons name="location-sharp" size={16} color="#555" /> {land.plot.location}
                  </Text>

                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="resize-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{land.size} sq ft</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="document-text-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>Deed #{land.id.slice(0, 6)}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color="#666" />
                      <Text style={styles.metaText}>
                        {new Date(land.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <Text style={styles.metaText}>
                        {new Date(land.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="earth-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No lands found</Text>
              <Text style={styles.emptyStateSubtext}>
                {filter === 'ALL'
                  ? "You don't own any lands yet"
                  : `No ${filter.toLowerCase()} lands`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  landCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  landImageContainer: {
    height: 200,
    position: 'relative',
  },
  landImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
  },
  statusRegistered: {
    backgroundColor: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FFA000',
  },
  statusAvailable: {
    backgroundColor: '#2196F3',
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceTagText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  landInfo: {
    padding: 16,
  },
  landTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  landLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default Home;
