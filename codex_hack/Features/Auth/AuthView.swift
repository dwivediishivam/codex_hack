import SwiftUI

struct AuthView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 18) {
                hero
                authActions
                sampleStrip
            }
            .padding(20)
        }
        .background(ShellBackground())
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(StudioBrand.name)
                .font(.system(size: 44, weight: .semibold, design: .serif))
                .foregroundStyle(AppTheme.ink)
            Text(StudioBrand.tag)
                .font(.headline)
                .foregroundStyle(AppTheme.ink)
            Text(StudioBrand.summary)
                .font(.subheadline)
                .foregroundStyle(AppTheme.slate)

            HStack(spacing: 10) {
                MetricPill(label: "Private", value: "Instant")
                MetricPill(label: "Public", value: "Reviewed")
                MetricPill(label: "Teams", value: "Shared")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
    }

    private var authActions: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Access",
                title: "Sign in to your workspace",
                subtitle: "Email and password are handled by Supabase Auth. Private apps, public publishing, and team permissions all start here."
            )

            VStack(spacing: 12) {
                Picker("Auth Mode", selection: $appModel.authMode) {
                    ForEach(AuthMode.allCases) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)

                TextField("Email", text: $appModel.authEmail)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .padding(16)
                    .background(AppTheme.cardMuted, in: RoundedRectangle(cornerRadius: 18, style: .continuous))

                SecureField("Password", text: $appModel.authPassword)
                    .textInputAutocapitalization(.never)
                    .padding(16)
                    .background(AppTheme.cardMuted, in: RoundedRectangle(cornerRadius: 18, style: .continuous))

                if let authError = appModel.authError {
                    Text(authError)
                        .font(.footnote)
                        .foregroundStyle(AppTheme.rose)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button(appModel.authMode == .signIn ? "Continue" : "Create Account") {
                    Task {
                        await appModel.authenticate()
                    }
                }
                .disabled(appModel.isAuthenticating)
                .buttonStyle(CTAButtonStyle())
            }
        }
    }

    private var sampleStrip: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Inside",
                title: "Start from a real use case",
                subtitle: "Foundry opens with a small, coherent set of example apps instead of filler."
            )

            VStack(spacing: 12) {
                ForEach(MicroApp.sampleData.prefix(3)) { app in
                    HStack(alignment: .top, spacing: 12) {
                        Circle()
                            .fill(AppTheme.accentSoft)
                            .frame(width: 10, height: 10)
                            .padding(.top, 6)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(app.name)
                                .font(.headline)
                                .foregroundStyle(AppTheme.ink)
                            Text(app.tagline)
                                .font(.subheadline)
                                .foregroundStyle(AppTheme.slate)
                                .multilineTextAlignment(.leading)
                        }
                        Spacer()
                        TagChip(title: app.visibility.rawValue)
                    }
                }
            }
        }
    }
}

#Preview {
    AuthView()
        .environmentObject(AppModel())
}
