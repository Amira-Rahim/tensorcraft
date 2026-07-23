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
  ExerciseDataProvider,
  GlossaryTerm,
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
// Renamed on export: "getServerSnapshot" is too generic a name for this
// barrel (every useSyncExternalStore-backed hook has one); "Scheme" keeps it
// unambiguous alongside any future hook's own getServerSnapshot.
export {
  useScheme,
  getServerSnapshot as getSchemeServerSnapshot,
} from "./use-scheme";
export type { ColorScheme } from "./use-scheme";
