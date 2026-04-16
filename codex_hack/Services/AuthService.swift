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

        return UserSession(
            isAuthenticated: response.session != nil,
            profile: .init(
                name: Self.name(from: payload.email),
                email: payload.email,
                role: "Builder",
                organizationCount: 0
            ),
            accessToken: response.session?.accessToken
        )
    }

    func signIn(payload: AuthPayload) async throws -> UserSession {
        guard let client else {
            throw AuthServiceError.missingConfiguration
        }

        let response = try await client.auth.signIn(
            email: payload.email,
            password: payload.password
        )

        return UserSession(
            isAuthenticated: true,
            profile: .init(
                name: Self.name(from: payload.email),
                email: payload.email,
                role: "Builder",
                organizationCount: 0
            ),
            accessToken: response.accessToken
        )
    }

    func signOut() async {
        guard let client else { return }
        try? await client.auth.signOut()
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

    var errorDescription: String? {
        switch self {
        case .missingConfiguration:
            "Supabase auth is not configured in the app build settings."
        }
    }
}
