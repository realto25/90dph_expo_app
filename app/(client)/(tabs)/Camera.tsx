import { getOwnedLands } from '@/lib/api';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
interface Camera {
  id: string;
  name: string;
  ipAddress: string;
  type: string;
  status: 'online' | 'offline';
  lastActive?: string;
}
const CameraScreen = () => {
  const { userId } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    fetchCameras();
    return () => {
      setSelectedCamera(null); 
    };
  }, [userId]);

  const fetchCameras = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await getOwnedLands(userId);
      const cameraData = data.map((item: any) => ({
        id: item.id,
        name: item.plot.title,
        ipAddress: item.plot.location,
        type: 'IP',
        status: 'online',
        lastActive: new Date().toISOString(),
      }));
      setCameras(cameraData);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      Alert.alert('Error', 'Failed to fetch cameras');
    } finally {
      setLoading(false);
    }
  };

  const getStreamUrl = (ipAddress: string) => {
    let streamUrl = ipAddress;
    if (!ipAddress.startsWith('http') && !ipAddress.startsWith('rtsp')) {
      streamUrl = `http://${ipAddress}`;
    }
    if (ipAddress.includes('axis')) {
      return `${streamUrl}/axis-cgi/mjpg/video.cgi?resolution=640x480`;
    }
    return `${streamUrl}/video`;
  };

  const handleWebViewError = (cameraId: string) => {
    setStreamError('Failed to load camera stream');
    Alert.alert('Stream Error', 'Unable to connect to camera stream. Please check the camera connection.');
    setTimeout(() => {
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    }, 3000);
  };

  const renderCameraStream = (camera: Camera) => {
    const streamUrl = getStreamUrl(camera.ipAddress);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; background: black; }
          img { width: 100%; height: 100%; object-fit: contain; }
        </style>
      </head>
      <body>
        <img src="${streamUrl}" onerror="setTimeout(() => location.reload(), 3000)">
      </body>
      </html>
    `;

    return (
      <View style={styles.streamContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.stream}
          javaScriptEnabled={true}
          onError={() => handleWebViewError(camera.id)}
          onHttpError={() => handleWebViewError(camera.id)}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
        />
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => webViewRef.current?.reload()}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.header}>Security Cameras</Text>
          <Text style={styles.subHeader}>Monitor your properties in real-time</Text>

          {cameras.map((camera) => (
            <TouchableOpacity
              key={camera.id}
              style={[styles.cameraCard, selectedCamera === camera.id && styles.selectedCameraCard]}
              onPress={() => setSelectedCamera(camera.id === selectedCamera ? null : camera.id)}
            >
              <View style={styles.cameraInfo}>
                <Text style={styles.cameraName}>{camera.name}</Text>
                <Text style={styles.cameraDetails}>{camera.ipAddress}</Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: camera.status === 'online' ? '#4CAF50' : '#FF5252' },
                    ]}
                  />
                  <Text style={styles.statusText}>{camera.status}</Text>
                </View>
              </View>
              <Ionicons
                name={selectedCamera === camera.id ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          ))}

          {selectedCamera && (
            <View style={styles.streamSection}>
              {renderCameraStream(cameras.find((c) => c.id === selectedCamera) as Camera)}
              {streamError && <Text style={styles.errorText}>{streamError}</Text>}
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
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
  },
  cameraCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCameraCard: {
    backgroundColor: '#FFA75015',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  cameraInfo: {
    flex: 1,
  },
  cameraName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cameraDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  streamSection: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  streamContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stream: {
    width: '100%',
    height: '100%',
  },
  refreshButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CameraScreen;