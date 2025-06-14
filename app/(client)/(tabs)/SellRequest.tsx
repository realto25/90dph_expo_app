import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Image,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { RadioButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

// Color palette consistent with other tabs
const colors = {
  primary: '#0F172A', // Dark blue/black
  secondary: '#1E293B', // Slightly lighter dark blue
  accent: '#FF6B00', // Bright orange for key elements
  accentLight: '#FFA750', // Lighter orange
  success: '#10B981', // Green for available status
  error: '#EF4444', // Red for errors/sold out
  surface: '#FFFFFF', // White for cards/background
  surfaceElevated: '#F8FAFC', // Light gray for elevated surfaces
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
  },
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    dark: '#94A3B8',
  },
};

interface Plot {
  id: string;
  title: string;
  dimension: string;
  location: string;
  price: number;
  imageUrls: string[];
}

const SellRequestScreen = () => {
  const { userId } = useAuth();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const [askingPrice, setAskingPrice] = useState('');
  const [marketValue, setMarketValue] = useState(0);
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState<'LOW' | 'NORMAL' | 'HIGH'>('NORMAL');
  const [agentAssistance, setAgentAssistance] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    const fetchUserPlots = async () => {
      try {
        const response = await api.get(`/plots/owned?userId=${userId}`);
        setPlots(response.data);
      } catch (error) {
        console.error('Error fetching plots:', error);
        Alert.alert('Error', 'Failed to fetch your properties');
      }
    };

    if (userId) {
      fetchUserPlots();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedPlot) {
      const plot = plots.find(p => p.id === selectedPlot);
      if (plot) {
        setMarketValue(plot.price);
        // Auto-set asking price to market value initially
        setAskingPrice(plot.price.toString());
      }
    }
  }, [selectedPlot, plots]);

  const pickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        // In a real app, you would upload the image to a storage service
        // and get back a URL to store in your database
        setDocuments([...documents, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeDocument = (index: number) => {
    const newDocuments = [...documents];
    newDocuments.splice(index, 1);
    setDocuments(newDocuments);
  };

  const handleSubmit = async () => {
    if (!selectedPlot) {
      Alert.alert('Error', 'Please select a property');
      return;
    }

    if (!askingPrice || isNaN(parseFloat(askingPrice))) {
      Alert.alert('Error', 'Please enter a valid asking price');
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/sell-requests', {
        plotId: selectedPlot,
        askingPrice,
        reason,
        urgency,
        agentAssistance,
        documents
      });

      Alert.alert('Success', 'Sell request submitted successfully');
      // Reset form
      setSelectedPlot(null);
      setAskingPrice('');
      setReason('');
      setUrgency('NORMAL');
      setAgentAssistance(false);
      setDocuments([]);
      setTermsAccepted(false);
    } catch (error) {
      console.error('Error submitting sell request:', error);
      Alert.alert('Error', 'Failed to submit sell request');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.content}>
          <Text style={styles.header}>Request to Sell Plot</Text>
          <Text style={styles.subHeader}>
            Create a sell request for your property. Our team will review your request and connect you with potential buyers.
          </Text>

          {/* Select Property Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Property</Text>
            <Text style={styles.sectionSubtitle}>Choose which property you want to sell</Text>
            
            {plots.map(plot => (
              <TouchableOpacity
                key={plot.id}
                style={[
                  styles.plotCard,
                  selectedPlot === plot.id && styles.selectedPlotCard
                ]}
                onPress={() => setSelectedPlot(plot.id)}
              >
                <Image
                  source={{ uri: plot.imageUrls[0] || 'https://via.placeholder.com/150' }}
                  style={styles.plotImage}
                />
                <View style={styles.plotInfo}>
                  <Text style={styles.plotTitle}>{plot.title}</Text>
                  <Text style={styles.plotDetails}>{plot.dimension}</Text>
                  <Text style={styles.plotDetails}>{plot.location}</Text>
                </View>
                {selectedPlot === plot.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Pricing Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing Details</Text>
            <Text style={styles.sectionSubtitle}>Set your desired selling price</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Current Market Value (Estimated)</Text>
              <Text style={styles.priceValue}>${marketValue.toLocaleString()}</Text>
            </View>
            
            <Text style={styles.inputLabel}>Your Asking Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your asking price"
              keyboardType="numeric"
              value={askingPrice}
              onChangeText={setAskingPrice}
            />
            
            <Text style={styles.priceTip}>
              Setting a price within 10% of the market value typically results in faster sales.
            </Text>
          </View>

          {/* Additional Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            
            <Text style={styles.inputLabel}>Reason for Selling (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Enter reason for selling"
              multiline
              value={reason}
              onChangeText={setReason}
            />
            
            <Text style={styles.inputLabel}>Urgency Level</Text>
            <View style={styles.urgencyContainer}>
              <TouchableOpacity
                style={[
                  styles.urgencyOption,
                  urgency === 'LOW' && styles.selectedUrgencyOption
                ]}
                onPress={() => setUrgency('LOW')}
              >
                <RadioButton
                  value="LOW"
                  status={urgency === 'LOW' ? 'checked' : 'unchecked'}
                  onPress={() => setUrgency('LOW')}
                  color="#4CAF50"
                />
                <View>
                  <Text style={styles.urgencyText}>Low</Text>
                  <Text style={styles.urgencySubtext}>6+ months</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.urgencyOption,
                  urgency === 'NORMAL' && styles.selectedUrgencyOption
                ]}
                onPress={() => setUrgency('NORMAL')}
              >
                <RadioButton
                  value="NORMAL"
                  status={urgency === 'NORMAL' ? 'checked' : 'unchecked'}
                  onPress={() => setUrgency('NORMAL')}
                  color="#4CAF50"
                />
                <View>
                  <Text style={styles.urgencyText}>Normal</Text>
                  <Text style={styles.urgencySubtext}>3-6 months</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.urgencyOption,
                  urgency === 'HIGH' && styles.selectedUrgencyOption
                ]}
                onPress={() => setUrgency('HIGH')}
              >
                <RadioButton
                  value="HIGH"
                  status={urgency === 'HIGH' ? 'checked' : 'unchecked'}
                  onPress={() => setUrgency('HIGH')}
                  color="#4CAF50"
                />
                <View>
                  <Text style={styles.urgencyText}>High</Text>
                  <Text style={styles.urgencySubtext}>ASAP</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceText}>Agent Assistance</Text>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setAgentAssistance(!agentAssistance)}
              >
                <View
                  style={[
                    styles.toggleBackground,
                    agentAssistance && styles.toggleBackgroundActive
                  ]}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      agentAssistance && styles.toggleCircleActive
                    ]}
                  />
                </View>
              </TouchableOpacity>
              <Text style={styles.preferenceSubtext}>
                Get help from our real estate agents
              </Text>
            </View>
            
            <Text style={styles.inputLabel}>Document Upload</Text>
            <Text style={styles.inputSubtext}>
              Upload additional documents for faster processing
            </Text>
            
            <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
              <Ionicons name="cloud-upload-outline" size={24} color="#4CAF50" />
              <Text style={styles.uploadButtonText}>Upload Documents</Text>
            </TouchableOpacity>
            
            {documents.length > 0 && (
              <View style={styles.documentsContainer}>
                {documents.map((doc, index) => (
                  <View key={index} style={styles.documentItem}>
                    <Ionicons name="document-text-outline" size={20} color="#666" />
                    <Text style={styles.documentName} numberOfLines={1}>
                      Document {index + 1}
                    </Text>
                    <TouchableOpacity onPress={() => removeDocument(index)}>
                      <Ionicons name="close-circle" size={20} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              <Ionicons
                name={termsAccepted ? "checkbox-outline" : "square-outline"}
                size={24}
                color={termsAccepted ? "#4CAF50" : "#666"}
              />
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to the Terms & Conditions of the selling process and understand that a commission fee may apply if I use agent services.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Sell Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 90 : 80, // Add padding for tab bar
  },
  content: {
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  plotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPlotCard: {
    backgroundColor: colors.accentLight + '15',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  plotImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  plotInfo: {
    flex: 1,
  },
  plotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  plotDetails: {
    fontSize: 14,
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    color: colors.text.primary,
  },
  priceTip: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  urgencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  urgencyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  selectedUrgencyOption: {
    backgroundColor: colors.accentLight + '15',
    borderColor: colors.accent,
  },
  urgencyText: {
    fontSize: 16,
    color: '#333',
  },
  urgencySubtext: {
    fontSize: 12,
    color: '#666',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferenceText: {
    fontSize: 16,
    color: '#333',
    marginRight: 12,
    fontWeight: '500',
  },
  preferenceSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  toggleButton: {
    marginRight: 12,
  },
  toggleBackground: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleBackgroundActive: {
    backgroundColor: '#a5d6a7',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleCircleActive: {
    transform: [{ translateX: 22 }],
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.accentLight + '10',
  },
  uploadButtonText: {
    fontSize: 16,
    color: colors.accent,
    marginLeft: 8,
    fontWeight: '500',
  },
  documentsContainer: {
    marginTop: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 8,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginRight: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    marginRight: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: colors.accentLight,
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SellRequestScreen;