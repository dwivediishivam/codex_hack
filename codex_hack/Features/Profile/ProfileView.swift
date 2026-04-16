import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    GlassCard {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(appModel.session.profile.name)
                                .font(.system(.title3, design: .rounded, weight: .semibold))
                                .foregroundStyle(AppTheme.ink)
                            Text(appModel.session.profile.email)
                                .font(.system(.subheadline, design: .rounded))
                                .foregroundStyle(AppTheme.slate)
                        }
                    }

                    GlassCard {
                        VStack(spacing: 12) {
                            settingRow("Role", value: appModel.session.profile.role)
                            settingRow("Teams", value: "\(appModel.session.profile.organizationCount)")
                            settingRow("Auth", value: AppConfig.hasAuthConfiguration ? "On" : "Off")
                            settingRow("API", value: AppConfig.hasBackendConfiguration ? "On" : "Off")
                        }
                    }

                    Button("Sign Out") {
                        appModel.signOut()
                    }
                    .buttonStyle(CTAButtonStyle(prominent: false))
                }
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle("Profile")
        }
    }

    private func settingRow(_ title: String, value: String) -> some View {
        HStack {
            Text(title)
                .font(.system(.body, design: .rounded))
                .foregroundStyle(AppTheme.ink)
            Spacer()
            Text(value)
                .font(.system(.subheadline, design: .rounded, weight: .semibold))
                .foregroundStyle(AppTheme.slate)
        }
    }
}
