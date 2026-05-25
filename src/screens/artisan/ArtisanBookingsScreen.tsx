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
  Linking,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Booking } from '../../types';
import { COLORS } from '../../constants';
import { sendLocalNotification } from '../../services/notifications';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';


export default function ArtisanBookingsScreen() {
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
      const q = query(collection(db, 'bookings'), where('artisanId', '==', uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Booking[];
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

  const handleContactCustomer = async (customerId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', customerId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        Alert.alert(
          `Contact ${data.name}`,
          'How would you like to contact this customer?',
          [
            { text: '📞 Call', onPress: () => Linking.openURL(`tel:${data.phone}`) },
            {
              text: '💬 WhatsApp',
              onPress: () => {
                const phone = data.phone.startsWith('0')
                  ? '254' + data.phone.slice(1)
                  : data.phone;
                Linking.openURL(`https://wa.me/${phone}`);
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: 'accepted' | 'rejected' | 'completed') => {
    const labels: Record<string, string> = {
      accepted: 'Accept',
      rejected: 'Reject',
      completed: 'Mark as Completed',
    };
    Alert.alert(
      `${labels[status]} Booking`,
      `Are you sure you want to ${labels[status].toLowerCase()} this booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'bookings', bookingId), { status });
              setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
              if (status === 'accepted') {
                await sendLocalNotification(
                  'Booking Accepted ✅',
                  'You accepted a booking request. Remember to contact the customer!'
                );
              } else if (status === 'completed') {
                await sendLocalNotification(
                  'Job Completed 🎉',
                  'Great work! The job has been marked as completed.'
                );
              }
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

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>{bookings.length} total requests</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
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
          <Text style={styles.emptySubtitle}>Complete your profile so customers can find and book you</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {filteredBookings.map(booking => {
            const statusStyle = getStatusStyle(booking.status);
            return (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.customerName}>{booking.customerName}</Text>
                    <Text style={styles.bookingTrade}>{booking.trade}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.detailLabel}>📅 Date Requested</Text>
                  <Text style={styles.detailValue}>{booking.date}</Text>
                  <Text style={styles.detailLabel}>📝 Job Description</Text>
                  <Text style={styles.detailValue}>{booking.description}</Text>
                </View>

                <TouchableOpacity
                  style={styles.contactCustomerButton}
                  onPress={() => handleContactCustomer(booking.customerId)}
                >
                  <Text style={styles.contactCustomerText}>📞 Contact Customer</Text>
                </TouchableOpacity>
                <TouchableOpacity
  style={styles.chatButton}
  onPress={() => navigation.navigate('ChatScreen', {
    bookingId: booking.id,
    recipientName: booking.customerName,
    recipientId: booking.customerId,
  })}
>
  <Text style={styles.chatButtonText}>💬 Open Chat</Text>
</TouchableOpacity>
                {booking.status === 'pending' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleUpdateStatus(booking.id, 'rejected')}
                    >
                      <Text style={styles.rejectButtonText}>✕ Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleUpdateStatus(booking.id, 'accepted')}
                    >
                      <Text style={styles.acceptButtonText}>✓ Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {booking.status === 'accepted' && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleUpdateStatus(booking.id, 'completed')}
                  >
                    <Text style={styles.completeButtonText}>✅ Mark as Completed</Text>
                  </TouchableOpacity>
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
  chatButton: {
  backgroundColor: '#F0F3FF',
  borderRadius: 10,
  padding: 12,
  alignItems: 'center',
  marginTop: 10,
  borderWidth: 1,
  borderColor: '#C5CAE9',
},
chatButtonText: {
  color: '#3F51B5',
  fontWeight: '600',
  fontSize: 14,
},
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  subtitle: { fontSize: 14, color: COLORS.subtext, marginTop: 4 },
  filterScroll: { paddingLeft: 24, marginVertical: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { color: COLORS.text, fontSize: 13 },
  filterChipTextActive: { color: COLORS.white, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.subtext, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  list: { paddingHorizontal: 24 },
  bookingCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  customerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  bookingTrade: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardBody: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, gap: 4 },
  detailLabel: { fontSize: 12, color: COLORS.subtext, marginTop: 8 },
  detailValue: { fontSize: 14, color: COLORS.text, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  rejectButton: { flex: 1, borderWidth: 1.5, borderColor: COLORS.danger, borderRadius: 10, padding: 12, alignItems: 'center' },
  rejectButtonText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
  acceptButton: { flex: 1, backgroundColor: COLORS.success, borderRadius: 10, padding: 12, alignItems: 'center' },
  acceptButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  completeButton: { backgroundColor: '#EBF5FB', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12 },
  completeButtonText: { color: '#3498DB', fontWeight: '600', fontSize: 14 },
  contactCustomerButton: { backgroundColor: '#EBF5FB', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12 },
  contactCustomerText: { color: '#3498DB', fontWeight: '600', fontSize: 14 },
});