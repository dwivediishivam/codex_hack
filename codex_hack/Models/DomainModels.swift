import Foundation

struct UserSession {
    var isAuthenticated: Bool
    var profile: UserProfile
    var accessToken: String?

    static let preview = UserSession(
        isAuthenticated: false,
        profile: UserProfile(
            name: "Shivam",
            email: "shivam@example.com",
            role: "Builder",
            organizationCount: 3
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
    case orgApp = "Organization"

    var id: String { rawValue }
    var description: String {
        switch self {
        case .privateApp: "Visible only to you."
        case .publicApp: "Discoverable in the app gallery."
        case .orgApp: "Shared inside an organization workspace."
        }
    }
}

enum BuildAudience: String, CaseIterable, Identifiable {
    case personal = "Personal"
    case consumers = "Consumers"
    case operations = "Operations"
    case team = "Team"

    var id: String { rawValue }
}

enum GenerationMode: String, CaseIterable, Identifiable {
    case sharedRuntime = "Instant Runtime"
    case advancedCodegen = "Advanced Codegen"

    var id: String { rawValue }
}

enum AppStatus: String {
    case building = "Building"
    case ready = "Ready"
    case reviewing = "Reviewing"
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
        case .planner: "A focused utility for routines, reminders, and personal planning."
        case .finance: "A compact financial assistant with clear numbers and actions."
        case .event: "A lightweight event companion with role-aware task flows."
        case .dashboard: "A visual control room for high-signal updates."
        case .operations: "An internal tool for workflows, approvals, and team actions."
        case .custom: "A bespoke micro app generated from your prompt."
        }
    }

    func suggestedName(from prompt: String) -> String {
        let tokens = prompt
            .split(whereSeparator: { $0 == " " || $0 == "," || $0 == "." })
            .prefix(3)
            .map { $0.capitalized }
        return tokens.isEmpty ? "New \(rawValue) App" : tokens.joined(separator: " ")
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
    static let sampleData: [MicroApp] = [
        MicroApp(
            id: UUID(),
            name: "Spend Hours",
            tagline: "Convert purchases into work-hours before you commit.",
            summary: "An app that calculates how many work hours are needed for a purchase, compares essential vs impulse spending, and keeps a running regret score.",
            category: .finance,
            visibility: .privateApp,
            audience: .personal,
            status: .ready,
            completion: 1,
            deploymentURL: URL(string: "https://example.vercel.app/spend-hours"),
            lastEdited: .now.addingTimeInterval(-7200),
            metrics: .init(runs: 124, favorites: 22, forks: 5),
            updates: [
                AppUpdate(title: "Added regret heatmap", message: "Weekly visual shows where discretionary purchases cluster.", timestamp: .now.addingTimeInterval(-3600)),
                AppUpdate(title: "Salary presets", message: "Supports hourly, monthly, and gig-based income models.", timestamp: .now.addingTimeInterval(-86000))
            ]
        ),
        MicroApp(
            id: UUID(),
            name: "Event Pulse",
            tagline: "Run event-day logistics with one clean command center.",
            summary: "Create roles, track task ownership, manage checklists, and share public event links with attendees.",
            category: .event,
            visibility: .orgApp,
            audience: .operations,
            status: .reviewing,
            completion: 0.74,
            deploymentURL: URL(string: "https://example.vercel.app/event-pulse"),
            lastEdited: .now.addingTimeInterval(-14400),
            metrics: .init(runs: 57, favorites: 14, forks: 2),
            updates: [
                AppUpdate(title: "Ops review waiting", message: "Push request sent to the org workspace reviewer queue.", timestamp: .now.addingTimeInterval(-1800))
            ]
        ),
        MicroApp(
            id: UUID(),
            name: "Renewal Radar",
            tagline: "Track software renewals and force a value check before spend.",
            summary: "A private app that lists renewals, estimated monthly value, owner, and a red-flag score for underused tools.",
            category: .operations,
            visibility: .privateApp,
            audience: .team,
            status: .building,
            completion: 0.42,
            deploymentURL: URL(string: "https://example.vercel.app/renewal-radar"),
            lastEdited: .now.addingTimeInterval(-5400),
            metrics: .init(runs: 9, favorites: 3, forks: 1),
            updates: [
                AppUpdate(title: "Data schema ready", message: "Codex generated renewal entities, owner mapping, and alert rules.", timestamp: .now.addingTimeInterval(-2600))
            ]
        )
    ]

    static let publicShowcase: [MicroApp] = [
        MicroApp(
            id: UUID(),
            name: "Trip Splitter",
            tagline: "A better shared-cost tracker for small groups.",
            summary: "Track contributions, reimbursements, and shared expenses with instant net settlement views.",
            category: .planner,
            visibility: .publicApp,
            audience: .consumers,
            status: .ready,
            completion: 1,
            deploymentURL: URL(string: "https://example.vercel.app/trip-splitter"),
            lastEdited: .now.addingTimeInterval(-120000),
            metrics: .init(runs: 812, favorites: 209, forks: 51),
            updates: []
        ),
        MicroApp(
            id: UUID(),
            name: "Campus Sprint",
            tagline: "Run student events with clear staffing and live status boards.",
            summary: "For college teams handling volunteers, sessions, venue checks, and day-of task management.",
            category: .event,
            visibility: .publicApp,
            audience: .operations,
            status: .ready,
            completion: 1,
            deploymentURL: URL(string: "https://example.vercel.app/campus-sprint"),
            lastEdited: .now.addingTimeInterval(-420000),
            metrics: .init(runs: 1240, favorites: 488, forks: 90),
            updates: []
        )
    ]
}

extension WorkspaceOrganization {
    static let sampleData: [WorkspaceOrganization] = [
        WorkspaceOrganization(
            id: UUID(),
            name: "Northstar Events",
            seatCount: 18,
            domain: "northstar.events",
            apps: Array(MicroApp.sampleData.prefix(2))
        ),
        WorkspaceOrganization(
            id: UUID(),
            name: "Tidal Ops",
            seatCount: 34,
            domain: "tidal.so",
            apps: [MicroApp.sampleData[2]]
        )
    ]
}
