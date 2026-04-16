import SwiftUI

struct ExploreAppsView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var selectedCategory: AppCategory?

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    GlassCard {
                        SectionTitle(
                            eyebrow: "Public Store",
                            title: "A store for useful, legible apps",
                            subtitle: "Public apps are small, clear, and easy to remix into a private or team copy."
                        )
                    }

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            Button {
                                selectedCategory = nil
                            } label: {
                                TagChip(title: "All", isSelected: selectedCategory == nil)
                            }
                            .buttonStyle(.plain)

                            ForEach(AppCategory.allCases) { category in
                                Button {
                                    selectedCategory = category
                                } label: {
                                    TagChip(title: category.rawValue, isSelected: selectedCategory == category)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    ForEach(filteredApps, id: \.id) { app in
                        GlassCard {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(alignment: .top) {
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text(app.name)
                                            .font(.headline)
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
                                    .frame(width: 104)
                                }

                                Text(app.summary)
                                    .font(.subheadline)
                                    .foregroundStyle(AppTheme.slate)
                                Text(app.storeNote)
                                    .font(.footnote)
                                    .foregroundStyle(AppTheme.slate)
                            }
                        }
                    }
                }
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle("Store")
        }
    }

    private var filteredApps: [MicroApp] {
        if let selectedCategory {
            return appModel.publicApps.filter { $0.category == selectedCategory }
        }

        return appModel.publicApps
    }
}
