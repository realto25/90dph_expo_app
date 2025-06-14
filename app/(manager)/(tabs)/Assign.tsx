// src/screens/VisitRequestsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import axios from 'axios';
import { format } from 'date-fns';
import { Card } from 'react-native-paper';

interface VisitRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  qrCode: string | null;
  expiresAt: string | null;
  plot: {
    id: string;
    title: string;
    location: string;
    project: {
      id: string;
      name: string;
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    clerkId: string;
  } | null;
  assignedManager: {
    id: string;
    name: string;
    email: string;
    clerkId: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const VisitRequestCard = ({ request }: { request: VisitRequest }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '#22c55e';
      case 'REJECTED':
        return '#ef4444';
      default:
        return '#eab308';
    }
  };

  const handleViewQR = () => {
    if (request.qrCode) {
      Linking.openURL(request.qrCode);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.plotTitle}>{request.plot.title}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(request.status) }
            ]}
          >
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Visitor:</Text>
            <Text style={styles.value}>{request.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Contact:</Text>
            <Text style={styles.value}>{request.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {format(new Date(request.date), 'MMM dd, yyyy')} at {request.time}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Project:</Text>
            <Text style={styles.value}>{request.plot.project.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{request.plot.location}</Text>
          </View>
        </View>

        {request.status === 'APPROVED' && request.qrCode && (
          <TouchableOpacity
            style={styles.qrButton}
            onPress={handleViewQR}
          >
            <Text style={styles.qrButtonText}>View QR Code</Text>
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );
};

export default function VisitRequestsScreen() {
  const { user } = useUser();
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setError(null);
      const response = await axios.get(
        `https://90-dph.vercel.app/api/visit-requests?managerId=${user?.id}`
      );
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching visit requests:', error);
      setError('Failed to fetch visit requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchRequests}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Assigned Visit Requests</Text>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No visit requests assigned</Text>
        </View>
      ) : (
        requests.map((request) => (
          <VisitRequestCard key={request.id} request={request} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plotTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 80,
    fontSize: 14,
    color: '#6b7280',
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  qrButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});