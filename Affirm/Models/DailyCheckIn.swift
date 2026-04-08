import Foundation
import SwiftData

@Model
final class DailyCheckIn {
    var date: Date
    var affirmationId: String
    var affirmationText: String

    init(date: Date = .now, affirmationId: String, affirmationText: String) {
        self.date = date
        self.affirmationId = affirmationId
        self.affirmationText = affirmationText
    }

    var calendarDate: DateComponents {
        Calendar.current.dateComponents([.year, .month, .day], from: date)
    }
}
