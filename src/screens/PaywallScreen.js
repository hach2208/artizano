import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

function PlanCard({ title, price, badge, highlight }) {
  return (
    <View
      style={[
        styles.planCard,
        { borderColor: highlight ? '#C0392B' : '#ddd' },
      ]}
    >
      <View>
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={styles.planPrice}>{price}</Text>
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function PaywallScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.starIcon}>⭐</Text>
        <Text style={styles.title}>Go Premium</Text>
        <Text style={styles.subtitle}>
          Speak Mandarin naturally with Li Wei.
        </Text>

        <View style={styles.spacer} />

        <PlanCard
          title="Annual"
          price="89.99 USD / year"
          badge="Best Value"
          highlight
        />
        <View style={{ height: 12 }} />
        <PlanCard
          title="Monthly"
          price="14.99 USD / month"
          badge=""
          highlight={false}
        />

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.trialButton} activeOpacity={0.8}>
          <Text style={styles.trialButtonText}>START 3-DAY FREE TRIAL</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          No commitment. Cancel anytime.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  spacer: {
    flex: 1,
  },
  planCard: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  planTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  planPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  trialButton: {
    width: '100%',
    backgroundColor: '#C0392B',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  trialButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
    marginBottom: 16,
  },
});
