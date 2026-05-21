import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Booking } from '../../types';
import { COLORS } from '../../constants';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';



export default function MyBookingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const q = query(
        collection(db, 'bookings'),
        where('customerId', '==', uid),
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];

      data.sort((a, b) => {
        const aTime = (a.createdAt as any)?.seconds || 0;
        const bTime = (b.createdAt as any)?.seconds || 0;
        return bTime - aTime;
      });

      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
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

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      case 'completed': return '🎉';
      default: return '📋';
    }
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>{bookings.length} total requests</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {(['all', 'pending', 'accepted', 'completed'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySubtitle}>
            Find a fundi and send your first booking request
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {filteredBookings.map(booking => {
            const statusStyle = getStatusStyle(booking.status);
            return (
              <View key={booking.id} style={styles.bookingCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.artisanInfo}>
                    <Text style={styles.artisanName}>
                      {getStatusEmoji(booking.status)} {booking.artisanName}
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
                  <Text style={styles.detailLabel}>📅 Date Requested</Text>
                  <Text style={styles.detailValue}>{booking.date}</Text>

                  <Text style={styles.detailLabel}>📝 Job Description</Text>
                  <Text style={styles.detailValue}>{booking.description}</Text>
                </View>

                {/* Status Message */}
                {booking.status === 'accepted' && (
                  <View style={styles.statusMessage}>
                    <Text style={styles.statusMessageText}>
                      ✅ Your booking has been accepted! The fundi will contact you shortly.
                    </Text>
                  </View>
                )}
                {booking.status === 'rejected' && (
                  <View style={[styles.statusMessage, styles.statusMessageRejected]}>
                    <Text style={styles.statusMessageText}>
                      ❌ This booking was declined. Try booking another fundi.
                    </Text>
                  </View>
                )}
                {booking.status === 'completed' && (
                 <View>
                   <View style={[styles.statusMessage, styles.statusMessageCompleted]}>
                    <Text style={styles.statusMessageText}>
                      🎉 Job completed! Thank you for using MyFundi.
                    </Text>
                  </View>
                  {!booking.reviewed && (
                    <TouchableOpacity
                      style={styles.reviewButton}
                      onPress={() => navigation.navigate('ReviewScreen', {
                        bookingId: booking.id,
                        artisanId: booking.artisanId,
                        artisanName: booking.artisanName,
                     })}
                    >
                     <Text style={styles.reviewButtonText}>⭐ Leave a Review</Text>
                   </TouchableOpacity>
                    )}
                   </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  reviewButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  reviewButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
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
  filterScroll: {
    paddingLeft: 24,
    marginVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.text,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  list: {
    paddingHorizontal: 24,
  },
  bookingCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  artisanInfo: {
    flex: 1,
  },
  artisanName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bookingTrade: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
  },
  statusMessage: {
    backgroundColor: '#E8F8F0',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  statusMessageRejected: {
    backgroundColor: '#FDECEA',
  },
  statusMessageCompleted: {
    backgroundColor: '#EBF5FB',
  },
  statusMessageText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
});