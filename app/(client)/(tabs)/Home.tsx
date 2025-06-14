import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@clerk/clerk-expo';
import { getOwnedLands } from '@/lib/api';
import { OwnedPlot } from '../../../types/type';

const Home = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const [ownedPlots, setOwnedPlots] = useState<OwnedPlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'SOLD' | 'PENDING' | 'AVAILABLE'>('ALL');

  useEffect(() => {
    const fetchOwnedPlots = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getOwnedLands(userId);
        setOwnedPlots(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch lands');
        console.error('Failed to fetch owned plots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnedPlots();
  }, [userId]);

  const filteredPlots = ownedPlots.filter(plot => 
    filter === 'ALL' ? true : plot.status === filter
  );

  const totalPlots = ownedPlots.length;
  const estimatedValue = ownedPlots
    .reduce((sum, plot) => sum + plot.plot.price, 0)
    .toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const registeredPlots = ownedPlots.filter(plot => plot.status === 'SOLD').length;

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
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
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
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Plots</Text>
              <Text style={styles.summaryValue}>{totalPlots}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Estimated Value</Text>
              <Text style={styles.summaryValue}>{estimatedValue}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Registered</Text>
              <Text style={styles.summaryValue}>{registeredPlots}</Text>
            </View>
          </View>

          {/* Filter Buttons */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {['ALL', 'SOLD', 'PENDING', 'AVAILABLE'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterButton,
                  filter === item && styles.activeFilterButton
                ]}
                onPress={() => setFilter(item as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === item && styles.activeFilterButtonText
                ]}>
                  {item.charAt(0) + item.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Plots List */}
          {filteredPlots.length > 0 ? (
            filteredPlots.map((plot) => (
              <PlotCard 
                key={plot.id} 
                ownedPlot={plot} 
                onPress={() => router.push(`/lands/${plot.id}`)}
              />
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

const PlotCard = ({ 
  ownedPlot, 
  onPress 
}: { 
  ownedPlot: OwnedPlot; 
  onPress: () => void 
}) => (
  <TouchableOpacity style={styles.plotCard} onPress={onPress}>
    <View style={styles.plotImageContainer}>
      <Image 
        source={{ uri: ownedPlot.plot.image || 'https://via.placeholder.com/400x200?text=Land+Plot' }} 
        style={styles.plotImage}
        resizeMode="cover"
      />
      <View style={[
        styles.statusBadge,
        ownedPlot.status === 'SOLD' && styles.statusSold,
        ownedPlot.status === 'PENDING' && styles.statusPending,
        ownedPlot.status === 'AVAILABLE' && styles.statusAvailable
      ]}>
        <Text style={styles.statusBadgeText}>{ownedPlot.status}</Text>
      </View>
    </View>

    <View style={styles.plotInfo}>
      <Text style={styles.plotLocation} numberOfLines={1}>
        <Ionicons name="location-sharp" size={16} color="#555" /> {ownedPlot.plot.location}
      </Text>
      
      <View style={styles.priceRow}>
        <Text style={styles.plotPrice}>
          ${ownedPlot.plot.price.toLocaleString('en-US')}
        </Text>
        <Text style={styles.plotSize}>{ownedPlot.plot.size} sq ft</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="document-text" size={14} color="#666" />
          <Text style={styles.metaText}>Deed #{ownedPlot.id.slice(0, 6)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar" size={14} color="#666" />
          <Text style={styles.metaText}>Owned 3mo</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

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
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
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
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  plotCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  plotImageContainer: {
    height: 180,
    position: 'relative',
  },
  plotImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
  },
  statusSold: {
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
  plotInfo: {
    padding: 16,
  },
  plotLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plotPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  plotSize: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
