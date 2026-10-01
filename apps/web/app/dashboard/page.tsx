import type { Metadata } from "next";
import { DashboardView } from "./dashboard-view";
import { loadDashboardData } from "./_lib/load-dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Tensorcraft",
  description:
    "Return to your mission, chart your voyage and revisit your discoveries.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const { dashboard } = await loadDashboardData();
  return <DashboardView {...dashboard} />;
}
