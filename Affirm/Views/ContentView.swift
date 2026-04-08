import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var profiles: [UserProfile]

    @Bindable var affirmationService: AffirmationService
    @Bindable var streakService: StreakService
    @Bindable var purchaseService: PurchaseService
    @Bindable var notificationService: NotificationService
    @Bindable var widgetSyncService: WidgetSyncService

    @State private var showOnboarding = false
    @State private var deepLinkDestination: DeepLinkDestination?

    var body: some View {
        Group {
            if showOnboarding {
                OnboardingView(notificationService: notificationService) {
                    withAnimation(.easeInOut(duration: 0.4)) {
                        showOnboarding = false
                    }
                    syncWidgetData()
                }
            } else {
                HomeView(
                    affirmationService: affirmationService,
                    streakService: streakService,
                    purchaseService: purchaseService,
                    widgetSyncService: widgetSyncService
                )
            }
        }
        .onAppear {
            showOnboarding = !(profiles.first?.hasCompletedOnboarding ?? false)
            streakService.refreshDailyStatus()

            if let profile = profiles.first {
                affirmationService.loadOrSelectDailyAffirmation(
                    categories: profile.selectedCategories
                )
            }
        }
        .onOpenURL { url in
            handleDeepLink(url)
        }
    }

    // MARK: - Deep Link

    private func handleDeepLink(_ url: URL) {
        guard url.scheme == AppConstants.urlScheme else { return }

        switch url.host {
        case "today":
            deepLinkDestination = .today
        case "settings":
            deepLinkDestination = .settings
        case "paywall":
            deepLinkDestination = .paywall
        default:
            break
        }
    }

    private func syncWidgetData() {
        widgetSyncService.syncAll(
            firstName: profiles.first?.firstName ?? "",
            affirmationText: affirmationService.todayAffirmation.text,
            currentStreak: streakService.currentStreak,
            isPremium: purchaseService.isPremium
        )
    }
}

enum DeepLinkDestination {
    case today
    case settings
    case paywall
}
