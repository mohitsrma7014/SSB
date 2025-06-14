import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Format a date for Excel
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
};

// Export filtered data to Excel
export const exportFilteredData = (data, filters) => {
  const wb = XLSX.utils.book_new();
  
  // Format the data for Excel
  const excelData = data.map(item => ({
    'Component': item.component,
    'Part Name': item.part_name,
    'Customer': item.customer,
    'Status': item.running_status,
    'Material Grade': item.material_grade,
    'Slug Weight': item.slug_weight,
    'Drawing Number': item.drawing_number,
    'Forging Line': item.forging_line,
    'Created At': formatDate(item.created_at),
    'Updated At': formatDate(item.updated_at)
  }));
  
  const ws = XLSX.utils.json_to_sheet(excelData);
  XLSX.utils.book_append_sheet(wb, ws, "Filtered Components");
  
  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
  // Create filename based on filters
  let filename = 'NPD_Tracking';
  if (filters.running_status) filename += `_${filters.running_status}`;
  if (filters.component) filename += `_${filters.component}`;
  filename += '.xlsx';
  
  saveAs(blob, filename);
};

// Export single component details to Excel
export const exportComponentDetails = (component) => {
  const wb = XLSX.utils.book_new();
  
  // 1. Component Summary Sheet
  const summaryData = [
    ['Component', component.component_details?.component || ''],
    ['Part Name', component.component_details?.part_name || ''],
    ['Customer', component.component_details?.customer || ''],
    ['Status', component.component_details?.running_status || ''],
    ['Material Grade', component.component_details?.material_grade || ''],
    ['Slug Weight', component.component_details?.slug_weight || ''],
    ['Drawing Number', component.component_details?.drawing_number || ''],
    ['Forging Line', component.component_details?.forging_line || ''],
    ['Created At', formatDate(component.component_details?.created_at)],
    ['Updated At', formatDate(component.component_details?.updated_at)]
  ];
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Component Summary");
  
  // 2. Batch Tracking Sheet
  if (component.batch_tracking?.length > 0) {
    const batchData = component.batch_tracking.map(batch => ({
      'Batch Number': batch.batch_number,
      'Material Issued Date': formatDate(batch.material_issued_date),
      'Material Issued Qty': batch.material_issued_production,
      'Verified By': batch.verified_by,
      'Remarks': batch.remark
    }));
    
    const batchWs = XLSX.utils.json_to_sheet(batchData);
    XLSX.utils.book_append_sheet(wb, batchWs, "Batch Tracking");
  }
  
  // 3. Process Stages Sheets
  const stages = [
    { key: 'forging', name: 'Forging' },
    { key: 'heat_treatment', name: 'Heat Treatment' },
    { key: 'pre_machining', name: 'Pre Machining' },
    { key: 'cnc_machining', name: 'CNC Machining' },
    { key: 'marking', name: 'Marking' },
    { key: 'visual_inspection', name: 'Visual Inspection' },
    { key: 'final_inspection', name: 'Final Inspection' },
    { key: 'dispatch', name: 'Dispatch' }
  ];
  
  stages.forEach(stage => {
    if (component[stage.key]?.length > 0) {
      const stageData = component[stage.key].map(item => ({
        'Batch Number': item.batch_number,
        'Date': formatDate(item.date),
        'Production Qty': item.production,
        'Verified By': item.verified_by,
        'Setup': item.Setup,
        'Remarks': item.remark
      }));
      
      const stageWs = XLSX.utils.json_to_sheet(stageData);
      XLSX.utils.book_append_sheet(wb, stageWs, stage.name);
    }
  });
  
  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  const filename = `NPD_${component.component_details?.component || 'Component'}_Details.xlsx`;
  
  saveAs(blob, filename);
};