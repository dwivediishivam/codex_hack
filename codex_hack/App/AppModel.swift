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
    @Published var selectedOrganization: WorkspaceOrganization?
    @Published var createPrompt = ""
    @Published var draftVisibility: AppVisibility = .privateApp
    @Published var draftAudience: BuildAudience = .personal
    @Published var draftCategory: AppCategory = .planner
    @Published var generationMode: GenerationMode = .sharedRuntime
    @Published var recentApps = MicroApp.sampleData
    @Published var publicApps = MicroApp.publicShowcase
    @Published var organizations = WorkspaceOrganization.sampleData

    var featuredApps: [MicroApp] {
        recentApps.filter { $0.status != .failed }.prefix(3).map { $0 }
    }

    var activeApps: [MicroApp] {
        recentApps.filter { $0.status == .ready || $0.status == .building }
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

        let app = MicroApp(
            id: UUID(),
            name: draftCategory.suggestedName(from: trimmed),
            tagline: draftCategory.defaultTagline,
            summary: trimmed,
            category: draftCategory,
            visibility: draftVisibility,
            audience: draftAudience,
            status: .building,
            completion: 0.22,
            deploymentURL: URL(string: "https://example.vercel.app/apps/\(UUID().uuidString.lowercased())"),
            lastEdited: .now,
            metrics: .init(runs: 0, favorites: 0, forks: 0),
            updates: [
                AppUpdate(
                    title: "Generation queued",
                    message: "Codex accepted the prompt and is creating the first version from the shared runtime template.",
                    timestamp: .now
                )
            ]
        )

        recentApps.insert(app, at: 0)
        createPrompt = ""
        selectedTab = .dashboard
        selectedApp = app
    }

    func requestPublicRemix(from app: MicroApp) {
        createPrompt = "Remix \(app.name): \(app.summary)"
        draftVisibility = .privateApp
        draftAudience = .personal
        draftCategory = app.category
        selectedTab = .create
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
        case .dashboard: "Home"
        case .create: "Create"
        case .explore: "Store"
        case .organizations: "Workspaces"
        case .profile: "Profile"
        }
    }

    var symbol: String {
        switch self {
        case .dashboard: "square.grid.2x2.fill"
        case .create: "sparkles.rectangle.stack.fill"
        case .explore: "safari.fill"
        case .organizations: "person.3.fill"
        case .profile: "person.crop.circle.fill"
        }
    }
}
