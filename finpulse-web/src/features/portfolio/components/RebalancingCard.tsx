interface Props {
  suggestions: string[];
}

export default function RebalancingCard({
  suggestions,
}: Props) {
  return (
    <div className="rounded-3xl border p-6">

      <h2 className="text-xl font-bold mb-4">
        AI Rebalancing Suggestions
      </h2>

      <div className="space-y-3">

        {suggestions.map(
          (item, index) => (
            <div
              key={index}
              className="
              rounded-xl
              border
              p-3
              "
            >
              {item}
            </div>
          )
        )}

      </div>

    </div>
  );
}