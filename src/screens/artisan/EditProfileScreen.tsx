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
  Alert,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { COLORS, TRADES } from '../../constants';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [trade, setTrade] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTradePicker, setShowTradePicker] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const docSnap = await getDoc(doc(db, 'artisans', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || '');
        setTrade(data.trade || '');
        setBio(data.bio || '');
        setPhone(data.phone || '');
        setAddress(data.location?.address || '');
        setAvailable(data.available ?? true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !trade || !phone) {
      Alert.alert('Error', 'Name, trade and phone are required');
      return;
    }

    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      await updateDoc(doc(db, 'artisans', uid), {
        name,
        trade,
        bio,
        phone,
        available,
        location: {
          address,
          latitude: 0,
          longitude: 0,
        },
      });

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
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
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>Complete your profile to get hired</Text>
        </View>

        {/* Availability Toggle */}
        <TouchableOpacity
          style={[styles.availabilityBar, available ? styles.availableOn : styles.availableOff]}
          onPress={() => setAvailable(!available)}
        >
          <Text style={styles.availabilityText}>
            {available ? '🟢 You are Available for Work' : '🔴 You are Unavailable'}
          </Text>
          <Text style={styles.availabilityToggle}>Tap to toggle</Text>
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 0712345678"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Trade / Skill *</Text>
          <TouchableOpacity
            style={styles.tradeSelector}
            onPress={() => setShowTradePicker(!showTradePicker)}
          >
            <Text style={trade ? styles.tradeSelectorText : styles.tradeSelectorPlaceholder}>
              {trade || 'Select your trade'}
            </Text>
            <Text>{showTradePicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showTradePicker && (
            <View style={styles.tradeDropdown}>
              {TRADES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tradeOption, trade === t && styles.tradeOptionActive]}
                  onPress={() => {
                    setTrade(t);
                    setShowTradePicker(false);
                  }}
                >
                  <Text style={[styles.tradeOptionText, trade === t && styles.tradeOptionTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell customers about yourself, your experience, and what makes you great..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Location / Area</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. Meru Town, Kenyatta Avenue"
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
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
    height: 100,
    paddingTop: 14,
  },
  tradeSelector: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tradeSelectorText: {
    fontSize: 15,
    color: COLORS.text,
  },
  tradeSelectorPlaceholder: {
    fontSize: 15,
    color: COLORS.subtext,
  },
  tradeDropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  tradeOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tradeOptionActive: {
    backgroundColor: COLORS.primary,
  },
  tradeOptionText: {
    fontSize: 15,
    color: COLORS.text,
  },
  tradeOptionTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});