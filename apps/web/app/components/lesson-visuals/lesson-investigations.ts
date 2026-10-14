import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { FLOW_INVESTIGATIONS } from "./flow-investigations";
import type { LessonInvestigationSpec } from "./investigation-types";

export const LESSON_INVESTIGATIONS: Record<string, LessonInvestigationSpec> = {
  ...NUMERIC_INVESTIGATIONS,
  ...FLOW_INVESTIGATIONS,
};
