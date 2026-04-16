import SwiftUI

struct CreateAppView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            VStack(spacing: 18) {
                Spacer()

                GlassCard(padding: 22) {
                    VStack(spacing: 16) {
                        TextEditor(text: $appModel.createPrompt)
                            .frame(minHeight: 220)
                            .padding(10)
                            .scrollContentBackground(.hidden)
                            .background(AppTheme.cardMuted, in: RoundedRectangle(cornerRadius: 18, style: .continuous))

                        Button("Create") {
                            Task {
                                await appModel.submitDraft()
                            }
                        }
                        .buttonStyle(CTAButtonStyle())
                    }
                }
                .padding(.horizontal, 20)

                Spacer()
            }
            .background(ShellBackground())
            .navigationTitle("Create")
        }
    }
}
