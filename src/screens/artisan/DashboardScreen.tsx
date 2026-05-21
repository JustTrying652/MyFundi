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
} from 'react-native';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Booking, Artisan } from '../../types';
import { COLORS } from '../../constants';
import { signOut } from 'firebase/auth';

export default function DashboardScreen({ navigation }: any) {
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // Fetch artisan profile
      const artisanDoc = await getDoc(doc(db, 'artisans', uid));
      if (artisanDoc.exists()) {
        setArtisan(artisanDoc.data() as Artisan);
      }

      // Fetch bookings
      const q = query(collection(db, 'bookings'), where('artisanId', '==', uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Booking[];
      setBookings(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid || !artisan) return;
      const newAvailability = !artisan.available;
      await updateDoc(doc(db, 'artisans', uid), { available: newAvailability });
      setArtisan({ ...artisan, available: newAvailability });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

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

  // Stats
  const pending = bookings.filter(b => b.status === 'pending').length;
  const accepted = bookings.filter(b => b.status === 'accepted').length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const recentBookings = bookings
    .sort((a, b) => ((b.createdAt as any)?.seconds || 0) - ((a.createdAt as any)?.seconds || 0))
    .slice(0, 3);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>{artisan?.name || 'Fundi'}</Text>
            <Text style={styles.trade}>{artisan?.trade || 'Trade not set'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Availability Toggle */}
        <TouchableOpacity
          style={[
            styles.availabilityBar,
            artisan?.available ? styles.availableOn : styles.availableOff,
          ]}
          onPress={handleToggleAvailability}
        >
          <Text style={styles.availabilityText}>
            {artisan?.available ? '🟢 You are Available for Work' : '🔴 You are Unavailable'}
          </Text>
          <Text style={styles.availabilityToggle}>Tap to toggle</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderTopColor: COLORS.pending }]}>
            <Text style={styles.statValue}>{pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.success }]}>
            <Text style={styles.statValue}>{accepted}</Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#3498DB' }]}>
            <Text style={styles.statValue}>{completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.primary }]}>
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Profile Completion */}
        {(!artisan?.trade || !artisan?.bio || !artisan?.location?.address) && (
          <View style={styles.profileAlert}>
            <Text style={styles.profileAlertTitle}>⚠️ Complete your profile</Text>
            <Text style={styles.profileAlertText}>
              Add your trade, bio and location so customers can find you
            </Text>
          </View>
        )}

        {/* Recent Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          {recentBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Text style={styles.emptySubtext}>
                Complete your profile to start receiving requests
              </Text>
            </View>
          ) : (
            recentBookings.map(booking => (
              <View key={booking.id} style={styles.recentCard}>
                <View style={styles.recentCardLeft}>
                  <Text style={styles.recentCustomer}>{booking.customerName}</Text>
                  <Text style={styles.recentDescription} numberOfLines={1}>
                    {booking.description}
                  </Text>
                  <Text style={styles.recentDate}>📅 {booking.date}</Text>
                </View>
                <View style={[
                  styles.recentStatus,
                  {
                    backgroundColor:
                      booking.status === 'pending' ? '#FEF9E7' :
                      booking.status === 'accepted' ? '#E8F8F0' :
                      booking.status === 'completed' ? '#EBF5FB' : '#FDECEA'
                  }
                ]}>
                  <Text style={[
                    styles.recentStatusText,
                    {
                      color:
                        booking.status === 'pending' ? COLORS.pending :
                        booking.status === 'accepted' ? COLORS.success :
                        booking.status === 'completed' ? '#3498DB' : COLORS.danger
                    }
                  ]}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.subtext,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginTop: 2,
  },
  trade: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#FDECEA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 13,
  },
  availabilityBar: {
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  availableOn: {
    backgroundColor: '#E8F8F0',
  },
  availableOff: {
    backgroundColor: '#FDECEA',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  availabilityToggle: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.subtext,
    marginTop: 4,
  },
  profileAlert: {
    backgroundColor: '#FEF9E7',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.pending,
  },
  profileAlertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileAlertText: {
    fontSize: 13,
    color: COLORS.subtext,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
    borderRadius: 16,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.subtext,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  recentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  recentCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  recentCustomer: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  recentDescription: {
    fontSize: 13,
    color: COLORS.subtext,
    marginTop: 2,
  },
  recentDate: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 4,
  },
  recentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});