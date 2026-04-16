import SwiftUI

struct OrganizationsView: View {
    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 12) {
                    guideCard(
                        title: "Purpose",
                        text: "Foundry lets you build very small apps for one clear job."
                    )
                    guideCard(
                        title: "Create",
                        text: "Write a direct prompt. The app is built and added to your Apps tab."
                    )
                    guideCard(
                        title: "Apps",
                        text: "Apps only shows what you created or added for yourself."
                    )
                    guideCard(
                        title: "Store",
                        text: "The store keeps polished starter apps that you can open or save."
                    )
                }
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle("Guide")
        }
    }

    private func guideCard(title: String, text: String) -> some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.system(.headline, design: .rounded, weight: .semibold))
                    .foregroundStyle(AppTheme.ink)
                Text(text)
                    .font(.system(.body, design: .rounded))
                    .foregroundStyle(AppTheme.slate)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
