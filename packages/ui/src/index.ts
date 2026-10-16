/**
 * @tensorcraft/ui - Shared component library
 *
 * Uses Framer Motion for animations, Tailwind for styling.
 */

// MDX lesson components
export {
  Dialogue,
  BridgeCallout,
  CodeBlock,
  DerivationDrawer,
  Exercise,
  ExerciseBrief,
  ExerciseDataProvider,
  GlossaryTerm,
  DocumentationLink,
  HintPanel,
  KeyTakeaways,
  LearningObjectives,
  LessonRecap,
  Quiz,
  SceneHeading,
  LessonPrefsProvider,
} from "./mdx";
export type { ExerciseData, ExerciseSubmitResult, LessonPrefs } from "./mdx";
export { CharacterAvatar } from "./character-avatar";
export { AnimatedAvatar } from "./animated-avatar";
export type { AnimatedAvatarProps } from "./animated-avatar";
export { ScenePortrait } from "./scene-portrait";
export type { ScenePortraitProps } from "./scene-portrait";
export { ArtPlate } from "./art-plate";
export type { ArtPlateProps } from "./art-plate";
// Renamed on export: "getServerSnapshot" is too generic a name for this
// barrel (every useSyncExternalStore-backed hook has one); "Scheme" keeps it
// unambiguous alongside any future hook's own getServerSnapshot.
export {
  useScheme,
  getServerSnapshot as getSchemeServerSnapshot,
} from "./use-scheme";
export type { ColorScheme } from "./use-scheme";
export { AnswerFeedback } from "./answer-feedback";
