import Foundation

enum StudioBrand {
    static let name = "Foundry"
    static let tag = "Micro apps, made to fit."
    static let summary = "Build small apps."
}

struct UserSession {
    var isAuthenticated: Bool
    var profile: UserProfile
    var accessToken: String?

    static let preview = UserSession(
        isAuthenticated: false,
        profile: UserProfile(
            name: "Shivam",
            email: "shivam@example.com",
            role: "Owner",
            organizationCount: 2
        ),
        accessToken: nil
    )
}

struct UserProfile {
    let name: String
    let email: String
    let role: String
    let organizationCount: Int
}

enum AppVisibility: String, CaseIterable, Identifiable {
    case privateApp = "Private"
    case publicApp = "Public"
    case orgApp = "Org"

    var id: String { rawValue }

    var description: String {
        switch self {
        case .privateApp: "Only you can open it."
        case .publicApp: "Listed in the public store."
        case .orgApp: "Shared inside one workspace."
        }
    }
}

enum BuildAudience: String, CaseIterable, Identifiable {
    case personal = "Personal"
    case consumers = "Consumer"
    case operations = "Ops"
    case team = "Team"

    var id: String { rawValue }
}

enum GenerationMode: String, CaseIterable, Identifiable {
    case sharedRuntime = "Instant"
    case advancedCodegen = "Advanced"

    var id: String { rawValue }
}

enum AppStatus: String {
    case building = "Building"
    case ready = "Ready"
    case reviewing = "In Review"
    case failed = "Needs Fix"

    var badgeText: String { rawValue }
}

enum AppCategory: String, CaseIterable, Identifiable {
    case planner = "Planner"
    case finance = "Finance"
    case event = "Event"
    case dashboard = "Dashboard"
    case operations = "Operations"
    case custom = "Custom"

    var id: String { rawValue }

    var defaultTagline: String {
        switch self {
        case .planner: "A compact planner with one clear job."
        case .finance: "A quiet financial tool with useful defaults."
        case .event: "A small event app built for the day that matters."
        case .dashboard: "A focused view of the numbers worth checking."
        case .operations: "A lightweight operations tool with simple rules."
        case .custom: "A custom app shaped around your exact prompt."
        }
    }

    func suggestedName(from prompt: String) -> String {
        let tokens = prompt
            .split(whereSeparator: { $0 == " " || $0 == "," || $0 == "." })
            .prefix(2)
            .map { $0.capitalized }
        return tokens.isEmpty ? "New App" : tokens.joined(separator: " ")
    }
}

struct AppMetrics {
    let runs: Int
    let favorites: Int
    let forks: Int
}

struct AppUpdate: Identifiable {
    let id = UUID()
    let title: String
    let message: String
    let timestamp: Date
}

struct MicroApp: Identifiable {
    let id: UUID
    let name: String
    let tagline: String
    let summary: String
    let storeNote: String
    let samplePrompt: String
    let category: AppCategory
    let visibility: AppVisibility
    let audience: BuildAudience
    let status: AppStatus
    let completion: Double
    let deploymentURL: URL?
    let lastEdited: Date
    let metrics: AppMetrics
    let updates: [AppUpdate]
}

struct WorkspaceOrganization: Identifiable {
    let id: UUID
    let name: String
    let seatCount: Int
    let domain: String
    let apps: [MicroApp]
}

struct GenerationPromptPackage {
    let systemPrompt: String
    let userPrompt: String
    let visibility: AppVisibility
    let audience: BuildAudience
    let category: AppCategory
    let mode: GenerationMode
}

extension MicroApp {
    private static func hostedAppURL(_ slug: String) -> URL? {
        URL(string: "https://pocket-founder.vercel.app/micro-apps/\(slug)")
    }

    static let spendHours = MicroApp(
        id: UUID(),
        name: "Spend Hours",
        tagline: "See what a purchase costs in working hours.",
        summary: "Turn any item into hours of work, compare impulse buys against planned spending, and keep a calmer view of what something really costs.",
        storeNote: "A strong public utility because the concept is universal and easy to understand in seconds.",
        samplePrompt: "Make me a small app that shows how many work hours I need for any purchase before I spend.",
        category: .finance,
        visibility: .publicApp,
        audience: .consumers,
        status: .ready,
        completion: 1,
        deploymentURL: hostedAppURL("spend-hours"),
        lastEdited: .now.addingTimeInterval(-4200),
        metrics: .init(runs: 942, favorites: 312, forks: 74),
        updates: [
            AppUpdate(title: "Wage presets", message: "Supports hourly, monthly, and freelance income inputs.", timestamp: .now.addingTimeInterval(-9200))
        ]
    )

    static let guestDesk = MicroApp(
        id: UUID(),
        name: "Guest Desk",
        tagline: "A simple arrival board for small events.",
        summary: "Check guests in, mark VIP notes, track capacity, and keep one calm screen for the people at the door.",
        storeNote: "A useful public template for campus events, pop-ups, launches, and private gatherings.",
        samplePrompt: "Build a tiny event check-in app with guest status, VIP notes, and a live capacity count.",
        category: .event,
        visibility: .publicApp,
        audience: .operations,
        status: .ready,
        completion: 1,
        deploymentURL: hostedAppURL("guest-desk"),
        lastEdited: .now.addingTimeInterval(-12800),
        metrics: .init(runs: 508, favorites: 196, forks: 43),
        updates: [
            AppUpdate(title: "Offline list cache", message: "Guest names stay searchable even when the signal gets poor.", timestamp: .now.addingTimeInterval(-14400))
        ]
    )

