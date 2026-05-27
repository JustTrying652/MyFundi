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
  Image,
} from 'react-native';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS } from '../../constants';

interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  suspended?: boolean;
  verified?: boolean;
  createdAt: any;
}

export default function AdminUsersScreen({ navigation }: any) {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'artisan'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const data = snapshot.docs.map(d => ({
        uid: d.id,
        ...d.data(),
      })) as User[];
      data.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setUsers(data);
      setFiltered(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let result = users.filter(u => u.role !== 'admin');
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    if (searchQuery) {
      result = result.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.includes(searchQuery)
      );
    }
    setFiltered(result);
  };

  const handleSuspend = async (user: User) => {
    const action = user.suspended ? 'Unsuspend' : 'Suspend';
    Alert.alert(
      `${action} User`,
      `Are you sure you want to ${action.toLowerCase()} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: user.suspended ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'users', user.uid), {
                suspended: !user.suspended,
              });
              if (user.role === 'artisan') {
                await updateDoc(doc(db, 'artisans', user.uid), {
                  suspended: !user.suspended,
                  available: user.suspended,
                });
              }
              setUsers(prev =>
                prev.map(u =>
                  u.uid === user.uid ? { ...u, suspended: !u.suspended } : u
                )
              );
              Alert.alert('Success', `${user.name} has been ${action.toLowerCase()}ed.`);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };
  const handleVerify = async (user: User) => {
  const action = user.verified ? 'Unverify' : 'Verify';
  Alert.alert(
    `${action} Fundi`,
    `Are you sure you want to ${action.toLowerCase()} ${user.name}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        onPress: async () => {
          try {
            await updateDoc(doc(db, 'artisans', user.uid), {
              verified: !user.verified,
            });
            setUsers(prev =>
              prev.map(u =>
                u.uid === user.uid ? { ...u, verified: !u.verified } : u
              )
            );
            Alert.alert('Success', `${user.name} has been ${action.toLowerCase()}ed.`);
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]
  );
};
  const handleDelete = async (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete ${user.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.uid));
              if (user.role === 'artisan') {
                await deleteDoc(doc(db, 'artisans', user.uid));
              }
              setUsers(prev => prev.filter(u => u.uid !== user.uid));
              Alert.alert('Success', `${user.name} has been deleted.`);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Users</Text>
        <Text style={styles.subtitle}>{filtered.length} users</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or phone..."
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

      {/* Role Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {(['all', 'customer', 'artisan'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, roleFilter === f && styles.filterChipActive]}
            onPress={() => setRoleFilter(f)}
          >
            <Text style={[styles.filterChipText, roleFilter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>No users found</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {filtered.map(user => (
            <View key={user.uid} style={[styles.userCard, user.suspended && styles.userCardSuspended]}>
              <View style={styles.userCardTop}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {user.role === 'artisan' ? '🔨' : '🙋'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
  <Text style={styles.userName}>{user.name}</Text>
  {user.verified && (
    <Text style={styles.verifiedBadge}>✅ Verified</Text>
  )}
  <View style={[
    styles.roleBadge,
    { backgroundColor: user.role === 'artisan' ? '#E8F8F0' : '#EBF5FB' }
  ]}>
    <Text style={[
      styles.roleText,
      { color: user.role === 'artisan' ? COLORS.success : '#3498DB' }
    ]}>
      {user.role === 'artisan' ? 'Fundi' : 'Customer'}
    </Text>
  </View>
  {user.suspended && (
    <View style={styles.suspendedBadge}>
      <Text style={styles.suspendedText}>Suspended</Text>
    </View>
  )}
</View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userPhone}>📞 {user.phone}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
  {user.role === 'artisan' && (
    <TouchableOpacity
      style={[
        styles.actionButton,
        user.verified ? styles.unverifyButton : styles.verifyButton
      ]}
      onPress={() => handleVerify(user)}
    >
      <Text style={[
        styles.actionButtonText,
        { color: user.verified ? COLORS.subtext : '#3498DB' }
      ]}>
        {user.verified ? '✓ Verified' : '🔍 Verify'}
      </Text>
    </TouchableOpacity>
  )}
  <TouchableOpacity
    style={[
      styles.actionButton,
      user.suspended ? styles.unsuspendButton : styles.suspendButton
    ]}
    onPress={() => handleSuspend(user)}
  >
    <Text style={[
      styles.actionButtonText,
      { color: user.suspended ? COLORS.success : COLORS.pending }
    ]}>
      {user.suspended ? '✓ Unsuspend' : '⚠ Suspend'}
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.actionButton, styles.deleteButton]}
    onPress={() => handleDelete(user)}
  >
    <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>
      🗑 Delete
    </Text>
  </TouchableOpacity>
</View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  verifyButton: { borderColor: '#3498DB', backgroundColor: '#EBF5FB' },
unverifyButton: { borderColor: COLORS.border, backgroundColor: COLORS.background },
verifiedBadge: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
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
  userCard: {
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
  userCardSuspended: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  userCardTop: { flexDirection: 'row', marginBottom: 12 },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: { fontSize: 24 },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  userName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '600' },
  suspendedBadge: { backgroundColor: '#FDECEA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  suspendedText: { fontSize: 11, fontWeight: '600', color: COLORS.danger },
  userEmail: { fontSize: 13, color: COLORS.subtext, marginTop: 3 },
  userPhone: { fontSize: 13, color: COLORS.subtext, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  actionButton: {
    flex: 1, padding: 10, borderRadius: 10,
    alignItems: 'center', borderWidth: 1,
  },
  suspendButton: { borderColor: COLORS.pending, backgroundColor: '#FEF9E7' },
  unsuspendButton: { borderColor: COLORS.success, backgroundColor: '#E8F8F0' },
  deleteButton: { borderColor: COLORS.danger, backgroundColor: '#FDECEA' },
  actionButtonText: { fontSize: 13, fontWeight: '600' },
});