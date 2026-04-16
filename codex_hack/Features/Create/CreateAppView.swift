import SwiftUI

struct CreateAppView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    promptComposer
                    launchPanel
                    starterIdeas
                }
                .padding(20)
            }
            .background(ShellBackground())
            .navigationTitle("Build")
        }
    }

    private var promptComposer: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Prompt",
                title: "Describe one job the app should do well",
                subtitle: "Keep the scope narrow. Foundry works best when the app has one main task and a clear audience."
            )

            TextEditor(text: $appModel.createPrompt)
                .frame(minHeight: 160)
                .padding(12)
                .scrollContentBackground(.hidden)
                .background(AppTheme.cardMuted, in: RoundedRectangle(cornerRadius: 22, style: .continuous))

            Button("Start Build") {
                appModel.submitDraft()
            }
            .buttonStyle(CTAButtonStyle())
        }
    }

    private var launchPanel: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Launch",
                title: "Choose where the app should live",
                subtitle: "Private apps launch to your account, public apps enter review, and team apps stay inside one workspace."
            )

            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Visibility")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(AppTheme.slate)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(AppVisibility.allCases) { visibility in
                                Button {
                                    appModel.setDraftVisibility(visibility)
                                } label: {
                                    TagChip(title: visibility.rawValue, isSelected: appModel.draftVisibility == visibility)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }

                Text(appModel.draftVisibility.description)
                    .font(.footnote)
                    .foregroundStyle(AppTheme.slate)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Category")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(AppTheme.slate)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(AppCategory.allCases) { category in
                                Button {
                                    appModel.draftCategory = category
                                } label: {
                                    TagChip(title: category.rawValue, isSelected: appModel.draftCategory == category)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("Build mode")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(AppTheme.slate)

                    HStack(spacing: 8) {
                        ForEach(GenerationMode.allCases) { mode in
                            Button {
                                appModel.generationMode = mode
                            } label: {
                                TagChip(title: mode.rawValue, isSelected: appModel.generationMode == mode)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    private var starterIdeas: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Starters",
                title: "Use one of the sample prompts",
                subtitle: "These map directly to the four sample apps in the dashboard and store."
            )

            VStack(spacing: 10) {
                ForEach(appModel.starterPrompts, id: \.self) { prompt in
                    Button {
                        appModel.createPrompt = prompt
                    } label: {
                        HStack(alignment: .top) {
                            Text(prompt)
                                .font(.subheadline)
                                .foregroundStyle(AppTheme.ink)
                                .multilineTextAlignment(.leading)
                            Spacer()
                            Image(systemName: "arrow.up.left.and.arrow.down.right")
                                .foregroundStyle(AppTheme.slate)
                        }
                        .padding(14)
                        .background(AppTheme.cardMuted, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}
