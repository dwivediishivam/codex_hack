import SwiftUI

struct AppDetailView: View {
    @EnvironmentObject private var appModel: AppModel
    let app: MicroApp
    @State private var editPrompt = ""
    @State private var showViewer = false

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    GlassCard {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(app.name)
                                .font(.system(.title3, design: .rounded, weight: .semibold))
                                .foregroundStyle(AppTheme.ink)

                            Text(app.summary)
                                .font(.system(.subheadline, design: .rounded))
                                .foregroundStyle(AppTheme.slate)

                            HStack(spacing: 10) {
                                Button("Open App") {
                                    showViewer = true
                                }
                                .buttonStyle(CTAButtonStyle())

                                Button("Edit") {
                                    appModel.createPrompt = "Update \(app.name): "
                                    appModel.selectedApp = nil
                                    appModel.selectedTab = .create
                                }
                                .buttonStyle(CTAButtonStyle(prominent: false))
                            }
                        }
                    }

                    GlassCard {
                        TextEditor(text: $editPrompt)
                            .frame(minHeight: 140)
                            .padding(10)
                            .scrollContentBackground(.hidden)
                            .background(AppTheme.cardMuted, in: RoundedRectangle(cornerRadius: 18, style: .continuous))

                        Button("Queue Update") {
                            appModel.createPrompt = "Update \(app.name): \(editPrompt)"
                            appModel.selectedApp = nil
                            appModel.selectedTab = .create
                        }
                        .buttonStyle(CTAButtonStyle())
                    }
                }
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle(app.name)
            .sheet(isPresented: $showViewer) {
                MicroAppViewer(url: app.deploymentURL)
            }
        }
    }
}
