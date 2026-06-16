import { notFound } from "next/navigation";
import {
  businessTripStages,
  requireBusinessTripStage,
} from "@/business-trip/routes";
import { BusinessTripWorkspace } from "@/ui/components/business-trip-workspace/business-trip-workspace";

type BusinessTripStagePageProps = {
  params: Promise<{
    stage: string;
  }>;
};

export function generateStaticParams() {
  return businessTripStages.map((stage) => ({ stage }));
}

export default async function BusinessTripStagePage({
  params,
}: BusinessTripStagePageProps) {
  const { stage: stageParam } = await params;
  const stage = requireBusinessTripStage(stageParam);

  if (!stage) {
    notFound();
  }

  return <BusinessTripWorkspace routeStage={stage} />;
}
