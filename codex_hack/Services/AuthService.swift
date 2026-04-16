import Foundation
import Supabase

struct AuthPayload {
    let email: String
    let password: String
}

@MainActor
final class AuthService {
    static let shared = AuthService()

    private let client: SupabaseClient?

    private init() {
        guard
            let url = URL(string: AppConfig.supabaseURL),
            !AppConfig.supabaseAnonKey.isEmpty
        else {
            client = nil
            return
        }

        client = SupabaseClient(
            supabaseURL: url,
            supabaseKey: AppConfig.supabaseAnonKey
        )
    }

    var isConfigured: Bool {
        client != nil
    }

    func signUp(payload: AuthPayload) async throws -> UserSession {
        guard let client else {
            throw AuthServiceError.missingConfiguration
        }

        let response = try await client.auth.signUp(
            email: payload.email,
            password: payload.password
        )

        if let session = response.session {
            return Self.session(from: session)
        }

        return UserSession(
            isAuthenticated: false,
            profile: .init(
                name: Self.name(from: payload.email),
                email: payload.email,
                role: "Builder",
                organizationCount: 0
            ),
            accessToken: nil
        )
    }

    func signIn(payload: AuthPayload) async throws -> UserSession {
        guard let client else {
            throw AuthServiceError.missingConfiguration
        }

        let session = try await client.auth.signIn(
            email: payload.email,
            password: payload.password
        )

        return Self.session(from: session)
    }

    func restoreSession() async -> UserSession? {
        guard let client else { return nil }

        do {
            let session = try await client.auth.session
            return Self.session(from: session)
        } catch {
            return nil
        }
    }

    func authStateChanges() -> AsyncStream<UserSession?> {
        guard let client else {
            return AsyncStream { continuation in
                continuation.yield(nil)
                continuation.finish()
            }
        }

        return AsyncStream { continuation in
            let task = Task {
                for await change in client.auth.authStateChanges {
                    continuation.yield(change.session.map(Self.session(from:)))
                }
                continuation.finish()
            }

            continuation.onTermination = { _ in
                task.cancel()
            }
        }
    }

    func handleIncomingURL(_ url: URL) async throws -> UserSession {
        guard let client else {
            throw AuthServiceError.missingConfiguration
        }

        let session = try await client.auth.session(from: url)
        return Self.session(from: session)
    }

    func signOut() async {
        guard let client else { return }
        try? await client.auth.signOut()
    }

    private static func session(from session: Session) -> UserSession {
        let email = session.user.email ?? "builder@foundry.app"

        return UserSession(
            isAuthenticated: true,
            profile: .init(
                name: Self.name(from: email),
                email: email,
                role: "Builder",
                organizationCount: 0
            ),
            accessToken: session.accessToken
        )
    }

    private static func name(from email: String) -> String {
        email
            .split(separator: "@")
            .first?
            .replacingOccurrences(of: ".", with: " ")
            .split(separator: " ")
            .map { $0.capitalized }
            .joined(separator: " ") ?? "Builder"
    }
}

enum AuthServiceError: LocalizedError {
    case missingConfiguration
    case confirmationRequired

    var errorDescription: String? {
        switch self {
        case .missingConfiguration:
            "Supabase auth is not configured in the app build settings."
        case .confirmationRequired:
            "Check your email to confirm the account, then log in."
        }
    }
}
