import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const initialMessages = [
  {
    id: '1',
    role: 'ai',
    text: '最近怎么样？',
    pinyin: 'Zuìjìn zěnmeyàng?',
    meaning: "How's it going?",
  },
];

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      pinyin: '',
      meaning: '',
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');

    // Simulated AI response
    setTimeout(() => {
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: '很好！你说得不错。',
        pinyin: 'Hěn hǎo! Nǐ shuō de búcuò.',
        meaning: 'Very good! You speak well.',
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  };

  const renderMessage = ({ item }) => {
    const isAi = item.role === 'ai';
    return (
      <View
        style={[
          styles.bubble,
          isAi ? styles.aiBubble : styles.userBubble,
          { alignSelf: isAi ? 'flex-start' : 'flex-end' },
        ]}
      >
        <Text style={[styles.messageText, !isAi && { color: '#fff' }]}>
          {item.text}
        </Text>
        {isAi && (
          <>
            <Text style={styles.pinyin}>{item.pinyin}</Text>
            <View style={styles.divider} />
            <Text style={styles.meaning}>{item.meaning}</Text>
          </>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.micButton}>
          <Text style={styles.micIcon}>🎤</Text>
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
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  list: {
    padding: 16,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '75%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  aiBubble: {
    backgroundColor: '#fff',
  },
  userBubble: {
    backgroundColor: '#C0392B',
  },
  messageText: {
    fontSize: 18,
    color: '#000',
  },
  pinyin: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  meaning: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#666',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 5,
  },
  micButton: {
    marginRight: 8,
  },
  micIcon: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    marginLeft: 8,
  },
  sendIcon: {
    fontSize: 24,
    color: '#C0392B',
  },
});
