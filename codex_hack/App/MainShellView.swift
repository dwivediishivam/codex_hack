import SwiftUI

struct MainShellView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        TabView(selection: $appModel.selectedTab) {
            CreateAppView()
                .tabItem {
                    Label(MainTab.create.title, systemImage: MainTab.create.symbol)
                }
                .tag(MainTab.create)

            DashboardView()
                .tabItem {
                    Label(MainTab.apps.title, systemImage: MainTab.apps.symbol)
                }
                .tag(MainTab.apps)

            OrganizationsView()
                .tabItem {
                    Label(MainTab.instructions.title, systemImage: MainTab.instructions.symbol)
                }
                .tag(MainTab.instructions)

            ExploreAppsView()
                .tabItem {
                    Label(MainTab.store.title, systemImage: MainTab.store.symbol)
                }
                .tag(MainTab.store)

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
