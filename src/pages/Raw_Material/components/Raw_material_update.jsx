import React, { useState } from "react";
import RawMaterialList from "./RawMaterialList";
import RawMaterialDetail from "./RawMaterialDetail";

const App = () => {
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: null,
    supplier: '',
    grade: '',
    dia: '',
    invoice_no: '',
    heatno: '',
    type_of_material: '',
    approval_status: '',
    rack_no: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const handleSelectMaterial = (id, currentFilters, currentPagination) => {
    // Save current filters and pagination when going to detail view
    setFilters(currentFilters);
    setPagination(currentPagination);
    setSelectedMaterialId(id);
  };

  const handleBackToList = () => {
    // Keep the existing filters and pagination when going back
    setSelectedMaterialId(null);
  };

  return (
    <div>
      {selectedMaterialId ? (
        <RawMaterialDetail
          materialId={selectedMaterialId}
          onBack={handleBackToList}
        />
      ) : (
        <RawMaterialList 
          onSelectMaterial={handleSelectMaterial}
          initialFilters={filters}
          initialPagination={pagination}
          onFiltersChange={setFilters}
          onPaginationChange={setPagination}
        />
      )}
    </div>
  );
};

export default App;