    static let renewalRadar = MicroApp(
        id: UUID(),
        name: "Renewal Radar",
        tagline: "Track renewals, owners, and stop-or-keep calls.",
        summary: "A shared operations app for software renewals with owners, renewal dates, usage notes, and a clear keep or cancel decision.",
        storeNote: "Best used as an organization app where finance and ops need the same source of truth.",
        samplePrompt: "Create a renewal tracker for our team with owners, decision dates, and a keep or cancel note.",
        category: .operations,
        visibility: .orgApp,
        audience: .team,
        status: .reviewing,
        completion: 0.84,
        deploymentURL: hostedAppURL("renewal-radar"),
        lastEdited: .now.addingTimeInterval(-6200),
        metrics: .init(runs: 68, favorites: 21, forks: 6),
        updates: [
            AppUpdate(title: "Workspace review", message: "Waiting for one final pass before it is shared across the org.", timestamp: .now.addingTimeInterval(-2100))
        ]
    )

    static let briefDeck = MicroApp(
        id: UUID(),
        name: "Brief Deck",
        tagline: "One quiet screen for the day ahead.",
        summary: "Capture today’s priorities, blockers, key timings, and decisions for a small team, event crew, or project room.",
        storeNote: "A good private default because each team’s brief is personal but the format stays broadly useful.",
        samplePrompt: "Make a daily brief app with priorities, blockers, schedule, and decision log for a small team.",
        category: .planner,
        visibility: .privateApp,
        audience: .personal,
        status: .building,
        completion: 0.41,
        deploymentURL: hostedAppURL("brief-deck"),
        lastEdited: .now.addingTimeInterval(-3400),
        metrics: .init(runs: 14, favorites: 4, forks: 1),
        updates: [
            AppUpdate(title: "Layout draft ready", message: "The first version has the core cards, note model, and quick capture flow.", timestamp: .now.addingTimeInterval(-1600))
        ]
    )

    static let polaroidPrint = MicroApp(
        id: UUID(),
        name: "Polaroid Print",
        tagline: "Shoot once. Export clean polaroids.",
        summary: "Take or upload a photo, wrap it in instant-film layouts, and prepare A4 or A3 print sheets with clear size specs.",
        storeNote: "A strong public utility for creators, events, and quick on-site prints.",
        samplePrompt: "Make an app that takes pictures and outputs polaroids in different sizes with A4 and A3 print sheets.",
        category: .custom,
        visibility: .publicApp,
        audience: .consumers,
        status: .ready,
        completion: 1,
        deploymentURL: hostedAppURL("polaroid-print"),
        lastEdited: .now.addingTimeInterval(-5100),
        metrics: .init(runs: 287, favorites: 119, forks: 32),
        updates: [
            AppUpdate(title: "Sheet layouts added", message: "A4 and A3 layouts now show print counts before export.", timestamp: .now.addingTimeInterval(-2600))
        ]
    )

    static let sampleData: [MicroApp] = [
        spendHours,
        guestDesk,
        renewalRadar,
        briefDeck,
        polaroidPrint
    ]

    static let publicShowcase: [MicroApp] = sampleData.filter { $0.visibility == .publicApp }

    static func template(named name: String) -> MicroApp? {
        sampleData.first { $0.name.caseInsensitiveCompare(name) == .orderedSame }
    }
}

extension WorkspaceOrganization {
    static let sampleData: [WorkspaceOrganization] = [
        WorkspaceOrganization(
            id: UUID(),
            name: "Northstar Events",
            seatCount: 18,
            domain: "northstar.events",
            apps: [MicroApp.guestDesk]
        ),
        WorkspaceOrganization(
            id: UUID(),
            name: "Atlas Ops",
            seatCount: 26,
            domain: "atlasops.io",
            apps: [MicroApp.renewalRadar]
        )
    ]

    static func using(_ apps: [MicroApp]) -> [WorkspaceOrganization] {
        sampleData.map { organization in
            let resolvedApps = organization.apps.compactMap { sample in
                apps.first { $0.name == sample.name } ?? sample
            }

            return WorkspaceOrganization(
                id: organization.id,
                name: organization.name,
                seatCount: organization.seatCount,
                domain: organization.domain,
                apps: resolvedApps
            )
        }
    }
}

extension AppCategory {
    init(apiValue: String) {
        switch apiValue.lowercased() {
        case "planner": self = .planner
        case "finance": self = .finance
        case "event": self = .event
        case "dashboard": self = .dashboard
        case "operations": self = .operations
        default: self = .custom
        }
    }
}

extension AppVisibility {
    init(apiValue: String) {
        switch apiValue.lowercased() {
        case "public": self = .publicApp
        case "organization": self = .orgApp
        default: self = .privateApp
        }
    }

    var apiValue: String {
        switch self {
        case .privateApp: "private"
        case .publicApp: "public"
        case .orgApp: "organization"
        }
    }
}

extension BuildAudience {
    init(apiValue: String) {
        switch apiValue.lowercased() {
        case "consumer": self = .consumers
        case "ops", "operations": self = .operations
        case "team": self = .team
        default: self = .personal
        }
    }

    var apiValue: String {
        switch self {
        case .personal: "personal"
        case .consumers: "consumer"
        case .operations: "operations"
        case .team: "team"
        }
    }
}

extension GenerationMode {
    var apiValue: String {
        switch self {
        case .sharedRuntime: "instant"
        case .advancedCodegen: "advanced"
        }
    }
}

extension AppStatus {
    init(apiValue: String) {
        switch apiValue.lowercased() {
        case "ready": self = .ready
        case "reviewing": self = .reviewing
        case "failed": self = .failed
        default: self = .building
        }
    }

    var progressValue: Double {
        switch self {
        case .ready: 1
        case .reviewing: 0.84
        case .building: 0.34
        case .failed: 0.08
        }
    }
}
