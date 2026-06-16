import { redirect } from "next/navigation";
import { businessTripStagePath } from "@/business-trip/routes";

export default function BusinessTripIndexPage() {
  redirect(businessTripStagePath("requirements"));
}
