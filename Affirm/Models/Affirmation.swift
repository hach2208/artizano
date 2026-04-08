import Foundation

struct Affirmation: Identifiable, Codable, Hashable {
    let id: String
    let text: String
    let category: AffirmationCategory

    init(id: String = UUID().uuidString, text: String, category: AffirmationCategory) {
        self.id = id
        self.text = text
        self.category = category
    }
}

enum AffirmationCategory: String, Codable, CaseIterable, Identifiable {
    case confidence = "Confidence"
    case calm = "Calm"
    case focus = "Focus"
    case selfWorth = "Self-Worth"
    case gratitude = "Gratitude"
    case energy = "Energy"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .confidence: return "star.fill"
        case .calm: return "leaf.fill"
        case .focus: return "target"
        case .selfWorth: return "heart.fill"
        case .gratitude: return "sun.max.fill"
        case .energy: return "bolt.fill"
        }
    }

    static var allNames: [String] {
        allCases.map(\.rawValue)
    }
}
