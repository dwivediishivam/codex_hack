import SwiftUI

enum AppTheme {
    static let accent = Color(red: 0.06, green: 0.64, blue: 0.58)
    static let accentBright = Color(red: 0.19, green: 0.84, blue: 0.72)
    static let ink = Color(red: 0.07, green: 0.10, blue: 0.16)
    static let slate = Color(red: 0.27, green: 0.31, blue: 0.38)
    static let card = Color.white.opacity(0.78)
    static let line = Color.white.opacity(0.18)
    static let warm = Color(red: 0.98, green: 0.74, blue: 0.42)
    static let rose = Color(red: 0.90, green: 0.42, blue: 0.50)

    static let background = LinearGradient(
        colors: [
            Color(red: 0.95, green: 0.98, blue: 0.96),
            Color(red: 0.88, green: 0.95, blue: 0.92),
            Color(red: 0.81, green: 0.90, blue: 0.90)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let heroGradient = LinearGradient(
        colors: [ink, Color(red: 0.10, green: 0.38, blue: 0.35), accent],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
