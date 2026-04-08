import SwiftUI
import SwiftData

@main
struct AffirmApp: App {
    @State private var affirmationService = AffirmationService()
    @State private var streakService = StreakService()
    @State private var purchaseService = PurchaseService()
    @State private var notificationService = NotificationService()
    @State private var widgetSyncService = WidgetSyncService()

    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            UserProfile.self,
            DailyCheckIn.self,
            FavoriteAffirmation.self,
        ])
        let modelConfiguration = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: false
        )
        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            ContentView(
                affirmationService: affirmationService,
                streakService: streakService,
                purchaseService: purchaseService,
                notificationService: notificationService,
                widgetSyncService: widgetSyncService
            )
        }
        .modelContainer(sharedModelContainer)
    }
}
