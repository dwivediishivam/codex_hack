import SwiftUI
import WebKit

struct MicroAppViewer: View {
    let url: URL?

    var body: some View {
        NavigationStack {
            Group {
                if let url {
                    EmbeddedWebView(url: url)
                } else {
                    ContentUnavailableView("No Deployment URL", systemImage: "network.slash", description: Text("This app does not have a live deployment yet."))
                }
            }
            .navigationTitle("Live App")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct EmbeddedWebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.allowsBackForwardNavigationGestures = true
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if webView.url != url {
            webView.load(URLRequest(url: url))
        }
    }
}
