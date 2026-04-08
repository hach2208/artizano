import SwiftUI
import SwiftData

struct AffirmationLibraryView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query private var favorites: [FavoriteAffirmation]

    @Bindable var affirmationService: AffirmationService
    @Bindable var purchaseService: PurchaseService

    @State private var selectedCategory: AffirmationCategory?
    @State private var showFavoritesOnly = false
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.paddingMedium) {
                    filterBar
                    affirmationsList
                }
                .padding(.horizontal, Theme.paddingLarge)
                .padding(.bottom, Theme.paddingXLarge)
            }
            .background(Theme.cream.ignoresSafeArea())
            .navigationTitle("Library")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Theme.teal)
                        .fontWeight(.semibold)
                }
            }
            .searchable(text: $searchText, prompt: "Search affirmations")
        }
    }

    // MARK: - Filters

    private var filterBar: some View {
        VStack(spacing: 12) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    filterChip(label: "All", isSelected: selectedCategory == nil) {
                        selectedCategory = nil
                    }

                    ForEach(AffirmationCategory.allCases) { category in
                        filterChip(
                            label: category.rawValue,
                            icon: category.icon,
                            isSelected: selectedCategory == category
                        ) {
                            selectedCategory = category
                        }
                    }
                }
            }

            HStack {
                Button(action: { showFavoritesOnly.toggle() }) {
                    HStack(spacing: 4) {
                        Image(systemName: showFavoritesOnly ? "heart.fill" : "heart")
                            .font(.system(size: 13))
                        Text("Favorites")
                            .font(Theme.captionFont)
                    }
                    .foregroundStyle(showFavoritesOnly ? Theme.teal : Theme.textTertiary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(showFavoritesOnly ? Theme.tealLight : Theme.cardBackground)
                    .clipShape(Capsule())
                    .overlay(
                        Capsule().stroke(
                            showFavoritesOnly ? Theme.teal.opacity(0.3) : Theme.divider,
                            lineWidth: 1
                        )
                    )
                }

                Spacer()

                Text("\(filteredAffirmations.count) affirmations")
                    .font(Theme.captionFont)
                    .foregroundStyle(Theme.textTertiary)
            }
        }
    }

    private func filterChip(label: String, icon: String? = nil, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let icon {
                    Image(systemName: icon)
                        .font(.system(size: 11))
                }
                Text(label)
                    .font(.system(size: 13, weight: .medium))
            }
            .foregroundStyle(isSelected ? .white : Theme.textSecondary)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(isSelected ? Theme.teal : Theme.cardBackground)
            .clipShape(Capsule())
            .overlay(
                Capsule().stroke(isSelected ? Color.clear : Theme.divider, lineWidth: 1)
            )
        }
    }

    // MARK: - List

    private var affirmationsList: some View {
        LazyVStack(spacing: 10) {
            ForEach(filteredAffirmations) { affirmation in
                AffirmationMiniCard(
                    affirmation: affirmation,
                    isFavorite: isFavorite(affirmation)
                )
                .onTapGesture {
                    toggleFavorite(affirmation)
                }
            }
        }
    }

    // MARK: - Data

    private var filteredAffirmations: [Affirmation] {
        var result = affirmationService.allAffirmations

        if let category = selectedCategory {
            result = result.filter { $0.category == category }
        }

        if showFavoritesOnly {
            let favoriteIds = Set(favorites.map(\.affirmationId))
            result = result.filter { favoriteIds.contains($0.id) }
        }

        if !searchText.isEmpty {
            result = result.filter {
                $0.text.localizedCaseInsensitiveContains(searchText)
            }
        }

        return result
    }

    private func isFavorite(_ affirmation: Affirmation) -> Bool {
        favorites.contains { $0.affirmationId == affirmation.id }
    }

    private func toggleFavorite(_ affirmation: Affirmation) {
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
}
