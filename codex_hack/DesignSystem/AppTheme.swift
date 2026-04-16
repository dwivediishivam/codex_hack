import SwiftUI

enum AppTheme {
    static let background = Color(red: 0.95, green: 0.94, blue: 0.91)
    static let backgroundAccent = Color(red: 0.90, green: 0.88, blue: 0.84)
    static let card = Color(red: 0.985, green: 0.982, blue: 0.974)
    static let cardMuted = Color(red: 0.962, green: 0.952, blue: 0.936)
    static let ink = Color(red: 0.10, green: 0.10, blue: 0.09)
    static let slate = Color(red: 0.41, green: 0.39, blue: 0.35)
    static let line = Color(red: 0.85, green: 0.82, blue: 0.77)
    static let accent = Color(red: 0.18, green: 0.21, blue: 0.18)
    static let accentSoft = Color(red: 0.87, green: 0.84, blue: 0.78)
    static let success = Color(red: 0.24, green: 0.45, blue: 0.30)
    static let warning = Color(red: 0.62, green: 0.41, blue: 0.18)
    static let rose = Color(red: 0.65, green: 0.29, blue: 0.28)

    static let heroGradient = LinearGradient(
        colors: [
            Color(red: 0.18, green: 0.18, blue: 0.17),
            Color(red: 0.28, green: 0.27, blue: 0.24),
            Color(red: 0.44, green: 0.40, blue: 0.33)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
