import Foundation
import StoreKit
import Observation

@Observable
final class PurchaseService {
    private(set) var products: [Product] = []
    private(set) var isPremium: Bool = false
    private(set) var isLoading: Bool = false
    private(set) var errorMessage: String?
    private(set) var yearlyProduct: Product?
    private(set) var lifetimeProduct: Product?
    private(set) var isTrialEligible: Bool = false

    private var transactionListener: Task<Void, Never>?

    init() {
        transactionListener = listenForTransactions()
        Task { await checkEntitlements() }
    }

    deinit {
        transactionListener?.cancel()
    }

    // MARK: - Load Products

    @MainActor
    func loadProducts() async {
        guard products.isEmpty else { return }
        isLoading = true
        errorMessage = nil

        do {
            let storeProducts = try await Product.products(for: AppConstants.productIds)
            products = storeProducts.sorted { $0.price < $1.price }
            yearlyProduct = storeProducts.first { $0.id == AppConstants.yearlyProductId }
            lifetimeProduct = storeProducts.first { $0.id == AppConstants.lifetimeProductId }

            if let yearly = yearlyProduct {
                isTrialEligible = await yearly.subscription?.isEligibleForIntroOffer ?? false
            }
        } catch {
            errorMessage = "Unable to load products. Please try again."
        }

        isLoading = false
    }

    // MARK: - Purchase

    @MainActor
    func purchase(_ product: Product) async -> Bool {
        isLoading = true
        errorMessage = nil

        do {
            let result = try await product.purchase()

            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                await transaction.finish()
                await checkEntitlements()
                isLoading = false
                return true

            case .userCancelled:
                isLoading = false
                return false

            case .pending:
                errorMessage = "Purchase is pending approval."
                isLoading = false
                return false

            @unknown default:
                isLoading = false
                return false
            }
        } catch {
            errorMessage = "Purchase failed. Please try again."
            isLoading = false
            return false
        }
    }

    // MARK: - Restore

    @MainActor
    func restorePurchases() async {
        isLoading = true
        errorMessage = nil

        do {
            try await AppStore.sync()
            await checkEntitlements()
        } catch {
            errorMessage = "Unable to restore purchases. Please try again."
        }

        isLoading = false
    }

    // MARK: - Entitlements

    @MainActor
    func checkEntitlements() async {
        var hasAccess = false

        for await result in Transaction.currentEntitlements {
            if let transaction = try? checkVerified(result) {
                if transaction.productID == AppConstants.yearlyProductId ||
                   transaction.productID == AppConstants.lifetimeProductId {
                    hasAccess = true
                }
            }
        }

        isPremium = hasAccess
        syncPremiumState()
    }

    // MARK: - Transaction Listener

    private func listenForTransactions() -> Task<Void, Never> {
        Task.detached { [weak self] in
            for await result in Transaction.updates {
                if let transaction = try? self?.checkVerified(result) {
                    await transaction.finish()
                    await self?.checkEntitlements()
                }
            }
        }
    }

    // MARK: - Verification

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let safe):
            return safe
        case .unverified:
            throw PurchaseError.verificationFailed
        }
    }

    // MARK: - Sync

    private func syncPremiumState() {
        let defaults = UserDefaults(suiteName: AppConstants.appGroupIdentifier)
        defaults?.set(isPremium, forKey: AppConstants.SharedDefaults.isPremium)
    }
}

enum PurchaseError: LocalizedError {
    case verificationFailed

    var errorDescription: String? {
        switch self {
        case .verificationFailed:
            return "Transaction verification failed."
        }
    }
}
