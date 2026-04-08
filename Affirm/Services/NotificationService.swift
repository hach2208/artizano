import Foundation
import UserNotifications

@Observable
final class NotificationService {
    private(set) var isAuthorized: Bool = false

    private let center = UNUserNotificationCenter.current()

    init() {
        Task { await checkAuthorizationStatus() }
    }

    // MARK: - Authorization

    @MainActor
    func requestAuthorization() async -> Bool {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            isAuthorized = granted
            return granted
        } catch {
            return false
        }
    }

    @MainActor
    func checkAuthorizationStatus() async {
        let settings = await center.notificationSettings()
        isAuthorized = settings.authorizationStatus == .authorized
    }

    // MARK: - Scheduling

    func scheduleReminders(
        hours: [Int],
        firstName: String,
        isPremium: Bool,
        soundEnabled: Bool
    ) async {
        center.removeAllPendingNotificationRequests()

        let effectiveHours: [Int]
        if isPremium {
            effectiveHours = hours
        } else {
            effectiveHours = Array(hours.prefix(AppConstants.maxFreeReminders))
        }

        let affirmations = AffirmationsData.all

        for hour in effectiveHours {
            for dayOffset in 0..<7 {
                guard let affirmation = affirmations.randomElement() else { continue }

                let content = UNMutableNotificationContent()
                let greeting = firstName.isEmpty ? "Your" : "\(firstName), your"
                content.title = "Affirm."
                content.body = "\(greeting) reminder: \(affirmation.text)"
                content.sound = soundEnabled ? .default : nil
                content.userInfo = ["deepLink": AppConstants.DeepLink.today]

                var dateComponents = DateComponents()
                dateComponents.hour = hour
                dateComponents.minute = 0

                if let date = Calendar.current.date(byAdding: .day, value: dayOffset, to: .now) {
                    let dayComponents = Calendar.current.dateComponents([.year, .month, .day], from: date)
                    dateComponents.year = dayComponents.year
                    dateComponents.month = dayComponents.month
                    dateComponents.day = dayComponents.day
                }

                let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: false)
                let request = UNNotificationRequest(
                    identifier: "affirm_\(hour)_\(dayOffset)",
                    content: content,
                    trigger: trigger
                )

                try? await center.add(request)
            }
        }
    }

    func cancelAllNotifications() {
        center.removeAllPendingNotificationRequests()
    }
}
