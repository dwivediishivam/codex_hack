import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {
                    header
                    featuredCarousel
                    activeGrid
                    activityStream
                }
                .padding(20)
            }
            .background(AppTheme.background.ignoresSafeArea())
            .navigationTitle("Workspace")
        }
    }

    private var header: some View {
        GlassCard {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Good evening, \(appModel.session.profile.name)")
                        .font(.system(.largeTitle, design: .rounded, weight: .bold))
                        .foregroundStyle(AppTheme.ink)
                    Text("Your command center for private builds, org workflows, and public launches.")
                        .font(.subheadline)
                        .foregroundStyle(AppTheme.slate)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    Text("\(appModel.activeApps.count)")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundStyle(AppTheme.ink)
                    Text("active apps")
                        .font(.caption)
                        .foregroundStyle(AppTheme.slate)
                }
            }

            HStack(spacing: 10) {
                MetricPill(label: "Private", value: "\(appModel.recentApps.filter { $0.visibility == .privateApp }.count)")
                MetricPill(label: "Org", value: "\(appModel.recentApps.filter { $0.visibility == .orgApp }.count)")
                MetricPill(label: "Public", value: "\(appModel.publicApps.count)")
            }
        }
    }

    private var featuredCarousel: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(
                eyebrow: "Featured",
                title: "Keep your strongest apps in reach",
                subtitle: "Apps with recent traction, current activity, or pending updates."
            )

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(appModel.featuredApps, id: \.id) { app in
                        Button {
                            appModel.selectedApp = app
                        } label: {
                            FeaturedAppCard(app: app)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var activeGrid: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(
                eyebrow: "Build Queue",
                title: "Apps in motion",
                subtitle: "Live generation status, review states, and release readiness."
            )

            ForEach(appModel.recentApps, id: \.id) { app in
                Button {
                    appModel.selectedApp = app
                } label: {
                    GlassCard {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(app.name)
                                    .font(.headline.weight(.bold))
                                    .foregroundStyle(AppTheme.ink)
                                Text(app.summary)
                                    .font(.subheadline)
                                    .foregroundStyle(AppTheme.slate)
                                    .multilineTextAlignment(.leading)
                                HStack(spacing: 8) {
                                    TagChip(title: app.visibility.rawValue)
                                    TagChip(title: app.category.rawValue)
                                }
                            }
                            Spacer()
                            Text(app.status.badgeText)
                                .font(.caption.weight(.bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 7)
                                .background(AppTheme.ink, in: Capsule())
                        }

                        AppProgressBar(value: app.completion)
                        HStack {
                            Text("Deployment progress")
                                .font(.caption)
                                .foregroundStyle(AppTheme.slate)
                            Spacer()
                            Text("\(Int(app.completion * 100))%")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(AppTheme.ink)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var activityStream: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(
                eyebrow: "Updates",
                title: "Recent app activity",
                subtitle: "Prompt edits, deployments, and review checkpoints."
            )

            ForEach(appModel.recentApps.flatMap(\.updates).sorted { $0.timestamp > $1.timestamp }) { update in
                GlassCard(padding: 18) {
                    Text(update.title)
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(AppTheme.ink)
                    Text(update.message)
                        .font(.subheadline)
                        .foregroundStyle(AppTheme.slate)
                    Text(update.timestamp.formatted(date: .abbreviated, time: .shortened))
                        .font(.caption)
                        .foregroundStyle(AppTheme.slate)
                }
            }
        }
    }
}

private struct FeaturedAppCard: View {
    let app: MicroApp

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(app.name)
                .font(.system(.title3, design: .rounded, weight: .bold))
            Text(app.tagline)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.84))
                .multilineTextAlignment(.leading)
            Spacer()
            HStack {
                MetricPill(label: "Runs", value: "\(app.metrics.runs)")
                MetricPill(label: "Forks", value: "\(app.metrics.forks)")
            }
        }
        .foregroundStyle(.white)
        .padding(20)
        .frame(width: 290, height: 220, alignment: .leading)
        .background(AppTheme.heroGradient, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
    }
}
