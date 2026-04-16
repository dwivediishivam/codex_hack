import SwiftUI

struct GlassCard<Content: View>: View {
    var padding: CGFloat = 20
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            content
        }
        .padding(padding)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(AppTheme.line, lineWidth: 1)
        )
    }
}

struct SectionTitle: View {
    let eyebrow: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(eyebrow.uppercased())
                .font(.caption.weight(.semibold))
                .tracking(1.6)
                .foregroundStyle(AppTheme.accent)
            Text(title)
                .font(.system(.title2, design: .rounded, weight: .bold))
                .foregroundStyle(AppTheme.ink)
            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(AppTheme.slate)
        }
    }
}

struct MetricPill: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(.headline, design: .rounded, weight: .bold))
                .foregroundStyle(AppTheme.ink)
            Text(label)
                .font(.caption)
                .foregroundStyle(AppTheme.slate)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.7), in: Capsule())
    }
}

struct TagChip: View {
    let title: String
    var isSelected = false

    var body: some View {
        Text(title)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(isSelected ? Color.white : AppTheme.ink)
            .padding(.horizontal, 14)
            .padding(.vertical, 9)
            .background(isSelected ? AppTheme.ink : Color.white.opacity(0.65), in: Capsule())
    }
}

struct AppProgressBar: View {
    let value: Double

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color.white.opacity(0.45))
                Capsule()
                    .fill(AppTheme.heroGradient)
                    .frame(width: proxy.size.width * max(0, min(value, 1)))
            }
        }
        .frame(height: 9)
    }
}

struct CTAButtonStyle: ButtonStyle {
    var prominent = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline.weight(.semibold))
            .foregroundStyle(prominent ? Color.white : AppTheme.ink)
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity)
            .background(prominent ? AppTheme.ink : Color.white.opacity(0.7), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .opacity(configuration.isPressed ? 0.92 : 1)
    }
}
