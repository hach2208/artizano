import SwiftUI

struct PremiumBadge: View {
    var body: some View {
        Label("Premium", systemImage: "crown.fill")
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(Theme.streakGold)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Theme.streakGold.opacity(0.12))
            .clipShape(Capsule())
    }
}

struct PremiumCTACard: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.paddingMedium) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Unlock Affirm. Premium")
                        .font(Theme.headlineFont)
                        .foregroundStyle(Theme.textPrimary)
                    Text("Multiple reminders, all categories, and more")
                        .font(Theme.captionFont)
                        .foregroundStyle(Theme.textSecondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(Theme.teal)
            }
            .padding(Theme.paddingLarge)
            .background(
                LinearGradient(
                    colors: [Theme.tealLight, Theme.cream],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.cornerRadius)
                    .stroke(Theme.teal.opacity(0.2), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

struct LockedFeatureLabel: View {
    let text: String

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "lock.fill")
                .font(.system(size: 10))
            Text(text)
                .font(.system(size: 12, weight: .medium))
        }
        .foregroundStyle(Theme.teal)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Theme.tealLight)
        .clipShape(Capsule())
    }
}
