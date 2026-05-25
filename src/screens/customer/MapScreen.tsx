import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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
  const [allArtisans, setAllArtisans] = useState<Artisan[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [mapRef, setMapRef] = useState<MapView | null>(null);

  useEffect(() => {
    getLocationAndArtisans();
  }, []);

  const getLocationAndArtisans = async () => {
    try {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Location timeout')), 5000)
            ),
          ]) as Location.LocationObject;
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } else {
          setUserLocation({ latitude: -1.2921, longitude: 36.8219 });
        }
      } catch (locationError) {
        console.log('Location error, using default:', locationError);
        setUserLocation({ latitude: -1.2921, longitude: 36.8219 });
      }

      const snapshot = await getDocs(collection(db, 'artisans'));
      const data = snapshot.docs.map(doc => doc.data() as Artisan);
      setAllArtisans(data);
      const withLocation = data.filter(
        a => a.location?.latitude !== 0 && a.location?.longitude !== 0
      );
      setArtisans(withLocation);
    } catch (error) {
      console.error('Error:', error);
      setUserLocation({ latitude: -1.2921, longitude: 36.8219 });
      setMapError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArtisan = (artisan: Artisan) => {
    setSelectedArtisan(artisan);
    if (artisan.location?.latitude && artisan.location?.longitude && mapRef) {
      mapRef.animateToRegion({
        latitude: artisan.location.latitude,
        longitude: artisan.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fundis Near You</Text>
        <Text style={styles.subtitle}>
          {allArtisans.length} fundi{allArtisans.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Map - top half */}
      <View style={styles.mapContainer}>
        {mapError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyTitle}>Map unavailable</Text>
            <Text style={styles.emptySubtitle}>Could not load map on this device</Text>
          </View>
        ) : userLocation ? (
          <MapView
            ref={ref => setMapRef(ref)}
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
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
                pinColor={selectedArtisan?.uid === artisan.uid ? '#E74C3C' : COLORS.primary}
                onPress={() => handleSelectArtisan(artisan)}
              />
            ))}
          </MapView>
        ) : (
          <View style={styles.errorContainer}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      </View>

      {/* Fundi List - bottom half */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>All Fundis</Text>
          <Text style={styles.listCount}>{allArtisans.length} total</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {allArtisans.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No fundis yet</Text>
              <Text style={styles.emptySubtitle}>Invite a fundi to join MyFundi!</Text>
            </View>
          ) : (
            allArtisans.map((artisan, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.artisanCard,
                  selectedArtisan?.uid === artisan.uid && styles.artisanCardSelected,
                ]}
                onPress={() => {
                  handleSelectArtisan(artisan);
                  navigation.navigate('ArtisanDetail', { artisanId: artisan.uid });
                }}
              >
                <View style={styles.artisanAvatar}>
                  {artisan.profilePhoto ? (
                    <Image source={{ uri: artisan.profilePhoto }} style={styles.artisanAvatarImage} />
                  ) : (
                    <Text style={styles.artisanAvatarText}>🔨</Text>
                  )}
                </View>
                <View style={styles.artisanInfo}>
                  <Text style={styles.artisanName}>{artisan.name}</Text>
                  <Text style={styles.artisanTrade}>{artisan.trade || 'Trade not set'}</Text>
                  <Text style={styles.artisanLocation}>
                    📍 {artisan.location?.address || 'Location not set'}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.rating}>⭐ {artisan.rating || '0.0'}</Text>
                    <Text style={styles.reviews}>({artisan.totalReviews || 0} reviews)</Text>
                    {artisan.available && (
                      <View style={styles.availableBadge}>
                        <Text style={styles.availableText}>Available</Text>
                      </View>
                    )}
                    {artisan.location?.latitude !== 0 && artisan.location?.longitude !== 0 && (
                      <View style={styles.onMapBadge}>
                        <Text style={styles.onMapText}>📍 On map</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
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
  mapContainer: { height: 250 },
  map: { flex: 1 },
  errorContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  listContainer: { flex: 1, backgroundColor: COLORS.background },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  listCount: { fontSize: 13, color: COLORS.subtext },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  emptySubtitle: { fontSize: 13, color: COLORS.subtext, marginTop: 4 },
  artisanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  artisanCardSelected: { borderWidth: 2, borderColor: COLORS.primary },
  artisanAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  artisanAvatarImage: { width: 52, height: 52, borderRadius: 26 },
  artisanAvatarText: { fontSize: 26 },
  artisanInfo: { flex: 1 },
  artisanName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  artisanTrade: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  artisanLocation: { fontSize: 12, color: COLORS.subtext, marginTop: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 6, flexWrap: 'wrap' },
  rating: { fontSize: 12, color: COLORS.text },
  reviews: { fontSize: 12, color: COLORS.subtext },
  availableBadge: { backgroundColor: '#E8F8F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  availableText: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  onMapBadge: { backgroundColor: '#EBF5FB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  onMapText: { fontSize: 11, color: '#3498DB', fontWeight: '600' },
  arrow: { fontSize: 18, color: COLORS.subtext, marginLeft: 8 },
});