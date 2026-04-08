import 'package:flutter_test/flutter_test.dart';
import 'package:mandarin_with_li_wei/main.dart';

void main() {
  testWidgets('App renders home screen', (WidgetTester tester) async {
    await tester.pumpWidget(const MandarinWithLiWei());
    expect(find.text('Ni hao, Alex!'), findsOneWidget);
    expect(find.text('Live with Li Wei'), findsOneWidget);
    expect(find.text('START TALKING'), findsOneWidget);
  });

  test('SRS Engine calculates correctly', () {
    // First review with quality 4
    final result = SRSEngine.calculate(4, 0, 0, 2.5);
    expect(result['interval'], 1);
    expect(result['repetition'], 1);
    expect(result['efactor'], closeTo(2.5, 0.1));

    // Second review with quality 4
    final result2 = SRSEngine.calculate(4, 1, 1, 2.5);
    expect(result2['interval'], 6);
    expect(result2['repetition'], 2);

    // Failed review (quality < 3) resets
    final result3 = SRSEngine.calculate(1, 6, 2, 2.5);
    expect(result3['interval'], 1);
    expect(result3['repetition'], 0);
  });
}
