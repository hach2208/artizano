import SwiftUI

struct AffirmationCard: View {
    let affirmation: Affirmation
    let isFavorite: Bool
    let onFavorite: () -> Void
    let onShare: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.paddingMedium) {
            HStack {
                Label(affirmation.category.rawValue, systemImage: affirmation.category.icon)
                    .font(Theme.captionFont)
                    .foregroundStyle(Theme.teal)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Theme.tealLight)
                    .clipShape(Capsule())

                Spacer()
            }

            Text(affirmation.text)
                .font(Theme.affirmationFont)
                .foregroundStyle(Theme.textPrimary)
                .lineSpacing(6)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.vertical, Theme.paddingSmall)

            HStack(spacing: Theme.paddingMedium) {
                Spacer()

                Button(action: onFavorite) {
                    Image(systemName: isFavorite ? "heart.fill" : "heart")
                        .font(.title3)
                        .foregroundStyle(isFavorite ? .red.opacity(0.8) : Theme.textTertiary)
                }

                Button(action: onShare) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.title3)
                        .foregroundStyle(Theme.textTertiary)
                }
            }
        }
        .padding(Theme.paddingLarge)
        .cardStyle()
    }
}

// MARK: - Mini Card for Library

struct AffirmationMiniCard: View {
    let affirmation: Affirmation
    let isFavorite: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(affirmation.text)
                .font(.system(size: 15, weight: .medium, design: .serif))
                .foregroundStyle(Theme.textPrimary)
                .lineSpacing(4)
                .lineLimit(4)

            HStack {
                Label(affirmation.category.rawValue, systemImage: affirmation.category.icon)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Theme.teal)

                Spacer()

                if isFavorite {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(.red.opacity(0.7))
                }
            }
        }
        .padding(Theme.paddingMedium)
        .cardStyle()
    }
}
