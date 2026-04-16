import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    header
                    buildQueue
                    storePreview
                    workspacePreview
                }
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle("Home")
        }
    }

    private var header: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Good evening, \(appModel.session.profile.name)")
                        .font(.system(.largeTitle, design: .serif, weight: .semibold))
                        .foregroundStyle(AppTheme.ink)
                    Text("Keep private builds, public launches, and workspace tools in one calm place.")
                        .font(.subheadline)
                        .foregroundStyle(AppTheme.slate)
                }

                HStack(spacing: 10) {
                    MetricPill(label: "Ready", value: "\(appModel.readyApps.count)")
                    MetricPill(label: "Building", value: "\(appModel.buildingApps.count)")
                    MetricPill(label: "Store", value: "\(appModel.publicApps.count)")
                }
            }
        }
    }

    private var buildQueue: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(
                eyebrow: "Recent",
                title: "Apps in motion",
                subtitle: "The four starter apps show the three release modes clearly: private, public, and team."
            )

            ForEach(appModel.recentApps, id: \.id) { app in
                Button {
                    appModel.selectedApp = app
                } label: {
                    GlassCard {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(app.name)
                                    .font(.headline)
                                    .foregroundStyle(AppTheme.ink)
                                Text(app.tagline)
                                    .font(.subheadline)
                                    .foregroundStyle(AppTheme.slate)
                                    .multilineTextAlignment(.leading)
                                HStack(spacing: 8) {
                                    TagChip(title: app.visibility.rawValue)
                                    TagChip(title: app.category.rawValue)
                                }
                            }
                            Spacer()
                            MetricPill(label: "Status", value: app.status.badgeText)
                        }

                        AppProgressBar(value: app.completion)
                        HStack {
                            Text(app.storeNote)
                                .font(.caption)
                                .foregroundStyle(AppTheme.slate)
                            Spacer()
                            Text("\(Int(app.completion * 100))%")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(AppTheme.ink)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var storePreview: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(
                eyebrow: "Store",
                title: "Public apps with a clear reason to exist",
                subtitle: "The store is curated. Public apps need a crisp use case, quick payoff, and a clean remix path."
            )

            ForEach(appModel.storeHighlights.prefix(2), id: \.id) { app in
                GlassCard {
                    HStack(alignment: .top, spacing: 12) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(app.name)
                                .font(.headline)
                                .foregroundStyle(AppTheme.ink)
                            Text(app.summary)
                                .font(.subheadline)
                                .foregroundStyle(AppTheme.slate)
                                .multilineTextAlignment(.leading)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 6) {
                            Text("\(app.metrics.favorites)")
                                .font(.system(.title3, design: .serif, weight: .semibold))
                                .foregroundStyle(AppTheme.ink)
                            Text("saves")
                                .font(.caption)
                                .foregroundStyle(AppTheme.slate)
                        }
                    }
                }
            }
        }
    }

    private var workspacePreview: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(
                eyebrow: "Teams",
                title: "Workspace apps stay governed",
                subtitle: "Organization apps keep shared ownership, version notes, and a single live URL."
            )

            ForEach(appModel.organizations) { organization in
                GlassCard {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(organization.name)
                                    .font(.headline)
                                    .foregroundStyle(AppTheme.ink)
                                Text(organization.domain)
                                    .font(.subheadline)
                                    .foregroundStyle(AppTheme.slate)
                            }
                            Spacer()
                            MetricPill(label: "Seats", value: "\(organization.seatCount)")
                        }

                        ForEach(organization.apps, id: \.id) { app in
                            Button {
                                appModel.selectedApp = app
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(app.name)
                                            .font(.subheadline.weight(.semibold))
                                            .foregroundStyle(AppTheme.ink)
                                        Text(app.tagline)
                                            .font(.caption)
                                            .foregroundStyle(AppTheme.slate)
                                    }
                                    Spacer()
                                    TagChip(title: app.status.badgeText, isSelected: true)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }
}
