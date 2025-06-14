import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface CameraData {
  id: string;
  type: 'plot' | 'land';
  title: string;
  location: string;
  ipAddress: string;
  label: string;
  size?: string;
  number?: string;
  project: {
    name: string;
    location: string;
  };
}

const API_URL = 'https://90-dph.vercel.app';

const CameraScreen = () => {
  const { user } = useUser();
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCameras = async () => {
      try {
        if (!user?.id) {
          setError('User not authenticated');
          return;
        }

        const response = await fetch(`${API_URL}/api/cameras?clerkId=${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          setCameras(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching cameras:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch cameras');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCameras();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const renderCameraStream = (ipAddress: string) => {
    // Handle different camera stream formats
    let streamUrl = ipAddress;
    
    // Add protocol if missing
    if (!ipAddress.startsWith('http')) {
      streamUrl = `http://${ipAddress}`;
    }

    // For RTSP streams, we need to use a proxy or convert to HLS
    if (ipAddress.startsWith('rtsp://')) {
      // You'll need a server to convert RTSP to HLS
      streamUrl = `http://your-proxy-server/stream?url=${encodeURIComponent(ipAddress)}`;
    }

    return (
      <View style={styles.streamContainer}>
        <WebView
          source={{ uri: streamUrl }}
          style={styles.camera}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
          }}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading cameras...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (cameras.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noCamerasText}>No cameras assigned to your account</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {cameras.map((camera) => (
        <View key={camera.id} style={styles.cameraContainer}>
          <Text style={styles.cameraTitle}>{camera.label}</Text>
          <Text style={styles.cameraInfo}>Location: {camera.location}</Text>
          <Text style={styles.cameraInfo}>Project: {camera.project.name}</Text>
          {camera.size && <Text style={styles.cameraInfo}>Size: {camera.size}</Text>}
          {camera.number && <Text style={styles.cameraInfo}>Number: {camera.number}</Text>}
          {renderCameraStream(camera.ipAddress)}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cameraContainer: {
    margin: 10,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cameraInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  streamContainer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#000',
  },
  camera: {
    width: Dimensions.get('window').width - 50,
    height: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 10,
  },
  noCamerasText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default CameraScreen;
