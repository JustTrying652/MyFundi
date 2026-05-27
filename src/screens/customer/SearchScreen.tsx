import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../../services/firebase';
import { Artisan, RootStackParamList } from '../../types';
import { COLORS, TRADES } from '../../constants';

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [allArtisans, setAllArtisans] = useState<Artisan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const trades = ['All', ...TRADES];

  useEffect(() => {
    fetchArtisans();
  }, []);

  const fetchArtisans = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'artisans'));
      const data = snapshot.docs.map(doc => doc.data() as Artisan);
      setAllArtisans(data);
    } catch (error) {
      console.error('Error fetching artisans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtisans = allArtisans.filter(artisan => {
    const matchesTrade = selectedTrade === 'All' || artisan.trade === selectedTrade;
    const matchesQuery =
      searchQuery === '' ||
      artisan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artisan.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artisan.location?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTrade && matchesQuery;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search Fundis</Text>
        <Text style={styles.subtitle}>Find the right fundi for your job</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, trade or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Trade Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tradeScroll}
      >
        {trades.map(trade => (
          <TouchableOpacity
            key={trade}
            style={[styles.tradeChip, selectedTrade === trade && styles.tradeChipActive]}
            onPress={() => setSelectedTrade(trade)}
          >
            <Text style={[styles.tradeChipText, selectedTrade === trade && styles.tradeChipTextActive]}>
              {trade}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredArtisans.length} fundi{filteredArtisans.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : filteredArtisans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>Try a different search or trade filter</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {filteredArtisans.map((artisan, index) => (
            <TouchableOpacity
              key={index}
              style={styles.artisanCard}
              onPress={() => navigation.navigate('ArtisanDetail', { artisanId: artisan.uid })}
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
                {artisan.verified == true && (
                  <view style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✅ Verified Fundi</Text>
                  </view>
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
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginVertical: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  clearText: {
    fontSize: 16,
    color: COLORS.subtext,
    paddingHorizontal: 4,
  },
  tradeScroll: {
    paddingLeft: 24,
    marginBottom: 8,
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
  resultsHeader: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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
  },
  list: {
    paddingHorizontal: 24,
  },
  artisanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  artisanAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  artisanAvatarText: {
    fontSize: 26,
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
  arrow: {
    fontSize: 18,
    color: COLORS.subtext,
    marginLeft: 8,
  },
});