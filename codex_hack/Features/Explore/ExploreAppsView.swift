import SwiftUI

struct ExploreAppsView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var selectedCategory: AppCategory?
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    TextField("Search", text: $searchText)
                        .padding(14)
                        .background(AppTheme.card, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(AppTheme.line, lineWidth: 1)
                        )

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            Button {
                                selectedCategory = nil
                            } label: {
                                TagChip(title: "All", isSelected: selectedCategory == nil)
                            }
                            .buttonStyle(.plain)

                            ForEach(AppCategory.allCases.filter { $0 != .dashboard }) { category in
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
                                Text(app.name)
                                    .font(.system(.headline, design: .rounded, weight: .semibold))
                                    .foregroundStyle(AppTheme.ink)

                                Text(app.summary)
                                    .font(.system(.subheadline, design: .rounded))
                                    .foregroundStyle(AppTheme.slate)
                                    .lineLimit(2)

                                HStack(spacing: 8) {
                                    TagChip(title: app.category.rawValue)
                                    TagChip(title: "\(app.metrics.favorites) saves")
                                }

                                HStack(spacing: 10) {
                                    Button("Open") {
                                        appModel.selectedApp = app
                                    }
                                    .buttonStyle(CTAButtonStyle())

                                    Button("Remix") {
                                        appModel.requestPublicRemix(from: app)
                                    }
                                    .buttonStyle(CTAButtonStyle(prominent: false))
                                }
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
        appModel.publicApps.filter { app in
            let categoryMatch = selectedCategory == nil || app.category == selectedCategory
            let searchMatch = searchText.isEmpty
                || app.name.localizedCaseInsensitiveContains(searchText)
                || app.summary.localizedCaseInsensitiveContains(searchText)
            return categoryMatch && searchMatch
        }
    }
}
