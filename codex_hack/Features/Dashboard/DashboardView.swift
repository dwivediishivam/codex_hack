import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var selectedFilter: AppVisibility?

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    header
                    filters

                    ForEach(filteredApps, id: \.id) { app in
                        GlassCard {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(alignment: .top) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(app.name)
                                            .font(.system(.headline, design: .rounded, weight: .semibold))
                                            .foregroundStyle(AppTheme.ink)
                                        Text(app.summary)
                                            .font(.system(.subheadline, design: .rounded))
                                            .foregroundStyle(AppTheme.slate)
                                            .lineLimit(2)
                                    }

                                    Spacer()

                                    TagChip(title: app.status.badgeText, isSelected: app.status == .ready)
                                }

                                HStack(spacing: 8) {
                                    TagChip(title: app.visibility.rawValue)
                                    TagChip(title: app.category.rawValue)
                                }

                                HStack(spacing: 10) {
                                    Button("Open") {
                                        appModel.selectedApp = app
                                    }
                                    .buttonStyle(CTAButtonStyle())

                                    Button("Edit") {
                                        appModel.createPrompt = "Update \(app.name): "
                                        appModel.selectedTab = .create
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
            .navigationTitle("Apps")
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            Image("BrandMark")
                .resizable()
                .scaledToFit()
                .frame(width: 34, height: 34)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            Spacer()

            if let syncError = appModel.syncError {
                Text(syncError)
                    .font(.system(.caption, design: .rounded))
                    .foregroundStyle(AppTheme.warning)
                    .lineLimit(1)
            } else {
                MetricPill(label: "Apps", value: "\(appModel.recentApps.count)")
            }
        }
    }

    private var filters: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                Button {
                    selectedFilter = nil
                } label: {
                    TagChip(title: "All", isSelected: selectedFilter == nil)
                }
                .buttonStyle(.plain)

                ForEach(AppVisibility.allCases) { visibility in
                    Button {
                        selectedFilter = visibility
                    } label: {
                        TagChip(title: visibility.rawValue, isSelected: selectedFilter == visibility)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var filteredApps: [MicroApp] {
        guard let selectedFilter else {
            return appModel.recentApps
        }

        return appModel.recentApps.filter { $0.visibility == selectedFilter }
    }
}
