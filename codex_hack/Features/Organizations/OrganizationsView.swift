import SwiftUI

struct OrganizationsView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    GlassCard {
                        SectionTitle(
                            eyebrow: "Organizations",
                            title: "Shared workspaces with governed app access",
                            subtitle: "Org apps are built with the same prompt pipeline, but route through team ownership, approvals, and shared visibility."
                        )
                    }

                    ForEach(appModel.organizations) { organization in
                        GlassCard {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(organization.name)
                                            .font(.headline.weight(.bold))
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
                                            Text(app.status.badgeText)
                                                .font(.caption.weight(.semibold))
                                                .foregroundStyle(AppTheme.ink)
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
            .background(AppTheme.background.ignoresSafeArea())
            .navigationTitle("Workspaces")
        }
    }
}
