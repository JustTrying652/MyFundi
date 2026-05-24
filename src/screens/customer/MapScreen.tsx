import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../../services/firebase';
import { Artisan, RootStackParamList } from '../../types';
import { COLORS } from '../../constants';

export default function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    getLocationAndArtisans();
  }, []);

  const getLocationAndArtisans = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed to show fundis near you');
        setUserLocation({ latitude: -1.2921, longitude: 36.8219 });
      } else {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
      const snapshot = await getDocs(collection(db, 'artisans'));
      const data = snapshot.docs.map(doc => doc.data() as Artisan);
      const withLocation = data.filter(
        a => a.location?.latitude !== 0 && a.location?.longitude !== 0
      );
      setArtisans(withLocation);
    } catch (error) {
      console.error('Error:', error);
      setUserLocation({ latitude: -1.2921, longitude: 36.8219 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fundis Near You</Text>
        <Text style={styles.subtitle}>
          {artisans.length} fundi{artisans.length !== 1 ? 's' : ''} on the map
        </Text>
      </View>

      {mapError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyTitle}>Map unavailable</Text>
          <Text style={styles.emptySubtitle}>Could not load map on this device</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation?.latitude || -1.2921,
            longitude: userLocation?.longitude || 36.8219,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {artisans.map((artisan, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: artisan.location.latitude,
                longitude: artisan.location.longitude,
              }}
              pinColor={COLORS.primary}
            >
              <Callout onPress={() => navigation.navigate('ArtisanDetail', { artisanId: artisan.uid })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{artisan.name}</Text>
                  <Text style={styles.calloutTrade}>{artisan.trade}</Text>
                  <Text style={styles.calloutLocation}>
                    📍 {artisan.location?.address || 'No address'}
                  </Text>
                  <Text style={styles.calloutRating}>
                    ⭐ {artisan.rating || '0.0'} · {artisan.available ? '🟢 Available' : '🔴 Busy'}
                  </Text>
                  <Text style={styles.calloutTap}>Tap to view profile →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      {!mapError && artisans.length === 0 && (
        <View style={styles.emptyOverlay}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyTitle}>No fundis on map yet</Text>
            <Text style={styles.emptySubtitle}>
              Fundis appear here once they set their exact location
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.subtext },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12, backgroundColor: COLORS.background },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  subtitle: { fontSize: 14, color: COLORS.subtext, marginTop: 4 },
  map: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  callout: { width: 200, padding: 8 },
  calloutName: { fontSize: 15, fontWeight: 'bold', color: COLORS.secondary },
  calloutTrade: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  calloutLocation: { fontSize: 12, color: COLORS.subtext, marginTop: 4 },
  calloutRating: { fontSize: 12, color: COLORS.text, marginTop: 4 },
  calloutTap: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 6 },
  emptyOverlay: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  emptyCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, alignItems: 'center', elevation: 4 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  emptySubtitle: { fontSize: 13, color: COLORS.subtext, marginTop: 4, textAlign: 'center' },
});