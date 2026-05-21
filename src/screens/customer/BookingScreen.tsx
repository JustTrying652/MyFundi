import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { RootStackParamList } from '../../types';
import { COLORS } from '../../constants';
import { sendLocalNotification } from '../../services/notifications';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BookingScreen'>;
  route: RouteProp<RootStackParamList, 'BookingScreen'>;
};

export default function BookingScreen({ navigation, route }: Props) {
  const { artisan } = route.params;
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleBooking = async () => {
    if (!description || !date) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      await addDoc(collection(db, 'bookings'), {
        customerId: uid,
        customerName: auth.currentUser?.displayName || 'Customer',
        artisanId: artisan.uid,
        artisanName: artisan.name,
        trade: artisan.trade,
        description,
        date,
        status: 'pending',
        createdAt: new Date(),
      });

      Alert.alert(
        'Booking Sent! 🎉',
        `Your booking request has been sent to ${artisan.name}. They will contact you shortly.`,
        [{ text: 'OK', onPress: () => navigation.navigate('CustomerTabs') }]
      );
      await sendLocalNotification(
  'Booking Sent! 📅',
  `Your booking request has been sent to ${artisan.name}. They will contact you shortly.`
);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Book a Fundi</Text>
          <Text style={styles.subtitle}>Fill in the details for your job request</Text>
        </View>

        {/* Artisan Summary */}
        <View style={styles.artisanSummary}>
          <View style={styles.artisanAvatar}>
            <Text style={styles.artisanAvatarText}>🔨</Text>
          </View>
          <View>
            <Text style={styles.artisanName}>{artisan.name}</Text>
            <Text style={styles.artisanTrade}>{artisan.trade}</Text>
            <Text style={styles.artisanLocation}>
              📍 {artisan.location?.address || 'Location not set'}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Preferred Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="e.g. 25/05/2026"
            keyboardType="default"
          />

          <Text style={styles.label}>Job Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you need done e.g. Fix leaking pipe in kitchen, weld gate hinges..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ℹ️ After booking, the fundi will contact you directly via phone or WhatsApp to confirm and discuss pricing.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.bookButton, saving && styles.bookButtonDisabled]}
            onPress={handleBooking}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.bookButtonText}>📅 Send Booking Request</Text>
            )}
          </TouchableOpacity>
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
  backButton: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
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
  artisanSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
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
    marginTop: 2,
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  infoBox: {
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#3498DB',
  },
  infoText: {
    fontSize: 13,
    color: '#2C3E50',
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});