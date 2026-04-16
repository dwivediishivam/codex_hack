import Foundation

enum AppConfig {
    static let backendBaseURL = Bundle.main.object(forInfoDictionaryKey: "BACKEND_BASE_URL") as? String ?? ""
    static let supabaseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
    static let supabaseAnonKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String ?? ""
    static let googleClientID = Bundle.main.object(forInfoDictionaryKey: "GOOGLE_CLIENT_ID") as? String ?? ""

    static var hasAuthConfiguration: Bool {
        !supabaseURL.isEmpty && !supabaseAnonKey.isEmpty
    }

    static var hasBackendConfiguration: Bool {
        !backendBaseURL.isEmpty
    }
}
