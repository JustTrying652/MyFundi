import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { COLORS } from '../../constants';

export default function AdminDashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalArtisans: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(d => d.data());
      const totalCustomers = users.filter(u => u.role === 'customer').length;
      const totalArtisans = users.filter(u => u.role === 'artisan').length;

      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const bookings = bookingsSnap.docs.map(d => d.data());
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;

      const reviewsSnap = await getDocs(collection(db, 'reviews'));

      setStats({
        totalUsers: users.length,
        totalCustomers,
        totalArtisans,
        totalBookings: bookings.length,
        pendingBookings,
        completedBookings,
        totalReviews: reviewsSnap.size,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

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
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>MyFundi platform overview</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Users Stats */}
        <Text style={styles.sectionTitle}>👥 Users</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderTopColor: COLORS.primary }]}>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#3498DB' }]}>
            <Text style={styles.statValue}>{stats.totalCustomers}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.success }]}>
            <Text style={styles.statValue}>{stats.totalArtisans}</Text>
            <Text style={styles.statLabel}>Fundis</Text>
          </View>
        </View>

        {/* Bookings Stats */}
        <Text style={styles.sectionTitle}>📋 Bookings</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderTopColor: COLORS.secondary }]}>
            <Text style={styles.statValue}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.pending }]}>
            <Text style={styles.statValue}>{stats.pendingBookings}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.success }]}>
            <Text style={styles.statValue}>{stats.completedBookings}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Reviews Stats */}
        <Text style={styles.sectionTitle}>⭐ Reviews</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderTopColor: '#F5A623' }]}>
            <Text style={styles.statValue}>{stats.totalReviews}</Text>
            <Text style={styles.statLabel}>Total Reviews</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <Text style={styles.actionEmoji}>👥</Text>
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionSubtitle}>View, suspend or remove users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminBookings')}
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={styles.actionTitle}>View Bookings</Text>
            <Text style={styles.actionSubtitle}>Monitor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  subtitle: { fontSize: 14, color: COLORS.subtext, marginTop: 4 },
  logoutButton: {
    backgroundColor: '#FDECEA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: { color: COLORS.danger, fontWeight: '600', fontSize: 13 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 24,
    marginBottom: 12,
    marginTop: 8,
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
    minWidth: '28%',
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
  statValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.subtext, marginTop: 4, textAlign: 'center' },
  actionsContainer: { paddingHorizontal: 24, gap: 12, paddingBottom: 40 },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  actionEmoji: { fontSize: 32, marginBottom: 8 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  actionSubtitle: { fontSize: 13, color: COLORS.subtext, marginTop: 4 },
});