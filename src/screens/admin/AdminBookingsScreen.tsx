import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS } from '../../constants';

interface Booking {
  id: string;
  customerName: string;
  artisanName: string;
  trade: string;
  description: string;
  date: string;
  status: string;
  createdAt: any;
}

export default function AdminBookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'rejected'>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchQuery, statusFilter, bookings]);

  const fetchBookings = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'bookings'));
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Booking[];
      data.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setBookings(data);
      setFiltered(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let result = bookings;
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }
    if (searchQuery) {
      result = result.filter(b =>
        b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.artisanName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.trade?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFiltered(result);
  };

  const handleDelete = async (booking: Booking) => {
    Alert.alert(
      'Delete Booking',
      `Are you sure you want to delete this booking between ${booking.customerName} and ${booking.artisanName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'bookings', booking.id));
              setBookings(prev => prev.filter(b => b.id !== booking.id));
              Alert.alert('Success', 'Booking deleted successfully.');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#FEF9E7', color: COLORS.pending };
      case 'accepted': return { bg: '#E8F8F0', color: COLORS.success };
      case 'rejected': return { bg: '#FDECEA', color: COLORS.danger };
      case 'completed': return { bg: '#EBF5FB', color: '#3498DB' };
      default: return { bg: COLORS.background, color: COLORS.subtext };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Bookings</Text>
        <Text style={styles.subtitle}>{filtered.length} bookings</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer, fundi or trade..."
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

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {(['all', 'pending', 'accepted', 'completed', 'rejected'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.filterChipText, statusFilter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No bookings found</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {filtered.map(booking => {
            const statusStyle = getStatusStyle(booking.status);
            return (
              <View key={booking.id} style={styles.bookingCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.bookingParties}>
                      {booking.customerName} → {booking.artisanName}
                    </Text>
                    <Text style={styles.bookingTrade}>{booking.trade}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.cardBody}>
                  <Text style={styles.detailLabel}>📅 Date</Text>
                  <Text style={styles.detailValue}>{booking.date}</Text>
                  <Text style={styles.detailLabel}>📝 Description</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {booking.description}
                  </Text>
                </View>

                {/* Delete Action */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(booking)}
                >
                  <Text style={styles.deleteButtonText}>🗑 Delete</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12 },
  backText: { color: COLORS.primary, fontSize: 16, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  subtitle: { fontSize: 14, color: COLORS.subtext, marginTop: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  clearText: { fontSize: 16, color: COLORS.subtext, paddingHorizontal: 4 },
  filterScroll: { paddingLeft: 24, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.border, marginRight: 8,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { color: COLORS.text, fontSize: 13 },
  filterChipTextActive: { color: COLORS.white, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  bookingCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: { flex: 1, marginRight: 8 },
  bookingParties: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  bookingTrade: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  detailLabel: { fontSize: 12, color: COLORS.subtext, marginTop: 8 },
  detailValue: { fontSize: 14, color: COLORS.text, marginTop: 2 },
  deleteButton: {
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteButtonText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
});