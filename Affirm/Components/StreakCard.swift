import SwiftUI

struct StreakCard: View {
    let currentStreak: Int
    let bestStreak: Int
    let hasCheckedInToday: Bool

    var body: some View {
        HStack(spacing: Theme.paddingLarge) {
            VStack(spacing: 4) {
                Text("\(currentStreak)")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.streakGold)
                Text("day streak")
                    .font(Theme.captionFont)
                    .foregroundStyle(Theme.textSecondary)
            }

            Divider()
                .frame(height: 44)

            VStack(spacing: 4) {
                Text("\(bestStreak)")
                    .font(.system(size: 24, weight: .semibold, design: .rounded))
                    .foregroundStyle(Theme.textPrimary)
                Text("best streak")
                    .font(Theme.captionFont)
                    .foregroundStyle(Theme.textSecondary)
            }

            Spacer()

            if hasCheckedInToday {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title)
                    .foregroundStyle(Theme.teal)
            } else {
                Image(systemName: "circle")
                    .font(.title)
                    .foregroundStyle(Theme.textTertiary)
            }
        }
        .padding(Theme.paddingLarge)
        .cardStyle()
    }
}

struct StreakBadge: View {
    let count: Int

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "flame.fill")
                .foregroundStyle(Theme.streakGold)
            Text("\(count)")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.textPrimary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Theme.streakGold.opacity(0.12))
        .clipShape(Capsule())
    }
}
