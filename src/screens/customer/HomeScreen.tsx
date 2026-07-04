import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Artisan } from '../../types';
import { COLORS, TRADES } from '../../constants';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { signOut } from 'firebase/auth';
import { Alert } from 'react-native';


export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<string>('All');
  const handleLogout = async () => {
  Alert.alert('Logout', 'Are you sure you want to logout?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Logout',
      style: 'destructive',
      onPress: async () => {
        await signOut(auth);
        navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      },
    },
  ]);
};

  const trades = ['All', ...TRADES];

  useEffect(() => {
    fetchArtisans();
  }, []);

  const fetchArtisans = async () => {
    try {
      const q = query(collection(db, 'artisans'), limit(20));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data() as Artisan);
      setArtisans(data);
    } catch (error) {
      console.error('Error fetching artisans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtisans = selectedTrade === 'All'
    ? artisans
    : artisans.filter(a => a.trade === selectedTrade);

  const userName = auth.currentUser?.displayName || 'there';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey 👋</Text>
            <Text style={styles.subGreeting}>Find a skilled fundi near you</Text>
          </View>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleLogout}>
            <Text style={styles.avatarText}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar (visual only for now) */}
        <TouchableOpacity style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search for a fundi...</Text>
        </TouchableOpacity>

        {/* Trade Filter */}
        <Text style={styles.sectionTitle}>Browse by Trade</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tradeScroll}
        >
          {trades.map(trade => (
            <TouchableOpacity
              key={trade}
              style={[
                styles.tradeChip,
                selectedTrade === trade && styles.tradeChipActive,
              ]}
              onPress={() => setSelectedTrade(trade)}
            >
              <Text
                style={[
                  styles.tradeChipText,
                  selectedTrade === trade && styles.tradeChipTextActive,
                ]}
              >
                {trade}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Artisans List */}
        <Text style={styles.sectionTitle}>
          {selectedTrade === 'All' ? 'All Fundis' : selectedTrade + 's'}
          {' '}({filteredArtisans.length})
        </Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : filteredArtisans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No fundis yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to invite a fundi to MyFundi!
            </Text>
          </View>
        ) : (
          filteredArtisans.map((artisan, index) => (
            <TouchableOpacity key={index} style={styles.artisanCard} onPress={() => navigation.navigate('ArtisanDetail', { artisanId: artisan.uid })}>
              <View style={styles.artisanAvatar}>
               {artisan.profilePhoto ? (
                <Image source={{ uri: artisan.profilePhoto }} style={styles.artisanAvatarImage} />
               ) : (
                <Text style={styles.artisanAvatarText}>🔨</Text>
               )}
             </View>
              <View style={styles.artisanInfo}>
                <Text style={styles.artisanName}>{artisan.name}</Text>
                {artisan.verified == true && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✅ Verified Fundi</Text>
                  </View>
                )}
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
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  verifiedBadge: {
  backgroundColor: '#E8F8F0',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 10,
},
verifiedText: {
  fontSize: 11,
  color: COLORS.success,
  fontWeight: '600',
},
  artisanAvatarImage: {
  width: 56,
  height: 56,
  borderRadius: 28,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 4,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchPlaceholder: {
    color: COLORS.subtext,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  tradeScroll: {
    paddingLeft: 24,
    marginBottom: 20,
  },
  tradeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  tradeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tradeChipText: {
    color: COLORS.text,
    fontSize: 13,
  },
  tradeChipTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  artisanCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  artisanAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  artisanAvatarText: {
    fontSize: 28,
  },
  artisanInfo: {
    flex: 1,
  },
  artisanName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  artisanTrade: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  artisanLocation: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  rating: {
    fontSize: 12,
    color: COLORS.text,
  },
  reviews: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  availableBadge: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  availableText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
});