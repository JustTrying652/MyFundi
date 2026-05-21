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
import { collection, addDoc, updateDoc, doc, getDoc, increment } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { RootStackParamList } from '../../types';
import { COLORS } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ReviewScreen'>;
  route: RouteProp<RootStackParamList, 'ReviewScreen'>;
};

export default function ReviewScreen({ navigation, route }: Props) {
  const { bookingId, artisanId, artisanName } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a star rating');
      return;
    }

    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // Save review
      await addDoc(collection(db, 'reviews'), {
        customerId: uid,
        customerName: auth.currentUser?.displayName || 'Customer',
        artisanId,
        bookingId,
        rating,
        comment,
        createdAt: new Date(),
      });

      // Update artisan rating
      const artisanRef = doc(db, 'artisans', artisanId);
      const artisanSnap = await getDoc(artisanRef);
      if (artisanSnap.exists()) {
        const data = artisanSnap.data();
        const totalReviews = (data.totalReviews || 0) + 1;
        const currentRating = data.rating || 0;
        const newRating = ((currentRating * (totalReviews - 1)) + rating) / totalReviews;

        await updateDoc(artisanRef, {
          rating: Math.round(newRating * 10) / 10,
          totalReviews,
        });
      }

      // Mark booking as reviewed
      await updateDoc(doc(db, 'bookings', bookingId), { reviewed: true });

      Alert.alert(
        'Review Submitted! ⭐',
        'Thank you for your feedback!',
        [{ text: 'OK', onPress: () => navigation.navigate('CustomerTabs') }]
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
          <Text style={styles.title}>Leave a Review</Text>
          <Text style={styles.subtitle}>How was your experience with {artisanName}?</Text>
        </View>

        {/* Star Rating */}
        <View style={styles.starsSection}>
          <Text style={styles.starsLabel}>Tap to rate</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={[styles.star, star <= rating && styles.starActive]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 0 ? 'Select a rating' :
             rating === 1 ? 'Poor' :
             rating === 2 ? 'Fair' :
             rating === 3 ? 'Good' :
             rating === 4 ? 'Very Good' : 'Excellent!'}
          </Text>
        </View>

        {/* Comment */}
        <View style={styles.form}>
          <Text style={styles.label}>Comment (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={comment}
            onChangeText={setComment}
            placeholder="Tell others about your experience..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>⭐ Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  backButton: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  backText: { color: COLORS.primary, fontSize: 16 },
  header: { paddingHorizontal: 24, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  subtitle: { fontSize: 14, color: COLORS.subtext, marginTop: 4 },
  starsSection: { alignItems: 'center', marginBottom: 32 },
  starsLabel: { fontSize: 14, color: COLORS.subtext, marginBottom: 12 },
  starsRow: { flexDirection: 'row', gap: 12 },
  star: { fontSize: 48, color: COLORS.border },
  starActive: { color: '#F5A623' },
  ratingLabel: {
    fontSize: 16, fontWeight: '600',
    color: COLORS.text, marginTop: 12,
  },
  form: { paddingHorizontal: 24, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.white, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 12,
    padding: 14, fontSize: 15, color: COLORS.text,
  },
  textArea: { height: 120, paddingTop: 14 },
  submitButton: {
    backgroundColor: COLORS.primary, padding: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 24,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});