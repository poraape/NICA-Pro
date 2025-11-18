interface InsightCardProps {
  message: string;
}

export function InsightCard({ message }: InsightCardProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow">
      <p className="text-sm text-slate-700">{message}</p>
    </div>
  );
}
