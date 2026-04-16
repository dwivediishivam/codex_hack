import Combine
import Foundation
import SwiftUI

@MainActor
final class AppModel: ObservableObject {
    @Published var session = UserSession.preview
    @Published var authMode: AuthMode = .signIn
    @Published var authEmail = ""
    @Published var authPassword = ""
    @Published var authError: String?
    @Published var isAuthenticating = false
    @Published var selectedTab: MainTab = .dashboard
    @Published var selectedApp: MicroApp?
    @Published var createPrompt = ""
    @Published var draftVisibility: AppVisibility = .privateApp
    @Published var draftAudience: BuildAudience = .personal
    @Published var draftCategory: AppCategory = .planner
    @Published var generationMode: GenerationMode = .sharedRuntime
    @Published var recentApps = MicroApp.sampleData
    @Published var publicApps = MicroApp.publicShowcase
    @Published var organizations = WorkspaceOrganization.sampleData

    var featuredApps: [MicroApp] {
        recentApps
            .sorted { $0.metrics.favorites > $1.metrics.favorites }
            .prefix(3)
            .map { $0 }
    }

    var privateApps: [MicroApp] {
        recentApps.filter { $0.visibility == .privateApp }
    }

    var orgApps: [MicroApp] {
        recentApps.filter { $0.visibility == .orgApp }
    }

    var buildingApps: [MicroApp] {
        recentApps.filter { $0.status == .building || $0.status == .reviewing }
    }

    var readyApps: [MicroApp] {
        recentApps.filter { $0.status == .ready }
    }

    var storeHighlights: [MicroApp] {
        publicApps.sorted { $0.metrics.favorites > $1.metrics.favorites }
    }

    var starterPrompts: [String] {
        [
            MicroApp.spendHours.samplePrompt,
            MicroApp.guestDesk.samplePrompt,
            MicroApp.renewalRadar.samplePrompt,
            MicroApp.briefDeck.samplePrompt
        ]
    }

    var draftPromptPackage: GenerationPromptPackage {
        GenerationPromptPackage(
            systemPrompt: GenerationPromptTemplate.systemPrompt,
            userPrompt: createPrompt,
            visibility: draftVisibility,
            audience: draftAudience,
            category: draftCategory,
            mode: generationMode
        )
    }

    func authenticate() async {
        authError = nil

        let email = authEmail.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let password = authPassword

        guard email.contains("@"), password.count >= 8 else {
            authError = "Use a valid email and a password with at least 8 characters."
            return
        }

        isAuthenticating = true
        defer { isAuthenticating = false }

        do {
            let payload = AuthPayload(email: email, password: password)
            session = switch authMode {
            case .signIn:
                try await AuthService.shared.signIn(payload: payload)
            case .signUp:
                try await AuthService.shared.signUp(payload: payload)
            }
        } catch {
            authError = error.localizedDescription
        }
    }

    func signOut() {
        Task {
            await AuthService.shared.signOut()
        }

        session = .preview
        session.isAuthenticated = false
        session.accessToken = nil
        authPassword = ""
        selectedTab = .dashboard
    }

    func submitDraft() {
        let trimmed = createPrompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        let visibility = draftVisibility
        let category = draftCategory
        let audience = inferredAudience(for: visibility)
        let app = MicroApp(
            id: UUID(),
            name: category.suggestedName(from: trimmed),
            tagline: draftLine(for: visibility, category: category),
            summary: trimmed,
            storeNote: storeNote(for: visibility),
            samplePrompt: trimmed,
            category: category,
            visibility: visibility,
            audience: audience,
            status: visibility == .publicApp ? .reviewing : .building,
            completion: visibility == .publicApp ? 0.64 : 0.24,
            deploymentURL: URL(string: "https://example.vercel.app/apps/\(UUID().uuidString.lowercased())"),
            lastEdited: .now,
            metrics: .init(runs: 0, favorites: 0, forks: 0),
            updates: [
                AppUpdate(
                    title: visibility == .publicApp ? "Submitted for review" : "Build started",
                    message: visibility == .publicApp
                        ? "Foundry prepared the first version and placed it in the public review lane."
                        : "Foundry queued the first version using the instant runtime.",
                    timestamp: .now
                )
            ]
        )

        recentApps.insert(app, at: 0)
        if visibility == .publicApp {
            publicApps.insert(app, at: 0)
        }

        draftAudience = audience
        createPrompt = ""
        selectedTab = .dashboard
        selectedApp = app
    }

    func requestPublicRemix(from app: MicroApp) {
        createPrompt = "Remix \(app.name): \(app.summary)"
        draftVisibility = .privateApp
        draftAudience = inferredAudience(for: .privateApp)
        draftCategory = app.category
        selectedTab = .create
    }

    func setDraftVisibility(_ visibility: AppVisibility) {
        draftVisibility = visibility
        draftAudience = inferredAudience(for: visibility)
    }

    private func inferredAudience(for visibility: AppVisibility) -> BuildAudience {
        switch visibility {
        case .privateApp:
            return .personal
        case .publicApp:
            return .consumers
        case .orgApp:
            return .team
        }
    }

    private func draftLine(for visibility: AppVisibility, category: AppCategory) -> String {
        switch visibility {
        case .privateApp:
            return "A private \(category.rawValue.lowercased()) tool shaped around one clear need."
        case .publicApp:
            return "A public \(category.rawValue.lowercased()) utility ready for the store."
        case .orgApp:
            return "A shared \(category.rawValue.lowercased()) app built for one workspace."
        }
    }

    private func storeNote(for visibility: AppVisibility) -> String {
        switch visibility {
        case .privateApp:
            return "Private builds stay in your account until you choose to publish or share."
        case .publicApp:
            return "Public apps enter the store only after a review pass and quality check."
        case .orgApp:
            return "Workspace apps inherit team visibility, version history, and ownership rules."
        }
    }
}

enum AuthMode: String, CaseIterable, Identifiable {
    case signIn = "Sign In"
    case signUp = "Create Account"

    var id: String { rawValue }
}

enum MainTab: String, CaseIterable, Identifiable {
    case dashboard
    case create
    case explore
    case organizations
    case profile

    var id: String { rawValue }

    var title: String {
        switch self {
        case .dashboard:
            return "Home"
        case .create:
            return "Build"
        case .explore:
            return "Store"
        case .organizations:
            return "Teams"
        case .profile:
            return "Account"
        }
    }

    var symbol: String {
        switch self {
        case .dashboard:
            return "house.fill"
        case .create:
            return "plus.app.fill"
        case .explore:
            return "square.grid.2x2"
        case .organizations:
            return "person.2.fill"
        case .profile:
            return "circle.grid.2x1.fill"
        }
    }
}
