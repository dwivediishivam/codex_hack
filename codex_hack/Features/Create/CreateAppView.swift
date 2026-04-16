import SwiftUI

struct CreateAppView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {
                    promptComposer
                    visibilityPanel
                    systemPromptPanel
                }
                .padding(20)
            }
            .background(AppTheme.background.ignoresSafeArea())
            .navigationTitle("Create")
        }
    }

    private var promptComposer: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Prompt",
                title: "Describe the micro app you want live",
                subtitle: "The generator will evaluate feasibility, choose the right template mode, and prepare a deployment-ready app."
            )

            TextEditor(text: $appModel.createPrompt)
                .frame(minHeight: 180)
                .padding(12)
                .scrollContentBackground(.hidden)
                .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 22, style: .continuous))

            HStack {
                ForEach(AppCategory.allCases) { category in
                    Button {
                        appModel.draftCategory = category
                    } label: {
                        TagChip(title: category.rawValue, isSelected: appModel.draftCategory == category)
                    }
                    .buttonStyle(.plain)
                }
            }
            .font(.caption)
            .frame(maxWidth: .infinity, alignment: .leading)
            .scrollClipDisabled()

            Button("Generate Micro App") {
                appModel.submitDraft()
            }
            .buttonStyle(CTAButtonStyle())
        }
    }

    private var visibilityPanel: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Scope",
                title: "Choose launch mode and audience",
                subtitle: "Private apps launch immediately, public apps enter review, org apps route into workspace governance."
            )

            VStack(alignment: .leading, spacing: 14) {
                Picker("Visibility", selection: $appModel.draftVisibility) {
                    ForEach(AppVisibility.allCases) { visibility in
                        Text(visibility.rawValue).tag(visibility)
                    }
                }
                .pickerStyle(.segmented)

                Text(appModel.draftVisibility.description)
                    .font(.footnote)
                    .foregroundStyle(AppTheme.slate)

                Picker("Audience", selection: $appModel.draftAudience) {
                    ForEach(BuildAudience.allCases) { audience in
                        Text(audience.rawValue).tag(audience)
                    }
                }
                .pickerStyle(.segmented)

                Picker("Generation Mode", selection: $appModel.generationMode) {
                    ForEach(GenerationMode.allCases) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
            }
        }
    }

    private var systemPromptPanel: some View {
        GlassCard {
            SectionTitle(
                eyebrow: "Generation Contract",
                title: "Fixed system prompt paired with the user prompt",
                subtitle: "This is the quality bar that should travel into the backend generation worker."
            )

            Text(GenerationPromptTemplate.systemPrompt)
                .font(.footnote.monospaced())
                .foregroundStyle(AppTheme.ink)
                .padding(14)
                .background(Color.white.opacity(0.7), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        }
    }
}
