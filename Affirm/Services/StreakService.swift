import Foundation
import SwiftData
import Observation

@Observable
final class StreakService {
    private(set) var currentStreak: Int = 0
    private(set) var bestStreak: Int = 0
    private(set) var hasCheckedInToday: Bool = false
    private(set) var lastCheckInDate: Date?

    private let userDefaultsKey = "streak_data"

    init() {
        loadStreakData()
    }

    // MARK: - Check-In

    func performCheckIn(modelContext: ModelContext, affirmation: Affirmation) -> Bool {
        guard !hasCheckedInToday else { return false }

        let checkIn = DailyCheckIn(
            affirmationId: affirmation.id,
            affirmationText: affirmation.text
        )
        modelContext.insert(checkIn)

        updateStreak()
        syncToAppGroup()

        return true
    }

    // MARK: - Streak Calculation

    private func updateStreak() {
        let today = Date.now.startOfDay

        if let last = lastCheckInDate?.startOfDay {
            let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!.startOfDay
            if last.isSameDay(as: yesterday) {
                currentStreak += 1
            } else if !last.isSameDay(as: today) {
                currentStreak = 1
            }
        } else {
            currentStreak = 1
        }

        if currentStreak > bestStreak {
            bestStreak = currentStreak
        }

        hasCheckedInToday = true
        lastCheckInDate = today
        saveStreakData()
    }

    // MARK: - Daily Reset Check

    func refreshDailyStatus() {
        if let last = lastCheckInDate, !last.isToday {
            hasCheckedInToday = false
        }
        loadStreakData()
    }

    // MARK: - Persistence

    private func saveStreakData() {
        let data = StreakData(
            currentStreak: currentStreak,
            bestStreak: bestStreak,
            lastCheckInDate: lastCheckInDate
        )
        if let encoded = try? JSONEncoder().encode(data) {
            UserDefaults.standard.set(encoded, forKey: userDefaultsKey)
        }
    }

    private func loadStreakData() {
        guard let data = UserDefaults.standard.data(forKey: userDefaultsKey),
              let decoded = try? JSONDecoder().decode(StreakData.self, from: data) else {
            return
        }

        currentStreak = decoded.currentStreak
        bestStreak = decoded.bestStreak
        lastCheckInDate = decoded.lastCheckInDate

        if let last = lastCheckInDate {
            hasCheckedInToday = last.isToday

            if !last.isToday && !last.isYesterday {
                currentStreak = 0
                saveStreakData()
            }
        }
    }

    // MARK: - App Group Sync

    private func syncToAppGroup() {
        let defaults = UserDefaults(suiteName: AppConstants.appGroupIdentifier)
        defaults?.set(currentStreak, forKey: AppConstants.SharedDefaults.currentStreak)
    }
}

private struct StreakData: Codable {
    let currentStreak: Int
    let bestStreak: Int
    let lastCheckInDate: Date?
}
