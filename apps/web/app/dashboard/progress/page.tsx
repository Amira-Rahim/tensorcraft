import type { Metadata } from "next";
import { loadDashboardData } from "../_lib/load-dashboard";
import { ProgressView } from "./progress-view";
export const metadata: Metadata = {
  title: "Progress | Tensorcraft",
};
export default async function ProgressPage() {
  const { dashboard, evidenceUnavailable } =
    await loadDashboardData("progress");
  return (
    <ProgressView {...dashboard} recordsUnavailable={evidenceUnavailable} />
  );
}
