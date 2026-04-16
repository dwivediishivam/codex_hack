import SwiftUI

struct GlassCard<Content: View>: View {
    var padding: CGFloat = 18
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            content
        }
        .padding(padding)
        .background(AppTheme.card, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(AppTheme.line, lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.03), radius: 16, x: 0, y: 8)
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
                .tracking(1.8)
                .foregroundStyle(AppTheme.slate)
            Text(title)
                .font(.system(.title2, design: .serif, weight: .semibold))
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
                .font(.system(.headline, design: .serif, weight: .semibold))
                .foregroundStyle(AppTheme.ink)
            Text(label)
                .font(.caption)
                .foregroundStyle(AppTheme.slate)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(AppTheme.cardMuted, in: Capsule())
        .overlay(Capsule().stroke(AppTheme.line, lineWidth: 1))
    }
}

struct TagChip: View {
    let title: String
    var isSelected = false

    var body: some View {
        Text(title)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(isSelected ? AppTheme.card : AppTheme.ink)
            .padding(.horizontal, 14)
            .padding(.vertical, 9)
            .background(isSelected ? AppTheme.accent : AppTheme.cardMuted, in: Capsule())
            .overlay(Capsule().stroke(isSelected ? AppTheme.accent : AppTheme.line, lineWidth: 1))
    }
}

struct AppProgressBar: View {
    let value: Double

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(AppTheme.cardMuted)
                Capsule()
                    .fill(AppTheme.accent)
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
            .foregroundStyle(prominent ? AppTheme.card : AppTheme.ink)
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity)
            .background(prominent ? AppTheme.accent : AppTheme.cardMuted, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(prominent ? AppTheme.accent : AppTheme.line, lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .opacity(configuration.isPressed ? 0.92 : 1)
    }
}

struct ShellBackground: View {
    var body: some View {
        ZStack {
            AppTheme.background
            Circle()
                .fill(AppTheme.backgroundAccent.opacity(0.5))
                .frame(width: 280, height: 280)
                .blur(radius: 24)
                .offset(x: 130, y: -240)
            Circle()
                .fill(Color.white.opacity(0.45))
                .frame(width: 220, height: 220)
                .blur(radius: 24)
                .offset(x: -140, y: -320)
        }
        .ignoresSafeArea()
    }
}
