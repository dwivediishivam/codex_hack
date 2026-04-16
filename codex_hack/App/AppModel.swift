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
    @Published var isSyncing = false
    @Published var syncError: String?
    @Published var selectedTab: MainTab = .apps
    @Published var selectedApp: MicroApp?
    @Published var createPrompt = ""
    @Published var draftVisibility: AppVisibility = .privateApp
    @Published var draftAudience: BuildAudience = .personal
    @Published var draftCategory: AppCategory = .planner
    @Published var generationMode: GenerationMode = .sharedRuntime
    @Published var recentApps = MicroApp.sampleData
    @Published var publicApps = MicroApp.publicShowcase
    @Published var organizations = WorkspaceOrganization.sampleData
    private var hasLoadedRemoteState = false
    private var authObserverTask: Task<Void, Never>?

    init() {
        authObserverTask = Task { [weak self] in
            guard let self else { return }

            if let restored = await AuthService.shared.restoreSession() {
                self.session = restored
                await self.loadRemoteState(force: true)
            } else {
                self.session = .preview
                self.session.isAuthenticated = false
            }

            for await authState in AuthService.shared.authStateChanges() {
                guard !Task.isCancelled else { break }

                if let authState {
                    self.session = authState
                    await self.loadRemoteState(force: true)
                } else if self.session.isAuthenticated {
                    self.applySignedOutState()
                }
            }
        }
    }

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
            MicroApp.briefDeck.samplePrompt,
            MicroApp.polaroidPrint.samplePrompt
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

            if !session.isAuthenticated, authMode == .signUp {
                authError = AuthServiceError.confirmationRequired.localizedDescription
                return
            }

            await loadRemoteState(force: true)
        } catch {
            authError = error.localizedDescription
        }
    }

    func signOut() {
        Task {
            await AuthService.shared.signOut()
        }

        applySignedOutState()
    }

    func handleIncomingURL(_ url: URL) async {
        do {
            session = try await AuthService.shared.handleIncomingURL(url)
            await loadRemoteState(force: true)
        } catch {
            authError = error.localizedDescription
        }
    }

    func loadRemoteStateIfNeeded() async {
        guard session.isAuthenticated, !hasLoadedRemoteState else { return }
        await loadRemoteState(force: false)
    }

    func submitDraft() async {
        let trimmed = createPrompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        let visibility = draftVisibility
        let category = draftCategory
        let audience = inferredAudience(for: visibility)
        let draft = MicroApp(
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

        draftAudience = audience
        createPrompt = ""
        selectedTab = .apps
        syncError = nil

        guard session.isAuthenticated else {
            insertOrReplace(draft)
            selectedApp = draft
            return
        }

        do {
            let created = try await PlatformService.shared.createApp(
                CreateMicroAppRequest(
                    ownerID: session.profile.email,
                    name: category.suggestedName(from: trimmed),
                    prompt: trimmed,
                    visibility: visibility,
                    audience: audience,
                    category: category,
                    generationMode: generationMode
                )
            )

            insertOrReplace(created)
            selectedApp = created
            hasLoadedRemoteState = false
            await loadRemoteState(force: true)
        } catch {
            insertOrReplace(draft)
            selectedApp = draft
            syncError = error.localizedDescription
        }
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

    private func loadRemoteState(force: Bool) async {
        guard AppConfig.hasBackendConfiguration else { return }
        if !force, hasLoadedRemoteState { return }

        isSyncing = true
        defer { isSyncing = false }

        do {
            async let ownerApps = PlatformService.shared.fetchApps(ownerID: session.profile.email)
            async let storeApps = PlatformService.shared.fetchPublicApps()

            let resolvedOwnerApps = try await ownerApps
            let resolvedStoreApps = try await storeApps

            recentApps = resolvedOwnerApps.isEmpty ? MicroApp.sampleData : resolvedOwnerApps
            publicApps = resolvedStoreApps.isEmpty ? MicroApp.publicShowcase : resolvedStoreApps
            organizations = WorkspaceOrganization.using(recentApps)
            syncError = nil
            hasLoadedRemoteState = true
        } catch {
            syncError = error.localizedDescription
            hasLoadedRemoteState = false
        }
    }

    private func insertOrReplace(_ app: MicroApp) {
        recentApps.removeAll { $0.id == app.id || $0.name == app.name }
        recentApps.insert(app, at: 0)

        if app.visibility == .publicApp {
            publicApps.removeAll { $0.id == app.id || $0.name == app.name }
            publicApps.insert(app, at: 0)
        }

        organizations = WorkspaceOrganization.using(recentApps)
    }

    private func applySignedOutState() {
        session = .preview
        session.isAuthenticated = false
        session.accessToken = nil
        authPassword = ""
        selectedTab = .apps
        syncError = nil
        hasLoadedRemoteState = false
        recentApps = MicroApp.sampleData
        publicApps = MicroApp.publicShowcase
        organizations = WorkspaceOrganization.sampleData
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
    case apps
    case create
    case instructions
    case store
    case profile

    var id: String { rawValue }

    var title: String {
        switch self {
        case .apps:
            return "Apps"
        case .create:
            return "Create"
        case .instructions:
            return "Guide"
        case .store:
            return "Store"
        case .profile:
            return "Profile"
        }
    }

    var symbol: String {
        switch self {
        case .apps:
            return "square.stack.3d.up.fill"
        case .create:
            return "plus.app.fill"
        case .instructions:
            return "text.book.closed.fill"
        case .store:
            return "magnifyingglass"
        case .profile:
            return "person.crop.circle.fill"
        }
    }
}
