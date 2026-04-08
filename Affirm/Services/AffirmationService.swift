import Foundation
import Observation

@Observable
final class AffirmationService {
    private(set) var todayAffirmation: Affirmation
    private(set) var allAffirmations: [Affirmation] = AffirmationsData.all

    private let todayAffirmationKey = "today_affirmation_date"
    private let todayAffirmationIdKey = "today_affirmation_id"

    init() {
        todayAffirmation = AffirmationsData.all.first!
        loadOrSelectDailyAffirmation(categories: AffirmationCategory.allNames)
    }

    // MARK: - Daily Selection

    func loadOrSelectDailyAffirmation(categories: [String]) {
        let today = Date.now.startOfDay
        let defaults = UserDefaults.standard

        if let savedDate = defaults.object(forKey: todayAffirmationKey) as? Date,
           savedDate.isSameDay(as: today),
           let savedId = defaults.string(forKey: todayAffirmationIdKey),
           let saved = allAffirmations.first(where: { $0.id == savedId }) {
            todayAffirmation = saved
            syncToAppGroup()
            return
        }

        let filtered = filteredAffirmations(for: categories)
        let pool = filtered.isEmpty ? allAffirmations : filtered

        let seed = Calendar.current.dateComponents([.year, .month, .day], from: today)
        var rng = SeededRandomNumberGenerator(
            seed: UInt64(seed.year! * 10000 + seed.month! * 100 + seed.day!)
        )
        todayAffirmation = pool.randomElement(using: &rng) ?? allAffirmations.first!

        defaults.set(today, forKey: todayAffirmationKey)
        defaults.set(todayAffirmation.id, forKey: todayAffirmationIdKey)
        syncToAppGroup()
    }

    // MARK: - Filtering

    func filteredAffirmations(for categoryNames: [String]) -> [Affirmation] {
        allAffirmations.filter { categoryNames.contains($0.category.rawValue) }
    }

    func affirmations(for category: AffirmationCategory) -> [Affirmation] {
        allAffirmations.filter { $0.category == category }
    }

    // MARK: - Refresh

    func forceNewAffirmation(categories: [String]) {
        let filtered = filteredAffirmations(for: categories)
        let pool = filtered.isEmpty ? allAffirmations : filtered
        todayAffirmation = pool.randomElement() ?? allAffirmations.first!

        let defaults = UserDefaults.standard
        defaults.set(Date.now.startOfDay, forKey: todayAffirmationKey)
        defaults.set(todayAffirmation.id, forKey: todayAffirmationIdKey)
        syncToAppGroup()
    }

    // MARK: - App Group Sync

    private func syncToAppGroup() {
        let defaults = UserDefaults(suiteName: AppConstants.appGroupIdentifier)
        defaults?.set(todayAffirmation.text, forKey: AppConstants.SharedDefaults.todayAffirmation)
        defaults?.set(Date.now.timeIntervalSince1970, forKey: AppConstants.SharedDefaults.todayAffirmationDate)
    }
}

// MARK: - Seeded RNG

struct SeededRandomNumberGenerator: RandomNumberGenerator {
    private var state: UInt64

    init(seed: UInt64) {
        state = seed
    }

    mutating func next() -> UInt64 {
        state &+= 0x9e3779b97f4a7c15
        var z = state
        z = (z ^ (z >> 30)) &* 0xbf58476d1ce4e5b9
        z = (z ^ (z >> 27)) &* 0x94d049bb133111eb
        return z ^ (z >> 31)
    }
}
