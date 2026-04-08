import SwiftUI
import SwiftData

struct HomeView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var profiles: [UserProfile]
    @Query private var favorites: [FavoriteAffirmation]

    @Bindable var affirmationService: AffirmationService
    @Bindable var streakService: StreakService
    @Bindable var purchaseService: PurchaseService
    @Bindable var widgetSyncService: WidgetSyncService

    @State private var showPaywall = false
    @State private var showLibrary = false
    @State private var showSettings = false
    @State private var checkInAnimation = false
    @State private var showShareSheet = false

    var profile: UserProfile? { profiles.first }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.paddingLarge) {
                    headerSection
                    affirmationSection
                    streakSection

                    if !purchaseService.isPremium {
                        PremiumCTACard { showPaywall = true }
                    }

                    quickActionsSection
                }
                .padding(.horizontal, Theme.paddingLarge)
                .padding(.bottom, Theme.paddingXLarge)
            }
            .background(Theme.cream.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Text("Affirm.")
                        .font(.system(size: 22, weight: .bold, design: .serif))
                        .foregroundStyle(Theme.textPrimary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 12) {
                        if streakService.currentStreak > 0 {
                            StreakBadge(count: streakService.currentStreak)
                        }
                        Button(action: { showSettings = true }) {
                            Image(systemName: "gearshape")
                                .foregroundStyle(Theme.textSecondary)
                        }
                    }
                }
            }
            .sheet(isPresented: $showPaywall) {
                PaywallView(purchaseService: purchaseService)
            }
            .sheet(isPresented: $showLibrary) {
                AffirmationLibraryView(
                    affirmationService: affirmationService,
                    purchaseService: purchaseService
                )
            }
            .sheet(isPresented: $showSettings) {
                SettingsView(
                    purchaseService: purchaseService,
                    notificationService: NotificationService(),
                    widgetSyncService: widgetSyncService,
                    streakService: streakService,
                    affirmationService: affirmationService
                )
            }
            .sheet(isPresented: $showShareSheet) {
                ShareSheet(text: affirmationService.todayAffirmation.text)
            }
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let name = profile?.firstName, !name.isEmpty {
                Text("Hello, \(name)")
                    .font(Theme.titleFont)
                    .foregroundStyle(Theme.textPrimary)
            } else {
                Text("Good \(timeOfDayGreeting)")
                    .font(Theme.titleFont)
                    .foregroundStyle(Theme.textPrimary)
            }
            Text("Today's affirmation")
                .font(Theme.bodyFont)
                .foregroundStyle(Theme.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, Theme.paddingSmall)
    }

    // MARK: - Affirmation

    private var affirmationSection: some View {
        AffirmationCard(
            affirmation: affirmationService.todayAffirmation,
            isFavorite: isTodayFavorite,
            onFavorite: toggleFavorite,
            onShare: { showShareSheet = true }
        )
    }

    // MARK: - Streak

    private var streakSection: some View {
        StreakCard(
            currentStreak: streakService.currentStreak,
            bestStreak: streakService.bestStreak,
            hasCheckedInToday: streakService.hasCheckedInToday
        )
    }

    // MARK: - Quick Actions

    private var quickActionsSection: some View {
        VStack(spacing: 12) {
            if !streakService.hasCheckedInToday {
                Button(action: performCheckIn) {
                    HStack {
                        Image(systemName: "checkmark.circle")
                        Text("Done for today")
                    }
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Theme.teal)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .scaleEffect(checkInAnimation ? 1.03 : 1.0)
            } else {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Theme.teal)
                    Text("You've already checked in today")
                        .font(Theme.bodyFont)
                        .foregroundStyle(Theme.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Theme.tealLight)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }

            HStack(spacing: 12) {
                Button(action: { showLibrary = true }) {
                    quickActionButton(icon: "book", label: "Library")
                }

                Button(action: {
                    affirmationService.forceNewAffirmation(
                        categories: profile?.selectedCategories ?? AffirmationCategory.allNames
                    )
                    syncWidget()
                }) {
                    quickActionButton(icon: "arrow.clockwise", label: "New Quote")
                }
            }
        }
    }

    private func quickActionButton(icon: String, label: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
            Text(label)
        }
        .font(.system(size: 15, weight: .medium))
        .foregroundStyle(Theme.teal)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Theme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Theme.teal.opacity(0.2), lineWidth: 1)
        )
    }

    // MARK: - Actions

    private func performCheckIn() {
        let success = streakService.performCheckIn(
            modelContext: modelContext,
            affirmation: affirmationService.todayAffirmation
        )
        if success {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                checkInAnimation = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation { checkInAnimation = false }
            }
            syncWidget()
        }
    }

    private func toggleFavorite() {
        let affirmation = affirmationService.todayAffirmation
        if let existing = favorites.first(where: { $0.affirmationId == affirmation.id }) {
            modelContext.delete(existing)
        } else {
            let fav = FavoriteAffirmation(
                affirmationId: affirmation.id,
                text: affirmation.text,
                category: affirmation.category.rawValue
            )
            modelContext.insert(fav)
        }
    }

    private func syncWidget() {
        widgetSyncService.syncAll(
            firstName: profile?.firstName ?? "",
            affirmationText: affirmationService.todayAffirmation.text,
            currentStreak: streakService.currentStreak,
            isPremium: purchaseService.isPremium
        )
    }

    // MARK: - Helpers

    private var isTodayFavorite: Bool {
        favorites.contains { $0.affirmationId == affirmationService.todayAffirmation.id }
    }

    private var timeOfDayGreeting: String {
        let hour = Calendar.current.component(.hour, from: .now)
        switch hour {
        case 5..<12: return "morning"
        case 12..<17: return "afternoon"
        default: return "evening"
        }
    }
}

// MARK: - Share Sheet

struct ShareSheet: UIViewControllerRepresentable {
    let text: String

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let items: [Any] = ["\"\(text)\" — Affirm."]
        return UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
