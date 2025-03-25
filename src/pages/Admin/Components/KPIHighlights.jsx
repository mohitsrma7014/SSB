import { useMemo } from "react";
import { motion } from "framer-motion";

const KPIHighlights = ({ data = [] }) => {
  const safeData = Array.isArray(data) ? data : [];

  const {
    totalPieces,
    totalWeight,
    totalDispatched,
    totalBalance,
    dispatchedTonnage,
    remainingTonnage,
  } = useMemo(() => {
    return safeData.reduce(
      (totals, item) => {
        const pieces = Number(item.pices) || 0;
        const weight = Number.parseFloat(item.weight) || 0;
        const dispatched = Number(item.dispatched) || 0;
        const balance = Math.max(0, pieces - dispatched); // Ensure balance doesn't go negative
        const slugWeight = Number.parseFloat(item.slug_weight) || 0;

        return {
          totalPieces: totals.totalPieces + pieces,
          totalWeight: totals.totalWeight + weight,
          totalDispatched: totals.totalDispatched + dispatched,
          totalBalance: totals.totalBalance + balance,
          dispatchedTonnage: totals.dispatchedTonnage + dispatched * slugWeight,
          remainingTonnage: totals.remainingTonnage + balance * slugWeight,
        };
      },
      {
        totalPieces: 0,
        totalWeight: 0,
        totalDispatched: 0,
        totalBalance: 0,
        dispatchedTonnage: 0,
        remainingTonnage: 0,
      }
    );
  }, [safeData]);

  // Formatting functions
  const formatTons = (value) => (value / 1000).toFixed(2);
  const formatPercentage = (value) => (value * 100).toFixed(2);

  const weightInTons = formatTons(totalWeight);
  const dispatchedTonnageInTons = formatTons(dispatchedTonnage);
  const remainingTonnageInTons = formatTons(remainingTonnage);
  const deliveryRating = totalPieces > 0 
    ? formatPercentage(totalDispatched / totalPieces) 
    : "0.00";

  // Verify that remaining doesn't exceed total (data sanity check)
  const verifiedRemainingPieces = Math.min(totalBalance, totalPieces);
  const verifiedRemainingTonnage = Math.min(remainingTonnage, totalWeight);

  const kpis = [
    { 
      title: "Total Schedule", 
      value: `${totalPieces.toLocaleString()} Pcs. / ${weightInTons} Tons`,
      description: "Total planned production"
    },
    { 
      title: "Dispatched", 
      value: `${totalDispatched.toLocaleString()} Pcs. / ${dispatchedTonnageInTons} Tons`,
      description: "Completed and shipped items"
    },
    { 
      title: "Remaining", 
      value: `${verifiedRemainingPieces.toLocaleString()} Pcs. / ${formatTons(verifiedRemainingTonnage)} Tons`,
      description: "Pending items to be dispatched"
    },
    { 
      title: "Overall Delivery Rating", 
      value: `${deliveryRating}%`,
      description: `Percentage of dispatched items (${totalDispatched} of ${totalPieces})`
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-black justify-center items-center text-center mt-4">
      {kpis.map((kpi, index) => (
        <motion.div
          key={index}
          className="p-4 rounded-lg shadow-md bg-white border border-gray-300 flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          title={kpi.description} // Tooltip with description
        >
          <h2 className="text-base font-semibold mb-1 text-gray-700">{kpi.title}</h2>
          <p className="text-xl font-medium text-gray-900">{kpi.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default KPIHighlights;