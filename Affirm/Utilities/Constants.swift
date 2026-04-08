import Foundation

enum AppConstants {
    static let appGroupIdentifier = "group.com.yourcompany.affirm"
    static let yearlyProductId = "affirm_premium_yearly"
    static let lifetimeProductId = "affirm_lifetime"
    static let productIds: Set<String> = [yearlyProductId, lifetimeProductId]
    static let appName = "Affirm."
    static let urlScheme = "affirm"

    enum DeepLink {
        static let today = "affirm://today"
        static let settings = "affirm://settings"
        static let paywall = "affirm://paywall"
    }

    enum SharedDefaults {
        static let firstName = "shared_first_name"
        static let todayAffirmation = "shared_today_affirmation"
        static let currentStreak = "shared_current_streak"
        static let isPremium = "shared_is_premium"
        static let todayAffirmationDate = "shared_today_affirmation_date"
    }

    static let maxFreeReminders = 1
}
