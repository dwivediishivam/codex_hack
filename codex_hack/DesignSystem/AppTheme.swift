import SwiftUI

enum AppTheme {
    static let background = Color(red: 0.95, green: 0.97, blue: 0.99)
    static let backgroundAccent = Color(red: 0.88, green: 0.92, blue: 0.98)
    static let card = Color.white
    static let cardMuted = Color(red: 0.94, green: 0.96, blue: 0.99)
    static let ink = Color(red: 0.10, green: 0.14, blue: 0.20)
    static let slate = Color(red: 0.39, green: 0.46, blue: 0.56)
    static let line = Color(red: 0.85, green: 0.89, blue: 0.94)
    static let accent = Color(red: 0.14, green: 0.45, blue: 0.96)
    static let accentSoft = Color(red: 0.86, green: 0.92, blue: 1.0)
    static let success = Color(red: 0.17, green: 0.63, blue: 0.40)
    static let warning = Color(red: 0.90, green: 0.55, blue: 0.16)
    static let rose = Color(red: 0.86, green: 0.27, blue: 0.31)

    static let heroGradient = LinearGradient(
        colors: [
            Color(red: 0.20, green: 0.50, blue: 0.98),
            Color(red: 0.29, green: 0.60, blue: 1.0),
            Color(red: 0.63, green: 0.78, blue: 1.0)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
