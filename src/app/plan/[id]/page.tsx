import Link from "next/link";
import { notFound } from "next/navigation";
import { plans, transferOption } from "@/data/plans";

function formatPrice(price: number) {
  return `¥${price.toLocaleString()}`;
}

export function generateStaticParams() {
  return plans.map((plan) => ({ id: plan.id }));
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = plans.find((p) => p.id === id);
  if (!plan) notFound();

  return (
    <div>
      <div className="mb-6">
        <div className="mb-3 inline-block rounded-full bg-[#c9a84c]/20 px-3 py-1 text-xs font-semibold text-[#c9a84c]">
          {plan.tag}
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">{plan.name}</h1>
        <p className="text-white/60">{plan.catchCopy}</p>
      </div>

      <div className="mb-6 space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
        {/* 料金 */}
        <div>
          <h2 className="mb-2 text-sm font-medium text-white/50">料金</h2>
          {plan.priceLabel ? (
            <p className="text-xl font-bold text-[#c9a84c]">{plan.priceLabel}</p>
          ) : (
            <div className="space-y-1">
              <p className="text-xl font-bold text-[#c9a84c]">
                大人 {formatPrice(plan.priceAdult)}
                <span className="text-sm font-normal">/人</span>
              </p>
              {plan.priceChild !== undefined && (
                <p className="text-base text-white/70">
                  子供(15〜0才) {formatPrice(plan.priceChild)}
                  <span className="text-sm">/人</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* 撮影時間 */}
        <div>
          <h2 className="mb-1 text-sm font-medium text-white/50">撮影時間</h2>
          <p className="text-white">{plan.duration}</p>
        </div>

        {/* 含まれるもの */}
        <div>
          <h2 className="mb-2 text-sm font-medium text-white/50">含まれるもの</h2>
          <ul className="space-y-1">
            {plan.includes.map((item) => (
              <li key={item} className="flex items-center gap-2 text-white/80">
                <span className="text-[#c9a84c]">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 注意事項 */}
        {plan.notes && plan.notes.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-white/50">注意事項</h2>
            {plan.notes.map((note) => (
              <p key={note} className="text-sm text-white/60">
                ※ {note}
              </p>
            ))}
          </div>
        )}

        {/* 送迎オプション */}
        {!plan.hideTransfer && (
          <div className="border-t border-white/10 pt-4">
            <p className="text-sm text-white/60">
              オプション: 送迎 {formatPrice(transferOption.price)}（{transferOption.maxPersons}名まで）
            </p>
          </div>
        )}
      </div>

      <Link
        href={`/booking?plan=${plan.id}`}
        className="block w-full rounded-lg bg-[#c9a84c] py-4 text-center text-base font-bold text-[#0a1628] transition hover:bg-[#d4b85e] active:scale-[0.98]"
      >
        このプランで予約する
      </Link>

      <Link
        href="/"
        className="mt-4 block text-center text-sm text-white/50 hover:text-white/70"
      >
        プラン一覧に戻る
      </Link>
    </div>
  );
}
