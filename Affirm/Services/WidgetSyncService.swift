import Foundation
import WidgetKit
import Observation

@Observable
final class WidgetSyncService {

    func syncAll(
        firstName: String,
        affirmationText: String,
        currentStreak: Int,
        isPremium: Bool
    ) {
        let defaults = UserDefaults(suiteName: AppConstants.appGroupIdentifier)
        defaults?.set(firstName, forKey: AppConstants.SharedDefaults.firstName)
        defaults?.set(affirmationText, forKey: AppConstants.SharedDefaults.todayAffirmation)
        defaults?.set(currentStreak, forKey: AppConstants.SharedDefaults.currentStreak)
        defaults?.set(isPremium, forKey: AppConstants.SharedDefaults.isPremium)
        defaults?.set(Date.now.timeIntervalSince1970, forKey: AppConstants.SharedDefaults.todayAffirmationDate)
        refreshWidgets()
    }

    func refreshWidgets() {
        WidgetCenter.shared.reloadAllTimelines()
    }
}
