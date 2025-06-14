import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useUser } from "@clerk/clerk-expo";
import { useState, useCallback } from 'react';
import { Ionicons } from "@expo/vector-icons";

// Types
interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
}

export function LeaveRequestHistory() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setError(null);
      // TODO: Replace with actual API call
      // const response = await getLeaveRequests(user?.id);
      // setLeaveRequests(response);
      
      // Temporary mock data
      setLeaveRequests([
        {
          id: '1',
          startDate: '2024-03-20',
          endDate: '2024-03-22',
          type: 'Sick Leave',
          status: 'APPROVED',
          reason: 'Medical appointment'
        },
        {
          id: '2',
          startDate: '2024-04-01',
          endDate: '2024-04-05',
          type: 'Annual Leave',
          status: 'PENDING',
          reason: 'Family vacation'
        }
      ]);
    } catch (err) {
      setError('Failed to load leave requests');
      console.error('Error fetching leave requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const getStatusColor = (status: string) => {
    const colors = {
      APPROVED: {
        backgroundColor: '#DCFCE7',
        borderColor: '#22C55E',
        textColor: '#166534',
      },
      PENDING: {
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
        textColor: '#92400E',
      },
      REJECTED: {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
        textColor: '#991B1B',
      },
    };
    return colors[status as keyof typeof colors] || {
      backgroundColor: '#F3F4F6',
      borderColor: '#D1D5DB',
      textColor: '#374151',
    };
  };

  const renderItem = ({ item }: { item: LeaveRequest }) => {
    const statusColors = getStatusColor(item.status);
    const startDate = new Date(item.startDate).toLocaleDateString();
    const endDate = new Date(item.endDate).toLocaleDateString();

    return (
      <View style={styles.leaveCard}>
        <View style={styles.leaveHeader}>
          <View style={styles.leaveTypeContainer}>
            <Ionicons name="calendar-outline" size={20} color="#1e293b" />
            <Text style={styles.leaveType}>{item.type}</Text>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: statusColors.backgroundColor,
            borderColor: statusColors.borderColor 
          }]}>
            <Text style={[styles.statusText, { color: statusColors.textColor }]}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.leaveDetails}>
          <Text style={styles.dateText}>
            {startDate} - {endDate}
          </Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <Text>Loading leave requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={leaveRequests}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
          <Text style={styles.emptyStateText}>No leave requests found</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  leaveCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'Manrope-SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Manrope-SemiBold',
  },
  leaveDetails: {
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Manrope-Regular',
  },
  reasonText: {
    fontSize: 14,
    color: '#334155',
    fontFamily: 'Manrope-Regular',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Manrope-Regular',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    fontFamily: 'Manrope-Regular',
  },
}); 