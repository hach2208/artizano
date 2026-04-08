import SwiftUI
import SwiftData

struct OnboardingView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var profiles: [UserProfile]
    @Bindable var notificationService: NotificationService

    @State private var currentPage = 0
    @State private var firstName = ""
    @State private var selectedIntensity: ReminderIntensity = .balanced

    var onComplete: () -> Void

    var body: some View {
        ZStack {
            Theme.cream.ignoresSafeArea()

            TabView(selection: $currentPage) {
                welcomePage.tag(0)
                namePage.tag(1)
                reminderPage.tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut(duration: 0.3), value: currentPage)
        }
    }

    // MARK: - Welcome

    private var welcomePage: some View {
        VStack(spacing: Theme.paddingXLarge) {
            Spacer()

            VStack(spacing: 12) {
                Text("Affirm.")
                    .font(.system(size: 44, weight: .bold, design: .serif))
                    .foregroundStyle(Theme.textPrimary)

                Text("Daily words that move you forward.")
                    .font(Theme.bodyFont)
                    .foregroundStyle(Theme.textSecondary)
            }

            Spacer()

            VStack(spacing: Theme.paddingMedium) {
                pageIndicator

                Button(action: { withAnimation { currentPage = 1 } }) {
                    Text("Get Started")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Theme.teal)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
            }
            .padding(.horizontal, Theme.paddingLarge)
            .padding(.bottom, Theme.paddingXLarge)
        }
    }

    // MARK: - Name

    private var namePage: some View {
        VStack(spacing: Theme.paddingXLarge) {
            Spacer()

            VStack(spacing: 12) {
                Text("What should we call you?")
                    .font(Theme.titleFont)
                    .foregroundStyle(Theme.textPrimary)

                Text("We'll personalize your reminders.")
                    .font(Theme.bodyFont)
                    .foregroundStyle(Theme.textSecondary)
            }

            TextField("First name", text: $firstName)
                .font(Theme.bodyFont)
                .padding()
                .background(Theme.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Theme.divider, lineWidth: 1)
                )
                .padding(.horizontal, Theme.paddingLarge)

            Spacer()

            VStack(spacing: Theme.paddingMedium) {
                pageIndicator

                Button(action: { withAnimation { currentPage = 2 } }) {
                    Text("Continue")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Theme.teal)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }

                Button("Skip") {
                    withAnimation { currentPage = 2 }
                }
                .font(Theme.captionFont)
                .foregroundStyle(Theme.textTertiary)
            }
            .padding(.horizontal, Theme.paddingLarge)
            .padding(.bottom, Theme.paddingXLarge)
        }
    }

    // MARK: - Reminders

    private var reminderPage: some View {
        VStack(spacing: Theme.paddingXLarge) {
            Spacer()

            VStack(spacing: 12) {
                Text("How often do you want reminders?")
                    .font(Theme.titleFont)
                    .foregroundStyle(Theme.textPrimary)
                    .multilineTextAlignment(.center)

                Text("You can always change this later.")
                    .font(Theme.bodyFont)
                    .foregroundStyle(Theme.textSecondary)
            }

            VStack(spacing: 12) {
                ForEach(ReminderIntensity.allCases) { intensity in
                    Button(action: { selectedIntensity = intensity }) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(intensity.rawValue)
                                    .font(Theme.headlineFont)
                                    .foregroundStyle(Theme.textPrimary)
                                Text(intensity.description)
                                    .font(Theme.captionFont)
                                    .foregroundStyle(Theme.textSecondary)
                            }

                            Spacer()

                            Image(systemName: selectedIntensity == intensity ? "checkmark.circle.fill" : "circle")
                                .font(.title3)
                                .foregroundStyle(selectedIntensity == intensity ? Theme.teal : Theme.textTertiary)
                        }
                        .padding(Theme.paddingMedium)
                        .background(selectedIntensity == intensity ? Theme.tealLight : Theme.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(
                                    selectedIntensity == intensity ? Theme.teal.opacity(0.3) : Theme.divider,
                                    lineWidth: 1
                                )
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, Theme.paddingLarge)

            Spacer()

            VStack(spacing: Theme.paddingMedium) {
                pageIndicator

                Button(action: completeOnboarding) {
                    Text("Start My Journey")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Theme.teal)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
            }
            .padding(.horizontal, Theme.paddingLarge)
            .padding(.bottom, Theme.paddingXLarge)
        }
    }

    // MARK: - Page Indicator

    private var pageIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<3, id: \.self) { index in
                Capsule()
                    .fill(index == currentPage ? Theme.teal : Theme.divider)
                    .frame(width: index == currentPage ? 24 : 8, height: 4)
            }
        }
    }

    // MARK: - Complete

    private func completeOnboarding() {
        let profile: UserProfile
        if let existing = profiles.first {
            profile = existing
        } else {
            profile = UserProfile()
            modelContext.insert(profile)
        }

        profile.firstName = firstName.trimmingCharacters(in: .whitespacesAndNewlines)
        profile.reminderIntensity = selectedIntensity
        profile.reminderHours = selectedIntensity.defaultHours
        profile.hasCompletedOnboarding = true

        let defaults = UserDefaults(suiteName: AppConstants.appGroupIdentifier)
        defaults?.set(profile.firstName, forKey: AppConstants.SharedDefaults.firstName)

        Task {
            let granted = await notificationService.requestAuthorization()
            if granted {
                await notificationService.scheduleReminders(
                    hours: profile.reminderHours,
                    firstName: profile.firstName,
                    isPremium: false,
                    soundEnabled: true
                )
            }
        }

        onComplete()
    }
}
