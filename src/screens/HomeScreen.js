import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Nǐ hǎo, Alex!</Text>
            <Text style={styles.subtitle}>Ready for your session?</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>李</Text>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🗣️</Text>
          <Text style={styles.heroTitle}>Live with Li Wei</Text>
          <Text style={styles.heroSub}>Topic: Ordering Coffee</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('Chat')}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>START TALKING</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.grid}>
          <View style={styles.statTile}>
            <Text style={[styles.statIcon, { color: '#3b82f6' }]}>📇</Text>
            <View style={styles.statBottom}>
              <Text style={styles.statTitle}>Flashcards</Text>
              <Text style={styles.statSub}>12 to review</Text>
            </View>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statIcon, { color: '#f97316' }]}>💼</Text>
            <View style={styles.statBottom}>
              <Text style={styles.statTitle}>Roleplay</Text>
              <Text style={styles.statSub}>Business</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scroll: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 32,
  },
  heroEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  heroSub: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  statIcon: {
    fontSize: 28,
  },
  statBottom: {
    marginTop: 'auto',
  },
  statTitle: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  statSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
