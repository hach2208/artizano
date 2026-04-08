import Foundation

enum AffirmationsData {
    static let all: [Affirmation] = confidence + calm + focus + selfWorth + gratitude + energy

    // MARK: - Confidence
    static let confidence: [Affirmation] = [
        Affirmation(id: "conf_01", text: "I trust the choices I make and the direction I'm heading.", category: .confidence),
        Affirmation(id: "conf_02", text: "My voice matters and I use it with intention.", category: .confidence),
        Affirmation(id: "conf_03", text: "I am capable of navigating whatever comes my way.", category: .confidence),
        Affirmation(id: "conf_04", text: "I don't need permission to take up space.", category: .confidence),
        Affirmation(id: "conf_05", text: "I carry myself with quiet strength and self-assurance.", category: .confidence),
        Affirmation(id: "conf_06", text: "My past does not define the limits of my future.", category: .confidence),
        Affirmation(id: "conf_07", text: "I am learning to back myself, even in uncertainty.", category: .confidence),
        Affirmation(id: "conf_08", text: "I welcome new challenges as opportunities to grow.", category: .confidence),
        Affirmation(id: "conf_09", text: "I release the need for external validation.", category: .confidence),
        Affirmation(id: "conf_10", text: "I have everything I need to begin right where I am.", category: .confidence),
        Affirmation(id: "conf_11", text: "My confidence grows each time I follow through.", category: .confidence),
    ]

    // MARK: - Calm
    static let calm: [Affirmation] = [
        Affirmation(id: "calm_01", text: "I give myself permission to slow down.", category: .calm),
        Affirmation(id: "calm_02", text: "Peace is not something I find — it's something I create.", category: .calm),
        Affirmation(id: "calm_03", text: "I release what I cannot control and focus on what I can.", category: .calm),
        Affirmation(id: "calm_04", text: "My breath is my anchor. I return to it often.", category: .calm),
        Affirmation(id: "calm_05", text: "I am allowed to rest without earning it.", category: .calm),
        Affirmation(id: "calm_06", text: "Stillness is not laziness — it is restoration.", category: .calm),
        Affirmation(id: "calm_07", text: "I choose ease over urgency wherever possible.", category: .calm),
        Affirmation(id: "calm_08", text: "Not everything requires my immediate reaction.", category: .calm),
        Affirmation(id: "calm_09", text: "I trust the timing of my life.", category: .calm),
        Affirmation(id: "calm_10", text: "I am safe in this moment, right here, right now.", category: .calm),
    ]

    // MARK: - Focus
    static let focus: [Affirmation] = [
        Affirmation(id: "foc_01", text: "I direct my attention with purpose and clarity.", category: .focus),
        Affirmation(id: "foc_02", text: "I am present in what I'm doing, not scattered across what I'm not.", category: .focus),
        Affirmation(id: "foc_03", text: "Small consistent steps lead to meaningful progress.", category: .focus),
        Affirmation(id: "foc_04", text: "I protect my time and energy for what truly matters.", category: .focus),
        Affirmation(id: "foc_05", text: "Distractions do not control me — I choose where I place my focus.", category: .focus),
        Affirmation(id: "foc_06", text: "I don't have to do everything today. I just have to do the next right thing.", category: .focus),
        Affirmation(id: "foc_07", text: "Clarity comes from action, not from overthinking.", category: .focus),
        Affirmation(id: "foc_08", text: "I am building something meaningful, one day at a time.", category: .focus),
        Affirmation(id: "foc_09", text: "I set boundaries that support my deepest work.", category: .focus),
        Affirmation(id: "foc_10", text: "My mind is sharp and my intentions are clear.", category: .focus),
    ]

    // MARK: - Self-Worth
    static let selfWorth: [Affirmation] = [
        Affirmation(id: "sw_01", text: "I am worthy of love and respect, starting with my own.", category: .selfWorth),
        Affirmation(id: "sw_02", text: "I do not shrink to make others comfortable.", category: .selfWorth),
        Affirmation(id: "sw_03", text: "My worth is inherent — it doesn't fluctuate with performance.", category: .selfWorth),
        Affirmation(id: "sw_04", text: "I honor my needs without guilt.", category: .selfWorth),
        Affirmation(id: "sw_05", text: "I deserve the same kindness I give to others.", category: .selfWorth),
        Affirmation(id: "sw_06", text: "Being myself is enough. It has always been enough.", category: .selfWorth),
        Affirmation(id: "sw_07", text: "I choose relationships that reflect my value.", category: .selfWorth),
        Affirmation(id: "sw_08", text: "I am not a project to be fixed. I am a person to be loved.", category: .selfWorth),
        Affirmation(id: "sw_09", text: "I stand behind my boundaries with grace and firmness.", category: .selfWorth),
        Affirmation(id: "sw_10", text: "I replace self-criticism with self-compassion, one thought at a time.", category: .selfWorth),
    ]

    // MARK: - Gratitude
    static let gratitude: [Affirmation] = [
        Affirmation(id: "grat_01", text: "I notice the good that already exists in my life.", category: .gratitude),
        Affirmation(id: "grat_02", text: "Gratitude shifts my perspective and opens new doors.", category: .gratitude),
        Affirmation(id: "grat_03", text: "I appreciate the small, quiet moments just as much as the big ones.", category: .gratitude),
        Affirmation(id: "grat_04", text: "My life is rich with things worth celebrating.", category: .gratitude),
        Affirmation(id: "grat_05", text: "I am thankful for the lessons, even the hard ones.", category: .gratitude),
        Affirmation(id: "grat_06", text: "I choose to see abundance rather than lack.", category: .gratitude),
        Affirmation(id: "grat_07", text: "Every day holds something to be grateful for.", category: .gratitude),
        Affirmation(id: "grat_08", text: "I let gratitude ground me when the world feels heavy.", category: .gratitude),
        Affirmation(id: "grat_09", text: "I am grateful for who I am becoming.", category: .gratitude),
        Affirmation(id: "grat_10", text: "I find joy in the ordinary.", category: .gratitude),
    ]

    // MARK: - Energy
    static let energy: [Affirmation] = [
        Affirmation(id: "ener_01", text: "I wake up with intention and move through the day with purpose.", category: .energy),
        Affirmation(id: "ener_02", text: "My energy is a resource I invest wisely.", category: .energy),
        Affirmation(id: "ener_03", text: "I am alive, awake, and ready for what today brings.", category: .energy),
        Affirmation(id: "ener_04", text: "I nourish my body so it can carry me forward.", category: .energy),
        Affirmation(id: "ener_05", text: "Momentum builds when I start — even imperfectly.", category: .energy),
        Affirmation(id: "ener_06", text: "I choose vitality over comfort when growth is calling.", category: .energy),
        Affirmation(id: "ener_07", text: "I let go of what drains me and lean into what lights me up.", category: .energy),
        Affirmation(id: "ener_08", text: "I am the kind of person who shows up, even on hard days.", category: .energy),
        Affirmation(id: "ener_09", text: "Rest and energy are not opposites — they fuel each other.", category: .energy),
        Affirmation(id: "ener_10", text: "I bring a steady, focused energy to everything I do.", category: .energy),
    ]
}
