import SwiftUI

struct AuthView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 22) {
                hero
                authActions
                trustPanel
            }
            .padding(20)
        }
        .background(AppTheme.background.ignoresSafeArea())
    }

    private var hero: some View {
        GlassCard(padding: 24) {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("CODEX HACK")
                            .font(.caption.weight(.bold))
                            .tracking(2)
                            .foregroundStyle(Color.white.opacity(0.72))
                        Text("Generate real micro apps inside one powerful shell.")
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                        Text("Private tools, public utilities, and organization apps delivered as hosted experiences that can be updated by prompt.")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.82))
                    }
                    Spacer(minLength: 0)
                }

                HStack(spacing: 10) {
                    MetricPill(label: "Instant builds", value: "60s")
                    MetricPill(label: "App modes", value: "3")
                    MetricPill(label: "Prompt edits", value: "Live")
                }
            }
        }
        .background(AppTheme.heroGradient, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
    }

    private var authActions: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Access",
                title: "Create a secure platform account",
                subtitle: "Using Supabase Auth with email and password. Password hashing and credential storage are handled by Supabase Auth, not by the app client."
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
                    .background(Color.white.opacity(0.7), in: RoundedRectangle(cornerRadius: 18, style: .continuous))

                SecureField("Password", text: $appModel.authPassword)
                    .textInputAutocapitalization(.never)
                    .padding(16)
                    .background(Color.white.opacity(0.7), in: RoundedRectangle(cornerRadius: 18, style: .continuous))

                if let authError = appModel.authError {
                    Text(authError)
                        .font(.footnote)
                        .foregroundStyle(AppTheme.rose)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button(appModel.authMode == .signIn ? "Sign In" : "Create Account") {
                    Task {
                        await appModel.authenticate()
                    }
                }
                .disabled(appModel.isAuthenticating)
                .buttonStyle(CTAButtonStyle(prominent: false))
            }

            Text("This keeps login simple for the first version and works cleanly with private apps, public publishing permissions, and org workspaces later.")
                .font(.footnote)
                .foregroundStyle(AppTheme.slate)
        }
    }

    private var trustPanel: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Platform",
                title: "Everything generated under one governed account",
                subtitle: "Auth, storage, app visibility, and deployment state stay centralized."
            )

            VStack(alignment: .leading, spacing: 14) {
                authBullet("Private apps stay isolated per user and per app namespace.")
                authBullet("Public apps can be listed in the store and remixed into private copies.")
                authBullet("Organization apps inherit workspace visibility and approval flows.")
            }
        }
    }

    private func authBullet(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(AppTheme.accent)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(AppTheme.ink)
        }
    }
}

#Preview {
    AuthView()
        .environmentObject(AppModel())
}
