import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query private var profiles: [UserProfile]

    @Bindable var purchaseService: PurchaseService
    @Bindable var notificationService: NotificationService
    @Bindable var widgetSyncService: WidgetSyncService
    @Bindable var streakService: StreakService
    @Bindable var affirmationService: AffirmationService

    @State private var showPaywall = false
    @State private var firstName = ""
    @State private var selectedIntensity: ReminderIntensity = .balanced
    @State private var reminderHours: [Int] = [8]
    @State private var selectedCategories: Set<String> = Set(AffirmationCategory.allNames)
    @State private var soundEnabled = true

    var profile: UserProfile? { profiles.first }

    var body: some View {
        NavigationStack {
            List {
                premiumSection
                profileSection
                remindersSection
                categoriesSection
                soundSection
                widgetSection
                aboutSection
            }
            .scrollContentBackground(.hidden)
            .background(Theme.cream.ignoresSafeArea())
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        saveSettings()
                        dismiss()
                    }
                    .foregroundStyle(Theme.teal)
                    .fontWeight(.semibold)
                }
            }
            .onAppear(perform: loadSettings)
            .sheet(isPresented: $showPaywall) {
                PaywallView(purchaseService: purchaseService)
            }
        }
    }

    // MARK: - Premium

    private var premiumSection: some View {
        Section {
            if purchaseService.isPremium {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Affirm. Premium")
                            .font(Theme.headlineFont)
                            .foregroundStyle(Theme.textPrimary)
                        Text("You have full access")
                            .font(Theme.captionFont)
                            .foregroundStyle(Theme.teal)
                    }
                    Spacer()
                    PremiumBadge()
                }
            } else {
                Button(action: { showPaywall = true }) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Upgrade to Premium")
                                .font(Theme.headlineFont)
                                .foregroundStyle(Theme.textPrimary)
                            Text("Unlock all features")
                                .font(Theme.captionFont)
                                .foregroundStyle(Theme.textSecondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundStyle(Theme.teal)
                    }
                }

                Button(action: {
                    Task { await purchaseService.restorePurchases() }
                }) {
                    Text("Restore purchases")
                        .font(Theme.bodyFont)
                        .foregroundStyle(Theme.teal)
                }
            }
        }
    }

    // MARK: - Profile

    private var profileSection: some View {
        Section("Profile") {
            HStack {
                Text("First name")
                    .foregroundStyle(Theme.textPrimary)
                Spacer()
                TextField("Your name", text: $firstName)
                    .multilineTextAlignment(.trailing)
                    .foregroundStyle(Theme.textSecondary)
            }
        }
    }

    // MARK: - Reminders

    private var remindersSection: some View {
        Section {
            VStack(alignment: .leading, spacing: 12) {
                Text("Reminder frequency")
                    .font(Theme.bodyFont)
                    .foregroundStyle(Theme.textPrimary)

                ForEach(ReminderIntensity.allCases) { intensity in
                    let isLocked = intensity != .gentle && !purchaseService.isPremium

                    Button(action: {
                        if isLocked {
                            showPaywall = true
                        } else {
                            selectedIntensity = intensity
                            reminderHours = intensity.defaultHours
                        }
                    }) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(intensity.rawValue)
                                    .font(.system(size: 15, weight: .medium))
                                    .foregroundStyle(Theme.textPrimary)
                                Text(intensity.description)
                                    .font(Theme.captionFont)
                                    .foregroundStyle(Theme.textSecondary)
                            }

                            Spacer()

                            if isLocked {
                                LockedFeatureLabel(text: "Premium")
                            } else {
                                Image(systemName: selectedIntensity == intensity ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(selectedIntensity == intensity ? Theme.teal : Theme.textTertiary)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Reminder times")
                    .font(Theme.bodyFont)
                    .foregroundStyle(Theme.textPrimary)

                FlowLayout(spacing: 8) {
                    ForEach(reminderHours, id: \.self) { hour in
                        Text(formattedHour(hour))
                            .font(Theme.captionFont)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Theme.tealLight)
                            .foregroundStyle(Theme.teal)
                            .clipShape(Capsule())
                    }
                }
            }
        } header: {
            Text("Reminders")
        }
    }

    // MARK: - Categories

    private var categoriesSection: some View {
        Section("Categories") {
            ForEach(AffirmationCategory.allCases) { category in
                Button(action: { toggleCategory(category) }) {
                    HStack {
                        Image(systemName: category.icon)
                            .foregroundStyle(Theme.teal)
                            .frame(width: 24)
                        Text(category.rawValue)
                            .foregroundStyle(Theme.textPrimary)
                        Spacer()
                        Image(systemName: selectedCategories.contains(category.rawValue)
                              ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(selectedCategories.contains(category.rawValue)
                                             ? Theme.teal : Theme.textTertiary)
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Sound

    private var soundSection: some View {
        Section {
            Toggle(isOn: $soundEnabled) {
                Text("Notification sound")
                    .foregroundStyle(Theme.textPrimary)
            }
            .tint(Theme.teal)
        }
    }

    // MARK: - Widget

    private var widgetSection: some View {
        Section("Widget") {
            Button(action: refreshWidget) {
                HStack {
                    Text("Refresh widget")
                        .foregroundStyle(Theme.textPrimary)
                    Spacer()
                    Image(systemName: "arrow.clockwise")
                        .foregroundStyle(Theme.teal)
                }
            }
        }
    }

    // MARK: - About

    private var aboutSection: some View {
        Section {
            HStack {
                Text("Version")
                    .foregroundStyle(Theme.textPrimary)
                Spacer()
                Text("1.0.0")
                    .foregroundStyle(Theme.textSecondary)
            }

            Text("Affirm. is a local-first app. Your data stays on your device. We do not collect personal information.")
                .font(Theme.captionFont)
                .foregroundStyle(Theme.textTertiary)
        } header: {
            Text("About")
        }
    }

    // MARK: - Helpers

    private func loadSettings() {
        guard let profile else { return }
        firstName = profile.firstName
        selectedIntensity = profile.reminderIntensity
        reminderHours = profile.reminderHours
        selectedCategories = Set(profile.selectedCategories)
        soundEnabled = profile.soundEnabled
    }

    private func saveSettings() {
        guard let profile else { return }
        profile.firstName = firstName.trimmingCharacters(in: .whitespacesAndNewlines)
        profile.reminderIntensity = selectedIntensity
        profile.reminderHours = reminderHours
        profile.selectedCategories = Array(selectedCategories)
        profile.soundEnabled = soundEnabled

        affirmationService.loadOrSelectDailyAffirmation(categories: Array(selectedCategories))

        Task {
            await notificationService.scheduleReminders(
                hours: reminderHours,
                firstName: profile.firstName,
                isPremium: purchaseService.isPremium,
                soundEnabled: soundEnabled
            )
        }

        refreshWidget()
    }

    private func toggleCategory(_ category: AffirmationCategory) {
        if selectedCategories.contains(category.rawValue) {
            if selectedCategories.count > 1 {
                selectedCategories.remove(category.rawValue)
            }
        } else {
            selectedCategories.insert(category.rawValue)
        }
    }

    private func refreshWidget() {
        widgetSyncService.syncAll(
            firstName: firstName,
            affirmationText: affirmationService.todayAffirmation.text,
            currentStreak: streakService.currentStreak,
            isPremium: purchaseService.isPremium
        )
    }

    private func formattedHour(_ hour: Int) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h a"
        let date = Calendar.current.date(from: DateComponents(hour: hour)) ?? .now
        return formatter.string(from: date)
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrange(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (positions: [CGPoint], size: CGSize) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var currentX: CGFloat = 0
        var currentY: CGFloat = 0
        var lineHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if currentX + size.width > maxWidth, currentX > 0 {
                currentX = 0
                currentY += lineHeight + spacing
                lineHeight = 0
            }
            positions.append(CGPoint(x: currentX, y: currentY))
            lineHeight = max(lineHeight, size.height)
            currentX += size.width + spacing
        }

        return (positions, CGSize(width: maxWidth, height: currentY + lineHeight))
    }
}
