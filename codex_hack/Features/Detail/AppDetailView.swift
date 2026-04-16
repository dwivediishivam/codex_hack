import SwiftUI

struct AppDetailView: View {
    @EnvironmentObject private var appModel: AppModel
    let app: MicroApp
    @State private var editPrompt = ""
    @State private var showViewer = false

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    hero
                    metrics
                    updates
                    editPanel
                }
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle(app.name)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Open") {
                        showViewer = true
                    }
                }
            }
            .sheet(isPresented: $showViewer) {
                MicroAppViewer(url: app.deploymentURL)
            }
        }
    }

    private var hero: some View {
        GlassCard {
            Text(app.tagline)
                .font(.system(.title2, design: .serif, weight: .semibold))
                .foregroundStyle(AppTheme.ink)
            Text(app.summary)
                .font(.subheadline)
                .foregroundStyle(AppTheme.slate)
            HStack(spacing: 8) {
                TagChip(title: app.visibility.rawValue)
                TagChip(title: app.category.rawValue)
                TagChip(title: app.status.badgeText, isSelected: true)
            }
            Text(app.storeNote)
                .font(.footnote)
                .foregroundStyle(AppTheme.slate)
        }
    }

    private var metrics: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Snapshot",
                title: "Usage and release posture",
                subtitle: "A compact view of traction, launch mode, and last edit activity."
            )

            HStack(spacing: 12) {
                MetricPill(label: "Runs", value: "\(app.metrics.runs)")
                MetricPill(label: "Saves", value: "\(app.metrics.favorites)")
                MetricPill(label: "Forks", value: "\(app.metrics.forks)")
            }

            Text("Last edited \(app.lastEdited.formatted(date: .abbreviated, time: .shortened))")
                .font(.footnote)
                .foregroundStyle(AppTheme.slate)
        }
    }

    private var updates: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Release Notes",
                title: "What changed",
                subtitle: "Prompt-based edits should always resolve into readable version notes."
            )

            ForEach(app.updates) { update in
                VStack(alignment: .leading, spacing: 6) {
                    Text(update.title)
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(AppTheme.ink)
                    Text(update.message)
                        .font(.subheadline)
                        .foregroundStyle(AppTheme.slate)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 4)
            }
        }
    }

    private var editPanel: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Edit",
                title: "Describe the next version",
                subtitle: "This should create a new versioned job rather than silently replacing production."
            )

            TextEditor(text: $editPrompt)
                .frame(minHeight: 120)
                .padding(12)
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
}
