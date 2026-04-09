import PlanCard from "@/components/PlanCard";
import { plans } from "@/data/plans";

export default function Home() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-white">
          星空フォトツアー
        </h1>
        <p className="text-sm text-white/60">
          宮古島の満天の星空の下で、特別な一枚を
        </p>
      </div>
      <div className="space-y-4">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
