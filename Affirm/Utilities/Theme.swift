import SwiftUI

enum Theme {
    // MARK: - Colors
    static let cream = Color(red: 0.98, green: 0.96, blue: 0.93)
    static let warmWhite = Color(red: 0.99, green: 0.98, blue: 0.96)
    static let teal = Color(red: 0.33, green: 0.60, blue: 0.58)
    static let tealLight = Color(red: 0.33, green: 0.60, blue: 0.58).opacity(0.12)
    static let tealDark = Color(red: 0.22, green: 0.45, blue: 0.43)
    static let textPrimary = Color(red: 0.15, green: 0.15, blue: 0.15)
    static let textSecondary = Color(red: 0.45, green: 0.43, blue: 0.40)
    static let textTertiary = Color(red: 0.65, green: 0.62, blue: 0.58)
    static let cardBackground = Color.white
    static let divider = Color(red: 0.90, green: 0.88, blue: 0.85)
    static let streakGold = Color(red: 0.85, green: 0.68, blue: 0.32)

    // MARK: - Typography
    static let displayFont: Font = .system(size: 32, weight: .bold, design: .serif)
    static let titleFont: Font = .system(size: 24, weight: .semibold, design: .default)
    static let headlineFont: Font = .system(size: 18, weight: .semibold, design: .default)
    static let bodyFont: Font = .system(size: 16, weight: .regular, design: .default)
    static let captionFont: Font = .system(size: 13, weight: .regular, design: .default)
    static let affirmationFont: Font = .system(size: 22, weight: .medium, design: .serif)

    // MARK: - Spacing
    static let paddingSmall: CGFloat = 8
    static let paddingMedium: CGFloat = 16
    static let paddingLarge: CGFloat = 24
    static let paddingXLarge: CGFloat = 32

    // MARK: - Corner Radius
    static let cornerRadius: CGFloat = 16
    static let cornerRadiusSmall: CGFloat = 10

    // MARK: - Card Style
    static func cardStyle() -> some ViewModifier {
        CardModifier()
    }
}

struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Theme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius))
            .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardModifier())
    }
}
