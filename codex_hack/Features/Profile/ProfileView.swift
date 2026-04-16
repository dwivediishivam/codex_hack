import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    GlassCard {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(appModel.session.profile.name)
                                .font(.system(.title2, design: .rounded, weight: .bold))
                                .foregroundStyle(AppTheme.ink)
                            Text(appModel.session.profile.email)
                                .font(.subheadline)
                                .foregroundStyle(AppTheme.slate)
                            HStack(spacing: 10) {
                                MetricPill(label: "Role", value: appModel.session.profile.role)
                                MetricPill(label: "Orgs", value: "\(appModel.session.profile.organizationCount)")
                            }
                        }
                    }

                    GlassCard {
                        SectionTitle(
                            eyebrow: "Integrations",
                            title: "Configuration checkpoints",
                            subtitle: "These remain local placeholders until you provide platform keys."
                        )
                        configRow("Supabase", isConfigured: AppConfig.hasAuthConfiguration)
                        configRow("Backend API", isConfigured: !AppConfig.backendBaseURL.isEmpty)
                        configRow("Email Auth", isConfigured: AuthService.shared.isConfigured)
                    }

                    Button("Sign Out") {
                        appModel.signOut()
                    }
                    .buttonStyle(CTAButtonStyle(prominent: false))
                }
                .padding(20)
            }
            .background(AppTheme.background.ignoresSafeArea())
            .navigationTitle("Profile")
        }
    }

    private func configRow(_ title: String, isConfigured: Bool) -> some View {
        HStack {
            Text(title)
                .foregroundStyle(AppTheme.ink)
            Spacer()
            Text(isConfigured ? "Ready" : "Needs Keys")
                .font(.caption.weight(.bold))
                .foregroundStyle(isConfigured ? AppTheme.accent : AppTheme.rose)
        }
        .padding(.vertical, 4)
    }
}
