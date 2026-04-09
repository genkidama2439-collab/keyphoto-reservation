import Link from "next/link";
import { Plan } from "@/types";

function formatPrice(price: number) {
  return `¥${price.toLocaleString()}`;
}

export default function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Link
      href={`/plan/${plan.id}`}
      className="block rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-[#c9a84c]/50 hover:bg-white/10"
    >
      <div className="mb-2 inline-block rounded-full bg-[#c9a84c]/20 px-3 py-0.5 text-xs font-semibold text-[#c9a84c]">
        {plan.tag}
      </div>
      <h3 className="mb-1 text-lg font-bold text-white">{plan.name}</h3>
      <p className="mb-3 text-sm text-white/60">{plan.catchCopy}</p>
      <div className="flex items-baseline gap-2">
        {plan.priceLabel ? (
          <span className="text-lg font-bold text-[#c9a84c]">{plan.priceLabel}</span>
        ) : (
          <>
            <span className="text-lg font-bold text-[#c9a84c]">
              {formatPrice(plan.priceAdult)}
              <span className="text-sm font-normal">/人</span>
            </span>
            {plan.priceChild !== undefined && (
              <span className="text-sm text-white/50">
                子供 {formatPrice(plan.priceChild)}/人
              </span>
            )}
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-white/40">撮影時間: {plan.duration}</p>
    </Link>
  );
}
