import ModulePlaceholder from "@/components/hrm/ModulePlaceholder";
import { getModuleBySlug } from "@/components/hrm/hrmNavigation";

export default async function HrmModulePage({ params }) {
  const { module: moduleSlug } = await params;
  const module = getModuleBySlug(moduleSlug);
  return <ModulePlaceholder title={module?.label || "HRM Module"} description={module?.description} />;
}
