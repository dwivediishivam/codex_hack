import SwiftUI

struct OrganizationsView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    GlassCard {
                        SectionTitle(
                            eyebrow: "Workspaces",
                            title: "Shared tools with a single owner trail",
                            subtitle: "Team apps keep one live URL, shared access, and prompt-based version notes."
                        )
                    }

                    ForEach(appModel.organizations) { organization in
                        GlassCard {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 6) {
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
                                        HStack(alignment: .top) {
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
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle("Teams")
        }
    }
}
