import SwiftUI

extension Date {
    var startOfDay: Date {
        Calendar.current.startOfDay(for: self)
    }

    var isToday: Bool {
        Calendar.current.isDateInToday(self)
    }

    var isYesterday: Bool {
        Calendar.current.isDateInYesterday(self)
    }

    func isSameDay(as other: Date) -> Bool {
        Calendar.current.isDate(self, inSameDayAs: other)
    }
}

extension View {
    func premiumOverlay(isPremium: Bool) -> some View {
        self.overlay {
            if !isPremium {
                RoundedRectangle(cornerRadius: Theme.cornerRadius)
                    .fill(.ultraThinMaterial)
                    .overlay {
                        VStack(spacing: 8) {
                            Image(systemName: "lock.fill")
                                .font(.title2)
                                .foregroundStyle(Theme.teal)
                            Text("Premium")
                                .font(Theme.captionFont)
                                .foregroundStyle(Theme.textSecondary)
                        }
                    }
            }
        }
    }
}

struct ShakeEffect: GeometryEffect {
    var amount: CGFloat = 6
    var shakesPerUnit = 3
    var animatableData: CGFloat

    func effectValue(size: CGSize) -> ProjectionTransform {
        ProjectionTransform(
            CGAffineTransform(translationX: amount * sin(animatableData * .pi * CGFloat(shakesPerUnit)), y: 0)
        )
    }
}
