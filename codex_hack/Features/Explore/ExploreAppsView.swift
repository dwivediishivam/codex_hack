import SwiftUI

struct ExploreAppsView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {
                    GlassCard {
                        SectionTitle(
                            eyebrow: "Public Store",
                            title: "Discover apps worth remixing",
                            subtitle: "Public apps are review-approved and can be forked into your workspace or private account."
                        )
                    }

                    ForEach(appModel.publicApps, id: \.id) { app in
                        GlassCard {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(app.name)
                                        .font(.headline.weight(.bold))
                                        .foregroundStyle(AppTheme.ink)
                                    Text(app.tagline)
                                        .font(.subheadline)
                                        .foregroundStyle(AppTheme.slate)
                                    HStack(spacing: 8) {
                                        TagChip(title: app.category.rawValue)
                                        TagChip(title: "\(app.metrics.favorites) saves")
                                    }
                                }
                                Spacer()
                                Button("Remix") {
                                    appModel.requestPublicRemix(from: app)
                                }
                                .buttonStyle(CTAButtonStyle(prominent: false))
                                .frame(width: 110)
                            }
                        }
                    }
                }
                .padding(20)
            }
            .background(AppTheme.background.ignoresSafeArea())
            .navigationTitle("Store")
        }
    }
}
