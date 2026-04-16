import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        Group {
            if appModel.session.isAuthenticated {
                MainShellView()
            } else {
                AuthView()
            }
        }
        .background(ShellBackground())
        .onOpenURL { url in
            Task {
                await appModel.handleIncomingURL(url)
            }
        }
        .sheet(item: $appModel.selectedApp) { app in
            AppDetailView(app: app)
                .environmentObject(appModel)
                .presentationDetents([.large])
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AppModel())
}
