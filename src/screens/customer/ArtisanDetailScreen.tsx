import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Artisan, RootStackParamList } from '../../types';
import { COLORS } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ArtisanDetail'>;
  route: RouteProp<RootStackParamList, 'ArtisanDetail'>;
};

export default function ArtisanDetailScreen({ navigation, route }: Props) {
  const { artisanId } = route.params;
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtisan();
  }, []);

  const fetchArtisan = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'artisans', artisanId));
      if (docSnap.exists()) {
        setArtisan(docSnap.data() as Artisan);
      }
    } catch (error) {
      console.error('Error fetching artisan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (!artisan?.phone) return;
    Linking.openURL(`tel:${artisan.phone}`);
  };

  const handleWhatsApp = () => {
    if (!artisan?.phone) return;
    const phone = artisan.phone.startsWith('0')
      ? '254' + artisan.phone.slice(1)
      : artisan.phone;
    Linking.openURL(`https://wa.me/${phone}`).catch(() =>
      Alert.alert('Error', 'WhatsApp is not installed on this device')
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!artisan) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Fundi not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {artisan.profilePhoto ? (
            <Image source={{ uri: artisan.profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>🔨</Text>
            </View>
          )}
          <Text style={styles.name}>{artisan.name}</Text>
          {artisan.verified == true && (
            <text style={styles.verifiedBadge}>✅ Verified Fundi</text>
          )}
          <Text style={styles.trade}>{artisan.trade}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>⭐ {artisan.rating || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{artisan.totalReviews || 0}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{artisan.available ? '✅' : '❌'}</Text>
              <Text style={styles.statLabel}>{artisan.available ? 'Available' : 'Busy'}</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.bio}>{artisan.bio || 'No bio provided yet.'}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            <Text style={styles.locationText}>
              📍 {artisan.location?.address || 'Location not set'}
            </Text>
          </View>
        </View>

        {/* Work Photos */}
        {artisan.photos && artisan.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {artisan.photos.map((photo, index) => (
                <Image key={index} source={{ uri: photo }} style={styles.workPhoto} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Contact Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Text style={styles.callButtonText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
              <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Book Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.bookButton, !artisan.available && styles.bookButtonDisabled]}
            onPress={() => {
              if (!artisan.available) {
                Alert.alert('Unavailable', 'This fundi is currently unavailable for bookings.');
                return;
              }
              navigation.navigate('BookingScreen', { artisan });
            }}
          >
            <Text style={styles.bookButtonText}>
              {artisan.available ? '📅 Book This Fundi' : 'Currently Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  verifiedBadge: {
  fontSize: 13,
  color: COLORS.success,
  fontWeight: '600',
  marginTop: 4,
},
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: StatusBar.currentHeight || 0,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.subtext, fontSize: 16 },
  backButton: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  backText: { color: COLORS.primary, fontSize: 16 },
  profileHeader: {
    alignItems: 'center', paddingVertical: 24,
    backgroundColor: COLORS.white, marginBottom: 16,
  },
  profilePhoto: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 40 },
  name: { fontSize: 22, fontWeight: 'bold', color: COLORS.secondary },
  trade: { fontSize: 15, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 20, paddingHorizontal: 24 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.subtext, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  section: { paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  bio: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  locationText: { fontSize: 14, color: COLORS.text },
  workPhoto: { width: 140, height: 100, borderRadius: 12, marginRight: 10 },
  contactRow: { flexDirection: 'row', gap: 12 },
  callButton: {
    flex: 1, backgroundColor: COLORS.white,
    borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  callButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },
  whatsappButton: { flex: 1, backgroundColor: '#25D366', borderRadius: 12, padding: 14, alignItems: 'center' },
  whatsappButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
  bookButton: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  bookButtonDisabled: { backgroundColor: COLORS.border },
  bookButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});