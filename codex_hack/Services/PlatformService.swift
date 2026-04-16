import Foundation

struct CreateMicroAppRequest {
    let ownerID: String
    let name: String
    let prompt: String
    let visibility: AppVisibility
    let audience: BuildAudience
    let category: AppCategory
    let generationMode: GenerationMode
}

enum PlatformServiceError: LocalizedError {
    case missingConfiguration
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .missingConfiguration:
            return "Backend API is not configured in the app build settings."
        case .invalidResponse:
            return "The backend returned an unexpected response."
        }
    }
}

actor PlatformService {
    static let shared = PlatformService()

    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return decoder
    }()

    func fetchApps(ownerID: String?) async throws -> [MicroApp] {
        let endpoint = ownerID.map { "/api/micro-apps?ownerId=\($0.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? $0)" } ?? "/api/micro-apps"
        let response: RemoteAppsEnvelope = try await request(path: endpoint)
        return response.items.map { $0.toDomainModel() }
    }

    func fetchPublicApps() async throws -> [MicroApp] {
        let response: RemoteAppsEnvelope = try await request(path: "/api/micro-apps/public")
        return response.items.map { $0.toDomainModel() }
    }

    func createApp(_ input: CreateMicroAppRequest) async throws -> MicroApp {
        let payload = RemoteCreatePayload(
            ownerId: input.ownerID,
            name: input.name,
            prompt: input.prompt,
            visibility: input.visibility.apiValue,
            audience: input.audience.apiValue,
            category: input.category.rawValue.lowercased(),
            generationMode: input.generationMode.apiValue
        )

        let response: RemoteCreateEnvelope = try await request(
            path: "/api/micro-apps",
            method: "POST",
            body: try JSONEncoder().encode(payload)
        )

        return response.app.toDomainModel()
    }

    private func request<Response: Decodable>(path: String, method: String = "GET", body: Data? = nil) async throws -> Response {
        guard let baseURL = URL(string: AppConfig.backendBaseURL), !AppConfig.backendBaseURL.isEmpty else {
            throw PlatformServiceError.missingConfiguration
        }

        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw PlatformServiceError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw PlatformServiceError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            let message = (try? decoder.decode(RemoteErrorEnvelope.self, from: data).error) ?? "Request failed."
            throw NSError(domain: "FoundryAPI", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: message])
        }

        return try decoder.decode(Response.self, from: data)
    }
}

private struct RemoteAppsEnvelope: Decodable {
    let items: [RemoteMicroAppRecord]
}

private struct RemoteCreateEnvelope: Decodable {
    let app: RemoteMicroAppRecord
}

private struct RemoteErrorEnvelope: Decodable {
    let error: String
}

private struct RemoteCreatePayload: Encodable {
    let ownerId: String
    let name: String
    let prompt: String
    let visibility: String
    let audience: String
    let category: String
    let generationMode: String
}

private struct RemoteMicroAppRecord: Decodable {
    let id: String
    let ownerId: String
    let name: String
    let summary: String
    let visibility: String
    let audience: String
    let category: String
    let generationMode: String
    let status: String
    let deploymentUrl: String?
    let createdAt: String
    let updatedAt: String

    func toDomainModel() -> MicroApp {
        let visibility = AppVisibility(apiValue: visibility)
        let category = AppCategory(apiValue: category)
        let audience = BuildAudience(apiValue: audience)
        let status = AppStatus(apiValue: status)
        let updatedDate = ISO8601DateFormatter().date(from: updatedAt) ?? .now
        let deploymentURL = deploymentUrl.flatMap(URL.init(string:))

        if let template = MicroApp.template(named: name) {
            return MicroApp(
                id: UUID(uuidString: id) ?? template.id,
                name: template.name,
                tagline: template.tagline,
                summary: template.summary,
                storeNote: template.storeNote,
                samplePrompt: template.samplePrompt,
                category: category,
                visibility: visibility,
                audience: audience,
                status: status,
                completion: status.progressValue,
                deploymentURL: deploymentURL ?? template.deploymentURL,
                lastEdited: updatedDate,
                metrics: template.metrics,
                updates: template.updates
            )
        }

        return MicroApp(
            id: UUID(uuidString: id) ?? UUID(),
            name: name,
            tagline: defaultTagline(for: visibility, category: category),
            summary: summary,
            storeNote: defaultStoreNote(for: visibility),
            samplePrompt: summary,
            category: category,
            visibility: visibility,
            audience: audience,
            status: status,
            completion: status.progressValue,
            deploymentURL: deploymentURL,
            lastEdited: updatedDate,
            metrics: .init(runs: 0, favorites: 0, forks: 0),
            updates: [
                AppUpdate(
                    title: status == .reviewing ? "Submitted for review" : "Build started",
                    message: status == .reviewing
                        ? "Foundry placed this app into the public review lane."
                        : "Foundry queued the first version for generation.",
                    timestamp: updatedDate
                )
            ]
        )
    }

    private func defaultTagline(for visibility: AppVisibility, category: AppCategory) -> String {
        switch visibility {
        case .privateApp:
            return "A private \(category.rawValue.lowercased()) tool shaped around one clear need."
        case .publicApp:
            return "A public \(category.rawValue.lowercased()) utility ready for the store."
        case .orgApp:
            return "A shared \(category.rawValue.lowercased()) app built for one workspace."
        }
    }

    private func defaultStoreNote(for visibility: AppVisibility) -> String {
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
