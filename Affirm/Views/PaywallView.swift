import SwiftUI
import StoreKit

struct PaywallView: View {
    @Environment(\.dismiss) private var dismiss
    @Bindable var purchaseService: PurchaseService

    @State private var selectedProduct: Product?
    @State private var isPurchasing = false
    @State private var showError = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.paddingXLarge) {
                    headerSection
                    benefitsSection
                    productsSection
                    legalSection
                }
                .padding(.horizontal, Theme.paddingLarge)
                .padding(.bottom, Theme.paddingXLarge)
            }
            .background(Theme.cream.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Theme.textSecondary)
                            .frame(width: 30, height: 30)
                            .background(Theme.cardBackground)
                            .clipShape(Circle())
                    }
                }
            }
            .task { await purchaseService.loadProducts() }
            .alert("Error", isPresented: $showError) {
                Button("OK") {}
            } message: {
                Text(purchaseService.errorMessage ?? "Something went wrong.")
            }
            .onChange(of: purchaseService.errorMessage) { _, newValue in
                if newValue != nil { showError = true }
            }
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 12) {
            Text("Affirm.")
                .font(.system(size: 36, weight: .bold, design: .serif))
                .foregroundStyle(Theme.textPrimary)
                .padding(.top, Theme.paddingLarge)

            Text("Premium")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Theme.teal)
                .tracking(2)

            Text("Unlock the full experience")
                .font(Theme.bodyFont)
                .foregroundStyle(Theme.textSecondary)
                .padding(.top, 4)
        }
    }

    // MARK: - Benefits

    private var benefitsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            benefitRow(icon: "bell.badge.fill", text: "Multiple daily reminders")
            benefitRow(icon: "square.grid.2x2.fill", text: "All affirmation categories")
            benefitRow(icon: "heart.fill", text: "Unlimited favorites")
            benefitRow(icon: "rectangle.3.group.fill", text: "Premium widget designs")
            benefitRow(icon: "flame.fill", text: "Streak insights & history")
            benefitRow(icon: "arrow.up.circle.fill", text: "All future updates included")
        }
        .padding(Theme.paddingLarge)
        .cardStyle()
    }

    private func benefitRow(icon: String, text: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(Theme.teal)
                .frame(width: 24)

            Text(text)
                .font(Theme.bodyFont)
                .foregroundStyle(Theme.textPrimary)

            Spacer()
        }
    }

    // MARK: - Products

    private var productsSection: some View {
        VStack(spacing: 12) {
            if purchaseService.isLoading && purchaseService.products.isEmpty {
                ProgressView()
                    .padding(Theme.paddingXLarge)
            } else {
                if let yearly = purchaseService.yearlyProduct {
                    yearlyProductCard(yearly)
                }

                if let lifetime = purchaseService.lifetimeProduct {
                    lifetimeProductCard(lifetime)
                }
            }

            Button(action: {
                Task { await purchaseService.restorePurchases() }
            }) {
                Text("Restore purchases")
                    .font(Theme.captionFont)
                    .foregroundStyle(Theme.textTertiary)
            }
            .padding(.top, 4)
        }
    }

    private func yearlyProductCard(_ product: Product) -> some View {
        Button(action: { purchaseProduct(product) }) {
            VStack(spacing: 8) {
                if purchaseService.isTrialEligible {
                    Text("Start your 3-day free trial")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                } else {
                    Text("Subscribe Yearly")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                }

                Text(trialSubtitle(for: product))
                    .font(Theme.captionFont)
                    .foregroundStyle(.white.opacity(0.8))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(Theme.teal)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .disabled(isPurchasing)
    }

    private func lifetimeProductCard(_ product: Product) -> some View {
        Button(action: { purchaseProduct(product) }) {
            VStack(spacing: 4) {
                Text("Unlock lifetime access")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Theme.teal)

                Text("One-time payment of \(product.displayPrice)")
                    .font(Theme.captionFont)
                    .foregroundStyle(Theme.textSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(Theme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Theme.teal.opacity(0.3), lineWidth: 1.5)
            )
        }
        .disabled(isPurchasing)
    }

    // MARK: - Legal

    private var legalSection: some View {
        VStack(spacing: 8) {
            Text("Payment will be charged to your Apple Account at confirmation of purchase. Subscription renews automatically unless canceled at least 24 hours before the end of the current period. Manage or cancel your subscription in App Store account settings.")
                .font(.system(size: 11))
                .foregroundStyle(Theme.textTertiary)
                .multilineTextAlignment(.center)

            HStack(spacing: 16) {
                Button("Terms of Use") {}
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Theme.textTertiary)

                Button("Privacy Policy") {}
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Theme.textTertiary)
            }
        }
        .padding(.top, Theme.paddingSmall)
    }

    // MARK: - Helpers

    private func purchaseProduct(_ product: Product) {
        isPurchasing = true
        Task {
            let success = await purchaseService.purchase(product)
            isPurchasing = false
            if success { dismiss() }
        }
    }

    private func trialSubtitle(for product: Product) -> String {
        if purchaseService.isTrialEligible {
            return "Then \(product.displayPrice)/year"
        }
        return "\(product.displayPrice)/year"
    }
}
