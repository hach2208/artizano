import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const MandarinWithLiWei());
}

class MandarinWithLiWei extends StatelessWidget {
  const MandarinWithLiWei({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mandarin with Li Wei',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(),
        scaffoldBackgroundColor: const Color(0xFFF5F5F7),
      ),
      home: const HomeScreen(),
    );
  }
}

// --- 1. MOTEUR SRS (ALGORITHME) ---
class SRSEngine {
  static Map<String, dynamic> calculate(
      int quality, int prevInt, int prevRep, double prevEF) {
    int nextInt;
    int nextRep;
    double nextEF;
    if (quality >= 3) {
      if (prevRep == 0) {
        nextInt = 1;
      } else if (prevRep == 1) {
        nextInt = 6;
      } else {
        nextInt = (prevInt * prevEF).round();
      }
      nextRep = prevRep + 1;
    } else {
      nextInt = 1;
      nextRep = 0;
    }
    nextEF =
        prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (nextEF < 1.3) nextEF = 1.3;
    return {'interval': nextInt, 'repetition': nextRep, 'efactor': nextEF};
  }
}

// --- 2. ECRAN D'ACCUEIL (DASHBOARD) ---
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Ni hao, Alex!",
                          style: TextStyle(
                              fontSize: 24, fontWeight: FontWeight.bold)),
                      Text("Ready for your session?",
                          style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                  CircleAvatar(
                      radius: 28,
                      backgroundColor: Colors.grey[300],
                      child: const Text("\u674E",
                          style: TextStyle(fontSize: 20))),
                ],
              ),
              const SizedBox(height: 32),
              _buildHeroCard(context),
              const SizedBox(height: 32),
              const Text("Your Progress",
                  style:
                      TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                children: [
                  _buildStatTile(
                      "Flashcards", "12 to review", Icons.style, Colors.blue),
                  _buildStatTile(
                      "Roleplay", "Business", Icons.work, Colors.orange),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroCard(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05), blurRadius: 20)
        ],
      ),
      child: Column(
        children: [
          const Text("\uD83D\uDDE3\uFE0F",
              style: TextStyle(fontSize: 40)),
          const SizedBox(height: 12),
          const Text("Live with Li Wei",
              style:
                  TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const Text("Topic: Ordering Coffee",
              style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const ChatScreen())),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFC0392B),
              minimumSize: const Size(200, 56),
              shape: const StadiumBorder(),
            ),
            child: const Text("START TALKING",
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildStatTile(
      String title, String sub, IconData icon, Color col) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: col, size: 32),
          const Spacer(),
          Text(title,
              style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(sub,
              style:
                  const TextStyle(fontSize: 12, color: Colors.grey)),
        ],
      ),
    );
  }
}

// --- 3. ECRAN DE CHAT (INTERFACE IA) ---
class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<Map<String, String>> messages = [
    {
      "r": "ai",
      "t": "\u6700\u8FD1\u600E\u4E48\u6837\uFF1F",
      "p": "Zuijin zenmeyang?",
      "m": "How's it going?"
    }
  ];

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      messages.add({"r": "user", "t": text, "p": "", "m": ""});
      _controller.clear();
      // Simulate AI response
      Future.delayed(const Duration(milliseconds: 800), () {
        if (mounted) {
          setState(() {
            messages.add({
              "r": "ai",
              "t": "\u5F88\u597D\uFF01\u4F60\u8BF4\u5F97\u4E0D\u9519\u3002",
              "p": "Hen hao! Ni shuo de bucuo.",
              "m": "Very good! You speak well."
            });
          });
        }
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: const Text("Li Wei"),
          backgroundColor: Colors.white,
          elevation: 0),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: messages.length,
              itemBuilder: (context, i) {
                final isAi = messages[i]['r'] == 'ai';
                return Align(
                  alignment: isAi
                      ? Alignment.centerLeft
                      : Alignment.centerRight,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(16),
                    constraints: BoxConstraints(
                        maxWidth:
                            MediaQuery.of(context).size.width * 0.75),
                    decoration: BoxDecoration(
                      color: isAi
                          ? Colors.white
                          : const Color(0xFFC0392B),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10)
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(messages[i]['t']!,
                            style: TextStyle(
                                fontSize: 18,
                                color: isAi
                                    ? Colors.black
                                    : Colors.white)),
                        if (isAi) ...[
                          const SizedBox(height: 4),
                          Text(messages[i]['p']!,
                              style: const TextStyle(
                                  color: Colors.grey, fontSize: 13)),
                          const Divider(),
                          Text(messages[i]['m']!,
                              style: const TextStyle(
                                  fontStyle: FontStyle.italic,
                                  fontSize: 13)),
                        ]
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          _buildInput(),
        ],
      ),
    );
  }

  Widget _buildInput() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2))
        ],
      ),
      child: Row(
        children: [
          IconButton(
              onPressed: () {},
              icon:
                  const Icon(Icons.mic, color: Color(0xFFC0392B), size: 28)),
          Expanded(
            child: TextField(
              controller: _controller,
              decoration: const InputDecoration(
                  hintText: "Type or speak...", border: InputBorder.none),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          IconButton(
              onPressed: _sendMessage,
              icon: const Icon(Icons.send,
                  color: Color(0xFFC0392B), size: 28)),
        ],
      ),
    );
  }
}

// --- 4. PAYWALL (MODELE REVENUECAT) ---
class Paywall extends StatelessWidget {
  const Paywall({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(elevation: 0, backgroundColor: Colors.transparent),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.star, size: 60, color: Colors.orange),
            const SizedBox(height: 16),
            const Text("Go Premium",
                style:
                    TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
            const Text("Speak Mandarin naturally with Li Wei.",
                textAlign: TextAlign.center),
            const Spacer(),
            _planCard("Annual", "89.99 USD / year", "Best Value", true),
            const SizedBox(height: 12),
            _planCard("Monthly", "14.99 USD / month", "", false),
            const Spacer(),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFC0392B),
                minimumSize: const Size(double.infinity, 60),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: () {},
              child: const Text("START 3-DAY FREE TRIAL",
                  style: TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 16),
            const Text("No commitment. Cancel anytime.",
                style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _planCard(
      String title, String price, String badge, bool highlight) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border.all(
            color: highlight
                ? const Color(0xFFC0392B)
                : Colors.grey[300]!,
            width: 2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(price),
              ]),
          if (badge.isNotEmpty)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                  color: Colors.green,
                  borderRadius: BorderRadius.circular(8)),
              child: Text(badge,
                  style: const TextStyle(
                      color: Colors.white, fontSize: 10)),
            )
        ],
      ),
    );
  }
}
