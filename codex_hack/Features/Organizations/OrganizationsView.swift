import SwiftUI

struct OrganizationsView: View {
    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 12) {
                    instructionRow(number: "1", text: "Write one clear prompt.")
                    instructionRow(number: "2", text: "Choose Private, Public, or Org.")
                    instructionRow(number: "3", text: "Create the app.")
                    instructionRow(number: "4", text: "Open it. Edit it. Publish it.")
                }
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle("Guide")
        }
    }

    private func instructionRow(number: String, text: String) -> some View {
        GlassCard {
            HStack(spacing: 14) {
                Text(number)
                    .font(.system(.headline, design: .rounded, weight: .semibold))
                    .foregroundStyle(AppTheme.ink)
                    .frame(width: 24)

                Text(text)
                    .font(.system(.body, design: .rounded))
                    .foregroundStyle(AppTheme.ink)

                Spacer()
            }
        }
    }
}
