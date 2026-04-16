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
                                .font(.system(.title2, design: .serif, weight: .semibold))
                                .foregroundStyle(AppTheme.ink)
                            Text(appModel.session.profile.email)
                                .font(.subheadline)
                                .foregroundStyle(AppTheme.slate)
                            HStack(spacing: 10) {
                                MetricPill(label: "Role", value: appModel.session.profile.role)
                                MetricPill(label: "Teams", value: "\(appModel.session.profile.organizationCount)")
                            }
                        }
                    }

                    GlassCard {
                        SectionTitle(
                            eyebrow: "Platform",
                            title: "Connection status",
                            subtitle: "The shell uses Supabase for auth and points at a separate backend for build and deployment jobs."
                        )

                        configRow("Supabase", isConfigured: AppConfig.hasAuthConfiguration)
                        configRow("Backend API", isConfigured: !AppConfig.backendBaseURL.isEmpty)
                        configRow("Email login", isConfigured: AuthService.shared.isConfigured)
                    }

                    Button("Sign Out") {
                        appModel.signOut()
                    }
                    .buttonStyle(CTAButtonStyle(prominent: false))
                }
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle("Account")
        }
    }

    private func configRow(_ title: String, isConfigured: Bool) -> some View {
        HStack {
            Text(title)
                .foregroundStyle(AppTheme.ink)
            Spacer()
            Text(isConfigured ? "Ready" : "Needs setup")
                .font(.caption.weight(.bold))
                .foregroundStyle(isConfigured ? AppTheme.success : AppTheme.rose)
        }
        .padding(.vertical, 4)
    }
}
