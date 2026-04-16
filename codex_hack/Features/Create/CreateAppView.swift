import SwiftUI

struct CreateAppView: View {
    @EnvironmentObject private var appModel: AppModel

    var body: some View {
        NavigationStack {
            VStack(spacing: 18) {
                Spacer()

                GlassCard(padding: 22) {
                    VStack(spacing: 16) {
                        TextEditor(text: $appModel.createPrompt)
                            .frame(minHeight: 220)
                            .padding(10)
                            .scrollContentBackground(.hidden)
                            .background(AppTheme.cardMuted, in: RoundedRectangle(cornerRadius: 18, style: .continuous))

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

                        HStack(spacing: 8) {
                            ForEach(AppCategory.allCases.filter { $0 != .dashboard }) { category in
                                Button {
                                    appModel.draftCategory = category
                                } label: {
                                    TagChip(title: category.rawValue, isSelected: appModel.draftCategory == category)
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        Button("Create") {
                            Task {
                                await appModel.submitDraft()
                            }
                        }
                        .buttonStyle(CTAButtonStyle())
                    }
                }
                .padding(.horizontal, 20)

                Spacer()
            }
            .background(ShellBackground())
            .navigationTitle("Create")
        }
    }
}
