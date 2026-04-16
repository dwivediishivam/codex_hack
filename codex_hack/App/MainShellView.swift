import SwiftUI

struct MainShellView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        TabView(selection: $appModel.selectedTab) {
            DashboardView()
                .tabItem {
                    Label(MainTab.dashboard.title, systemImage: MainTab.dashboard.symbol)
                }
                .tag(MainTab.dashboard)

            CreateAppView()
                .tabItem {
                    Label(MainTab.create.title, systemImage: MainTab.create.symbol)
                }
                .tag(MainTab.create)

            ExploreAppsView()
                .tabItem {
                    Label(MainTab.explore.title, systemImage: MainTab.explore.symbol)
                }
                .tag(MainTab.explore)

            OrganizationsView()
                .tabItem {
                    Label(MainTab.organizations.title, systemImage: MainTab.organizations.symbol)
                }
                .tag(MainTab.organizations)

            ProfileView()
                .tabItem {
                    Label(MainTab.profile.title, systemImage: MainTab.profile.symbol)
                }
                .tag(MainTab.profile)
        }
        .tint(AppTheme.accent)
        .toolbarBackground(AppTheme.card, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
        .task {
            await appModel.loadRemoteStateIfNeeded()
        }
    }
}

#Preview {
    MainShellView()
        .environmentObject(AppModel())
}
