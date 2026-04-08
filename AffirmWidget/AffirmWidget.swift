import WidgetKit
import SwiftUI

// MARK: - Timeline Provider

struct AffirmWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> AffirmWidgetEntry {
        AffirmWidgetEntry(
            date: .now,
            affirmation: "I trust the choices I make and the direction I'm heading.",
            streak: 5,
            firstName: ""
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (AffirmWidgetEntry) -> Void) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AffirmWidgetEntry>) -> Void) {
        let entry = loadEntry()
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: .now)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadEntry() -> AffirmWidgetEntry {
        let defaults = UserDefaults(suiteName: "group.com.yourcompany.affirm")
        let affirmation = defaults?.string(forKey: "shared_today_affirmation") ?? "Take a moment to breathe."
        let streak = defaults?.integer(forKey: "shared_current_streak") ?? 0
        let firstName = defaults?.string(forKey: "shared_first_name") ?? ""

        return AffirmWidgetEntry(
            date: .now,
            affirmation: affirmation,
            streak: streak,
            firstName: firstName
        )
    }
}

// MARK: - Entry

struct AffirmWidgetEntry: TimelineEntry {
    let date: Date
    let affirmation: String
    let streak: Int
    let firstName: String
}

// MARK: - Small Widget View

struct AffirmWidgetSmallView: View {
    let entry: AffirmWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Affirm.")
                    .font(.system(size: 14, weight: .bold, design: .serif))
                    .foregroundStyle(Color(red: 0.33, green: 0.60, blue: 0.58))

                Spacer()

                if entry.streak > 0 {
                    HStack(spacing: 2) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(Color(red: 0.85, green: 0.68, blue: 0.32))
                        Text("\(entry.streak)")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(red: 0.15, green: 0.15, blue: 0.15))
                    }
                }
            }

            Spacer()

            Text(entry.affirmation)
                .font(.system(size: 13, weight: .medium, design: .serif))
                .foregroundStyle(Color(red: 0.15, green: 0.15, blue: 0.15))
                .lineSpacing(3)
                .lineLimit(4)
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 0)
        }
        .padding(14)
        .widgetURL(URL(string: "affirm://today"))
    }
}

// MARK: - Medium Widget View

struct AffirmWidgetMediumView: View {
    let entry: AffirmWidgetEntry

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Affirm.")
                        .font(.system(size: 16, weight: .bold, design: .serif))
                        .foregroundStyle(Color(red: 0.33, green: 0.60, blue: 0.58))
                    Spacer()
                }

                Spacer()

                Text(entry.affirmation)
                    .font(.system(size: 15, weight: .medium, design: .serif))
                    .foregroundStyle(Color(red: 0.15, green: 0.15, blue: 0.15))
                    .lineSpacing(4)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)

                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            VStack(spacing: 8) {
                Spacer()

                VStack(spacing: 4) {
                    Text("\(entry.streak)")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(red: 0.85, green: 0.68, blue: 0.32))
                    Text("day streak")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(Color(red: 0.45, green: 0.43, blue: 0.40))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color(red: 0.85, green: 0.68, blue: 0.32).opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))

                Spacer()
            }
            .frame(width: 90)
        }
        .padding(16)
        .widgetURL(URL(string: "affirm://today"))
    }
}

// MARK: - Widget Configuration

struct AffirmWidget: Widget {
    let kind: String = "AffirmWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AffirmWidgetProvider()) { entry in
            AffirmWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    Color(red: 0.98, green: 0.96, blue: 0.93)
                }
        }
        .configurationDisplayName("Affirm.")
        .description("Your daily affirmation and streak at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct AffirmWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: AffirmWidgetEntry

    var body: some View {
        switch family {
        case .systemSmall:
            AffirmWidgetSmallView(entry: entry)
        case .systemMedium:
            AffirmWidgetMediumView(entry: entry)
        default:
            AffirmWidgetSmallView(entry: entry)
        }
    }
}

// MARK: - Preview

#Preview(as: .systemSmall) {
    AffirmWidget()
} timeline: {
    AffirmWidgetEntry(
        date: .now,
        affirmation: "I trust the choices I make and the direction I'm heading.",
        streak: 7,
        firstName: "Sarah"
    )
}

#Preview(as: .systemMedium) {
    AffirmWidget()
} timeline: {
    AffirmWidgetEntry(
        date: .now,
        affirmation: "I am capable of navigating whatever comes my way.",
        streak: 12,
        firstName: "Sarah"
    )
}
