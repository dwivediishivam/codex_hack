import SwiftUI

struct ExploreAppsView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    TextField("Search", text: $searchText)
                        .padding(14)
                        .background(AppTheme.card, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(AppTheme.line, lineWidth: 1)
                        )

                    ForEach(filteredApps, id: \.id) { app in
                        GlassCard {
                            VStack(alignment: .leading, spacing: 12) {
                                Text(app.name)
                                    .font(.system(.headline, design: .rounded, weight: .semibold))
                                    .foregroundStyle(AppTheme.ink)

                                Text(app.summary)
                                    .font(.system(.subheadline, design: .rounded))
                                    .foregroundStyle(AppTheme.slate)
                                    .lineLimit(2)

                                HStack(spacing: 10) {
                                    Button("Open") {
                                        appModel.selectedApp = app
                                    }
                                    .buttonStyle(CTAButtonStyle())

                                    Button("Add") {
                                        let owned = MicroApp(
                                            id: UUID(),
                                            name: app.name,
                                            tagline: app.tagline,
                                            summary: app.summary,
                                            storeNote: app.storeNote,
                                            samplePrompt: app.samplePrompt,
                                            category: app.category,
                                            visibility: .privateApp,
                                            audience: .personal,
                                            status: .ready,
                                            completion: 1,
                                            deploymentURL: app.deploymentURL,
                                            lastEdited: .now,
                                            metrics: app.metrics,
                                            updates: app.updates
                                        )
                                        appModel.recentApps.insert(owned, at: 0)
                                    }
                                    .buttonStyle(CTAButtonStyle(prominent: false))
                                }
                            }
                        }
                    }
                }
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle("Store")
        }
    }

    private var filteredApps: [MicroApp] {
        appModel.publicApps.filter {
            searchText.isEmpty
                || $0.name.localizedCaseInsensitiveContains(searchText)
                || $0.summary.localizedCaseInsensitiveContains(searchText)
        }
    }
}
