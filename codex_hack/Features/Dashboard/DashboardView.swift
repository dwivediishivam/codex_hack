import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    if appModel.recentApps.isEmpty {
                        GlassCard {
                            VStack(spacing: 10) {
                                Text("No apps yet")
                                    .font(.system(.headline, design: .rounded, weight: .semibold))
                                    .foregroundStyle(AppTheme.ink)
                                Text("Create one or add one from the store.")
                                    .font(.system(.subheadline, design: .rounded))
                                    .foregroundStyle(AppTheme.slate)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    } else {
                        ForEach(appModel.recentApps, id: \.id) { app in
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

                                        Button("Edit") {
                                            appModel.createPrompt = "Update \(app.name): "
                                            appModel.selectedTab = .create
                                        }
                                        .buttonStyle(CTAButtonStyle(prominent: false))
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle("Apps")
        }
    }
}
