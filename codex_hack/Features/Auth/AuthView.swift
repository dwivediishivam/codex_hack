import SwiftUI

struct AuthView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        VStack {
            Spacer()

            GlassCard(padding: 22) {
                VStack(spacing: 18) {
                    Image("BrandMark")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 56, height: 56)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                    Text(StudioBrand.name)
                        .font(.system(size: 30, weight: .semibold, design: .rounded))
                        .foregroundStyle(AppTheme.ink)

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
                        .background(AppTheme.cardMuted, in: RoundedRectangle(cornerRadius: 16, style: .continuous))

                    SecureField("Password", text: $appModel.authPassword)
                        .textInputAutocapitalization(.never)
                        .padding(16)
                        .background(AppTheme.cardMuted, in: RoundedRectangle(cornerRadius: 16, style: .continuous))

                    if let authError = appModel.authError {
                        Text(authError)
                            .font(.system(.footnote, design: .rounded))
                            .foregroundStyle(AppTheme.rose)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button(appModel.authMode == .signIn ? "Log In" : "Create Account") {
                        Task {
                            await appModel.authenticate()
                        }
                    }
                    .disabled(appModel.isAuthenticating)
                    .buttonStyle(CTAButtonStyle())
                }
            }
            .padding(.horizontal, 20)

            Spacer()
        }
        .background(ShellBackground())
    }
}

#Preview {
    AuthView()
        .environmentObject(AppModel())
}
