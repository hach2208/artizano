import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';

// --- SRS ENGINE ---
function calculateSRS(quality, prevInterval, prevRepetition, prevEFactor) {
  let nextInterval, nextRepetition, nextEFactor;
  if (quality >= 3) {
    if (prevRepetition === 0) nextInterval = 1;
    else if (prevRepetition === 1) nextInterval = 6;
    else nextInterval = Math.round(prevInterval * prevEFactor);
    nextRepetition = prevRepetition + 1;
  } else {
    nextInterval = 1;
    nextRepetition = 0;
  }
  nextEFactor = prevEFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (nextEFactor < 1.3) nextEFactor = 1.3;
  return { interval: nextInterval, repetition: nextRepetition, efactor: nextEFactor };
}

// --- HOME SCREEN ---
function HomeScreen({ onNavigate }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Ni hao, Alex!</Text>
            <Text style={styles.subtitle}>Ready for your session?</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{'\u674E'}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>{'\uD83D\uDDE3\uFE0F'}</Text>
          <Text style={styles.heroTitle}>Live with Li Wei</Text>
          <Text style={styles.heroSub}>Topic: Ordering Coffee</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => onNavigate('chat')}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>START TALKING</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.grid}>
          <View style={styles.statTile}>
            <Text style={{ fontSize: 28 }}>{'\uD83D\uDCC7'}</Text>
            <View style={{ marginTop: 'auto' }}>
              <Text style={styles.statTitle}>Flashcards</Text>
              <Text style={styles.statSub}>12 to review</Text>
            </View>
          </View>
          <View style={styles.statTile}>
            <Text style={{ fontSize: 28 }}>{'\uD83D\uDCBC'}</Text>
            <View style={{ marginTop: 'auto' }}>
              <Text style={styles.statTitle}>Roleplay</Text>
              <Text style={styles.statSub}>Business</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- CHAT SCREEN ---
function ChatScreen({ onNavigate }) {
  const [messages, setMessages] = useState([
    { id: '1', role: 'ai', text: '\u6700\u8FD1\u600E\u4E48\u6837\uFF1F', pinyin: 'Zuijin zenmeyang?', meaning: "How's it going?" },
  ]);
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text: trimmed, pinyin: '', meaning: '' };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'ai', text: '\u5F88\u597D\uFF01\u4F60\u8BF4\u5F97\u4E0D\u9519\u3002', pinyin: 'Hen hao! Ni shuo de bucuo.', meaning: 'Very good! You speak well.' },
      ]);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => onNavigate('home')}>
          <Text style={{ fontSize: 18, color: '#C0392B' }}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle}>Li Wei</Text>
        <View style={{ width: 60 }} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isAi = item.role === 'ai';
            return (
              <View style={[styles.bubble, isAi ? styles.aiBubble : styles.userBubble, { alignSelf: isAi ? 'flex-start' : 'flex-end' }]}>
                <Text style={[styles.messageText, !isAi && { color: '#fff' }]}>{item.text}</Text>
                {isAi && (
                  <>
                    <Text style={styles.pinyin}>{item.pinyin}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.meaning}>{item.meaning}</Text>
                  </>
                )}
              </View>
            );
          }}
        />
        <View style={styles.inputBar}>
          <TouchableOpacity style={{ marginRight: 8 }}>
            <Text style={{ fontSize: 24 }}>{'\uD83C\uDFA4'}</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type or speak..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={sendMessage} style={{ marginLeft: 8 }}>
            <Text style={{ fontSize: 24, color: '#C0392B' }}>{'\u27A4'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- PAYWALL SCREEN ---
function PaywallScreen({ onNavigate }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => onNavigate('home')}>
          <Text style={{ fontSize: 18, color: '#C0392B' }}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle}>Premium</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.paywallContent}>
        <Text style={{ fontSize: 60 }}>{'\u2B50'}</Text>
        <Text style={styles.paywallTitle}>Go Premium</Text>
        <Text style={styles.paywallSub}>Speak Mandarin naturally with Li Wei.</Text>

        <View style={{ flex: 1 }} />

        <View style={[styles.planCard, { borderColor: '#C0392B' }]}>
          <View>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Annual</Text>
            <Text style={{ color: '#666', marginTop: 2 }}>89.99 USD / year</Text>
          </View>
          <View style={styles.badge}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>Best Value</Text>
          </View>
        </View>

        <View style={{ height: 12 }} />

        <View style={[styles.planCard, { borderColor: '#ddd' }]}>
          <View>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Monthly</Text>
            <Text style={{ color: '#666', marginTop: 2 }}>14.99 USD / month</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.trialButton} activeOpacity={0.8}>
          <Text style={styles.trialButtonText}>START 3-DAY FREE TRIAL</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 16, marginBottom: 16 }}>No commitment. Cancel anytime.</Text>
      </View>
    </SafeAreaView>
  );
}

// --- MAIN APP ---
export default function App() {
  const [screen, setScreen] = useState('home');

  const navigate = (s) => setScreen(s);

  if (screen === 'chat') return <ChatScreen onNavigate={navigate} />;
  if (screen === 'paywall') return <PaywallScreen onNavigate={navigate} />;
  return <HomeScreen onNavigate={navigate} />;
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  scroll: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  greeting: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#999', marginTop: 4 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22 },
  heroCard: { backgroundColor: '#fff', borderRadius: 28, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 3, marginBottom: 32 },
  heroTitle: { fontSize: 22, fontWeight: 'bold' },
  heroSub: { fontSize: 14, color: '#999', marginTop: 4, marginBottom: 24 },
  startButton: { backgroundColor: '#C0392B', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
  startButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  grid: { flexDirection: 'row', gap: 16 },
  statTile: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 16, minHeight: 140, justifyContent: 'space-between' },
  statTitle: { fontWeight: 'bold', fontSize: 15 },
  statSub: { fontSize: 12, color: '#999', marginTop: 2 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  chatHeaderTitle: { fontSize: 18, fontWeight: 'bold' },
  bubble: { maxWidth: '75%', padding: 16, borderRadius: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  aiBubble: { backgroundColor: '#fff' },
  userBubble: { backgroundColor: '#C0392B' },
  messageText: { fontSize: 18, color: '#000' },
  pinyin: { fontSize: 13, color: '#999', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  meaning: { fontSize: 13, fontStyle: 'italic', color: '#666' },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: -2 }, elevation: 5 },
  input: { flex: 1, fontSize: 16, color: '#000' },
  paywallContent: { flex: 1, padding: 24, alignItems: 'center' },
  paywallTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 16 },
  paywallSub: { fontSize: 15, color: '#666', textAlign: 'center', marginTop: 8 },
  planCard: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderWidth: 2, borderRadius: 16, backgroundColor: '#fff' },
  badge: { backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trialButton: { width: '100%', backgroundColor: '#C0392B', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  trialButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
