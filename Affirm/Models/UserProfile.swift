import Foundation
import SwiftData

@Model
final class UserProfile {
    var firstName: String
    var reminderIntensity: ReminderIntensity
    var reminderHours: [Int]
    var selectedCategories: [String]
    var soundEnabled: Bool
    var hasCompletedOnboarding: Bool
    var createdAt: Date

    init(
        firstName: String = "",
        reminderIntensity: ReminderIntensity = .balanced,
        reminderHours: [Int] = [8],
        selectedCategories: [String] = AffirmationCategory.allNames,
        soundEnabled: Bool = true,
        hasCompletedOnboarding: Bool = false,
        createdAt: Date = .now
    ) {
        self.firstName = firstName
        self.reminderIntensity = reminderIntensity
        self.reminderHours = reminderHours
        self.selectedCategories = selectedCategories
        self.soundEnabled = soundEnabled
        self.hasCompletedOnboarding = hasCompletedOnboarding
        self.createdAt = createdAt
    }
}

enum ReminderIntensity: String, Codable, CaseIterable, Identifiable {
    case gentle = "Gentle"
    case balanced = "Balanced"
    case deepFocus = "Deep Focus"

    var id: String { rawValue }

    var dailyCount: Int {
        switch self {
        case .gentle: return 1
        case .balanced: return 3
        case .deepFocus: return 5
        }
    }

    var description: String {
        switch self {
        case .gentle: return "1 reminder per day"
        case .balanced: return "3 reminders per day"
        case .deepFocus: return "5 reminders per day"
        }
    }

    var defaultHours: [Int] {
        switch self {
        case .gentle: return [8]
        case .balanced: return [8, 13, 19]
        case .deepFocus: return [7, 10, 13, 16, 20]
        }
    }
}
