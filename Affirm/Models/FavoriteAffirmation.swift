import Foundation
import SwiftData

@Model
final class FavoriteAffirmation {
    var affirmationId: String
    var text: String
    var category: String
    var savedAt: Date

    init(affirmationId: String, text: String, category: String, savedAt: Date = .now) {
        self.affirmationId = affirmationId
        self.text = text
        self.category = category
        self.savedAt = savedAt
    }
}
