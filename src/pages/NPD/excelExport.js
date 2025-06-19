import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString();
};

const styleCell = (ws, cellAddress, style) => {
  if (!ws[cellAddress]) {
    ws[cellAddress] = { v: '', t: 's' };
  }
  ws[cellAddress].s = style;
};

const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const calculateBatchProgress = (component, batchNumber) => {
  const steps = [
    component.forging?.some(f => f.batch_number === batchNumber),
    component.heat_treatment?.some(ht => ht.batch_number === batchNumber),
    component.cnc_machining?.some(cnc => cnc.batch_number === batchNumber),
    component.final_inspection?.some(fi => fi.batch_number === batchNumber),
    component.dispatch?.some(d => d.batch_number === batchNumber)
  ];
  const completedSteps = steps.filter(Boolean).length;
  return Math.round((completedSteps / steps.length) * 100);
};

const getBatchProductionCount = (processData, batchNumber) => {
  const items = processData?.filter(item => item.batch_number === batchNumber);
  if (!items || items.length === 0) return '_';
  return items.reduce((sum, item) => sum + (item.production || 0), 0);
};

const applyWorksheetStyles = (ws, headers, customerName) => {
  // Style headers
  for (let c = 0; c < headers.length; c++) {
    const cell = XLSX.utils.encode_cell({ r: 0, c });
    styleCell(ws, cell, {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } }, // Dark blue header
      alignment: { horizontal: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    });
  }

  // Set column widths
  ws["!cols"] = [
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }
  ];

  // Add freeze pane for sticky headers and component names (freeze first row and first column)
  ws['!freeze'] = { xSplit: 1, ySplit: 1, topLeftCell: 'B2', activePane: 'bottomRight' };
};

const createCustomerSheet = (wb, customerName, customerData) => {
  const headers = [
    "Component",
    "Part Name", "Customer", "Status", "Material Grade", "Slug Weight", 
    "Total Batches", "Progress", "Batch ID", "Supplier", "Grade", 
    "Heat No", "Weight", "FORGING", "HEAT TREATMENT", "MACHINING", 
    "INSPECTION", "DISPATCH"
  ];
  
  const wsData = [headers];
  
  // Process each component for this customer
  customerData.forEach(component => {
    const batches = getAllBatches(component);
    const componentDetails = component.component_details || {};
    
    // Main component row
    const mainRow = [
      componentDetails.component || '',
      componentDetails.part_name || '',
      capitalizeFirstLetter(componentDetails.customer) || '',
      componentDetails.running_status || '',
      componentDetails.material_grade || '',
      componentDetails.slug_weight || '',
      batches.length,
      component.overallProgress + '%'
    ];

    // Style the component name cell (will be sticky)
    if (batches.length > 0) {
      // Add batches
      batches.forEach((batch, index) => {
        const batchRow = [...mainRow];
        
        // For subsequent batches, leave first columns empty
        if (index > 0) {
          batchRow[0] = '';
          batchRow[1] = '';
          batchRow[2] = '';
          batchRow[3] = '';
          batchRow[4] = '';
          batchRow[5] = '';
          batchRow[6] = '';
        }

        // Get raw material details for this batch
        const rawMaterial = component.blockmt?.find(rm => rm.block_mt_id === batch) || {};
        
        // Add batch details
        batchRow.push(
          `${batch}: ${calculateBatchProgress(component, batch)}%`,
          rawMaterial.supplier || '_',
          rawMaterial.grade || '_',
          rawMaterial.heatno || '_',
          rawMaterial.weight || '_',
          getBatchProductionCount(component.forging, batch),
          getBatchProductionCount(component.heat_treatment, batch),
          getBatchProductionCount(component.cnc_machining, batch),
          getBatchProductionCount(component.final_inspection, batch),
          getBatchProductionCount(component.dispatch, batch)
        );

        wsData.push(batchRow);
      });
    } else {
      // No batches case
      const noBatchRow = [...mainRow];
      noBatchRow.push(
        'No batch progress',
        '_', '_', '_', '_', 
        '_', '_', '_', '_', '_'
      );
      wsData.push(noBatchRow);
    }
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Apply styles
  applyWorksheetStyles(ws, headers, customerName);

  // Add alternating row colors
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let r = 1; r <= range.e.r; r++) {
    for (let c = 0; c <= range.e.c; c++) {
      const cell = XLSX.utils.encode_cell({ r, c });
      if (ws[cell]) {
        // Style for component rows (where batch data starts)
        if (c === 0 && ws[cell].v) {
          styleCell(ws, cell, {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "D9E1F2" } }, // Light blue for component names
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          });
        } else {
          // Alternate row colors for data rows
          const fillColor = r % 2 === 0 ? "FFFFFF" : "E9E9E9";
          styleCell(ws, cell, {
            fill: { fgColor: { rgb: fillColor } },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          });
        }
        
        // Style progress cells based on value
        if (c === 7 || (c === 8 && ws[cell].v && typeof ws[cell].v === 'string' && ws[cell].v.includes('%'))) {
          const progress = parseInt(ws[cell].v) || 0;
          let color = "FF0000"; // Red for < 50%
          if (progress >= 50 && progress < 80) color = "FFC000"; // Amber for 50-79%
          if (progress >= 80) color = "00B050"; // Green for 80%+
          
          styleCell(ws, cell, {
            font: { bold: true, color: { rgb: progress > 50 ? "FFFFFF" : "000000" } },
            fill: { fgColor: { rgb: color } }
          });
        }
      }
    }
  }

  // Add worksheet to workbook with customer name as sheet name
  const safeSheetName = customerName.replace(/[\\/*?:[\]]/g, '').substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName || 'Data');
};

export const exportFilteredData = (data, filters) => {
  try {
    const wb = XLSX.utils.book_new();
    
    // Group data by customer
    const customersData = {};
    data.forEach(component => {
      const customer = component.component_details?.customer || 'Other';
      const standardizedCustomer = capitalizeFirstLetter(customer);
      if (!customersData[standardizedCustomer]) {
        customersData[standardizedCustomer] = [];
      }
      customersData[standardizedCustomer].push(component);
    });

    // Create a sheet for each customer
    Object.entries(customersData).forEach(([customerName, customerData]) => {
      createCustomerSheet(wb, customerName, customerData);
    });

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    let filename = 'NPD_Tracking';
    if (filters.running_status) filename += `_${filters.running_status}`;
    if (filters.component) filename += `_${filters.component}`;
    filename += '.xlsx';
    
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

// Helper function to get all unique batch numbers
const getAllBatches = (component) => {
  const batches = new Set();
  
  // Add batches from all processes
  const processes = [
    'forging', 'heat_treatment', 'pre_machining', 
    'cnc_machining', 'marking', 'visual_inspection',
    'final_inspection', 'dispatch'
  ];
  
  processes.forEach(process => {
    if (component[process]) {
      component[process].forEach(item => {
        if (item.batch_number) batches.add(item.batch_number);
      });
    }
  });
  
  return Array.from(batches);
};