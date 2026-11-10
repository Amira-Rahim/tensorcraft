import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { FLOW_INVESTIGATIONS } from "./flow-investigations";
import type { LessonInvestigationSpec } from "./investigation-types";
import { withInvestigationSourceContexts } from "./investigation-source-context";

export const LESSON_INVESTIGATIONS: Record<string, LessonInvestigationSpec> =
  withInvestigationSourceContexts({
    ...NUMERIC_INVESTIGATIONS,
    ...FLOW_INVESTIGATIONS,
  });
