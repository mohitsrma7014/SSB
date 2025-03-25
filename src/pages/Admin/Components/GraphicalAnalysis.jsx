import { useState, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const GraphicalAnalysis = ({ data = [] }) => {
  const safeData = Array.isArray(data) ? data : [];

  // Utility function to truncate long labels
  const truncateLabel = (label, maxLength = 10) => {
    return label.length > maxLength ? `${label.substring(0, maxLength)}...` : label;
  };

  // First Graph: Customer & Location-wise Tonnage
  const customerTonnageOptions = useMemo(() => {
    const customerMap = {};

    safeData.forEach(({ customer, weight, pices }) => {
      if (!customerMap[customer]) {
        customerMap[customer] = { tonnage: 0, pices: 0 };
      }

      customerMap[customer].tonnage += (parseFloat(weight) || 0) / 1000;
      customerMap[customer].pices += parseInt(pices) || 0;
    });

    // Convert customerMap to array & sort in descending order by tonnage
    const sortedData = Object.entries(customerMap)
      .map(([customer, { tonnage, pices }]) => ({
        name: customer,
        y: parseFloat(tonnage.toFixed(2)),
        pices: pices
      }))
      .sort((a, b) => b.y - a.y);

    return {
      chart: { 
        type: "bar",
        backgroundColor: "transparent",
        style: { fontFamily: "'Inter', sans-serif" },
        height: '400px' // Fixed height for consistency
      },
      title: { 
        text: "Customer-wise Tonnage & Pieces", 
        style: { 
          color: "#2D3748", 
          fontSize: "16px", 
          fontWeight: 600,
          fontFamily: "'Inter', sans-serif"
        },
        align: 'left',
        margin: 30
      },
      xAxis: { 
        type: "category",
        labels: { 
          style: { 
            color: "#4A5568", 
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif"
          },
          formatter: function() {
            return truncateLabel(this.value);
          },
          rotation: -45 // Rotate labels for better fit
        },
        lineColor: '#E2E8F0',
        tickLength: 0
      },
      yAxis: { 
        title: { 
          text: "Tons", 
          style: { 
            color: "#4A5568", 
            fontSize: "12px",
            fontFamily: "'Inter', sans-serif"
          } 
        },
        labels: { 
          style: { 
            color: "#718096", 
            fontSize: "11px",
            fontFamily: "'Inter', sans-serif"
          } 
        },
        gridLineColor: '#EDF2F7',
        lineWidth: 1,
        lineColor: '#E2E8F0'
      },
      series: [{ 
        name: "Tons", 
        data: sortedData,
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
          stops: [
            [0, "#4299E1"],  // Blue-400
            [1, "#90CDF4"]   // Blue-300
          ]
        }
      }],
      tooltip: { 
        formatter: function () {
          return `<div style="font-family: 'Inter', sans-serif">
                    <div style="font-size: 14px; font-weight: 600; color: #2D3748; margin-bottom: 8px">${this.point.name}</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px">
                      <span style="color: #718096">Tonnage:</span>
                      <span style="font-weight: 600; color: #2D3748">${this.point.y.toFixed(2)} Tons</span>
                    </div>
                    <div style="display: flex; justify-content: space-between">
                      <span style="color: #718096">Pieces:</span>
                      <span style="font-weight: 600; color: #2D3748">${this.point.pices}</span>
                    </div>
                  </div>`;
        },
        backgroundColor: "#FFFFFF",
        borderColor: "#E2E8F0",
        borderRadius: 8,
        shadow: true,
        style: { 
          fontFamily: "'Inter', sans-serif"
        },
        useHTML: true
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          pointWidth: 20, // Fixed width for bars
          dataLabels: { 
            enabled: true, 
            style: { 
              fontSize: "11px", 
              color: "#4A5568",
              textOutline: 'none',
              fontFamily: "'Inter', sans-serif"
            },
            formatter: function() {
              return `${this.y.toFixed(1)}T`;
            }
          }
        }
      },
      credits: { enabled: false },
      legend: {
        enabled: false
      }
    };
  }, [safeData]);

  // Second Graph: Delivery Rating (Grouped by Customer & Location)
  const deliveryRatingOptions = useMemo(() => {
    const deliveryMap = {};
  
    safeData.forEach(({ customer, location, total_schedule_pices, dispatched, weight, slug_weight }) => {
      const key = `${customer}  ${location}`;
      if (!deliveryMap[key]) {
        deliveryMap[key] = { total: 0, dispatched: 0, totalWeight: 0, dispatchedWeight: 0 };
      }
      
      deliveryMap[key].total += total_schedule_pices || 0;
      deliveryMap[key].dispatched += dispatched || 0;
      deliveryMap[key].totalWeight += parseFloat(weight) || 0;
      
      if (dispatched > 0 && slug_weight) {
        deliveryMap[key].dispatchedWeight += (dispatched * parseFloat(slug_weight)) / 1000;
      }
    });
  
    let categories = Object.keys(deliveryMap);
    let data = categories.map((key) => ({
      categoryLabel: key,
      y: deliveryMap[key].total ? (deliveryMap[key].dispatched / deliveryMap[key].total) * 100 : 0, 
      totalPices: deliveryMap[key].total,
      dispatchedPices: deliveryMap[key].dispatched,
      scheduledTonnage: (deliveryMap[key].totalWeight / 1000).toFixed(2),
      dispatchedTonnage: deliveryMap[key].dispatchedWeight.toFixed(2),
    }));
  
    // Sort data in descending order based on delivery rating percentage
    data.sort((a, b) => b.y - a.y);
    
    // Extract sorted categories (truncated for display)
    categories = data.map(item => truncateLabel(item.categoryLabel, 10));
  
    return {
      chart: { 
        type: "column", 
        backgroundColor: "transparent",
        style: { fontFamily: "'Inter', sans-serif" },
        height: '400px'
      },
      title: { 
        text: "Delivery Rating (by Customer & Location)",
        style: { 
          fontSize: "16px", 
          fontWeight: 600, 
          color: "#2D3748",
          fontFamily: "'Inter', sans-serif"
        },
        align: 'left',
        margin: 30
      },
      xAxis: { 
        categories,
        labels: { 
          style: { 
            fontSize: "14px", 
            color: "#4A5568",
            fontFamily: "'Inter', sans-serif"
          },
          rotation: -45
        },
        lineColor: '#E2E8F0',
        tickLength: 0
      },
      yAxis: { 
        title: { 
          text: "Delivery Rating (%)", 
          style: { 
            fontSize: "12px", 
            color: "#4A5568",
            fontFamily: "'Inter', sans-serif"
          } 
        },
        gridLineColor: "#EDF2F7",
        lineWidth: 1,
        lineColor: '#E2E8F0',
        labels: { 
          style: { 
            color: "#718096", 
            fontSize: "11px",
            fontFamily: "'Inter', sans-serif"
          } 
        },
        max: 100 // Set max to 100% for percentage
      },
      tooltip: {
        backgroundColor: "#FFFFFF",
        borderColor: "#E2E8F0",
        borderRadius: 8,
        shadow: true,
        useHTML: true,
        style: { fontFamily: "'Inter', sans-serif" },
        formatter: function () {
          return `<div style="font-family: 'Inter', sans-serif">
                    <div style="font-size: 14px; font-weight: 600; color: #2D3748; margin-bottom: 12px">${this.point.categoryLabel}</div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px">
                      <span style="color: #718096">Delivery Rating:</span>
                      <span style="font-weight: 600; color: #2B6CB0">${this.y.toFixed(2)}%</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px">
                      <span style="color: #718096">Scheduled Pieces:</span>
                      <span style="font-weight: 600; color: #2D3748">${this.point.totalPices}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px">
                      <span style="color: #718096">Dispatched Pieces:</span>
                      <span style="font-weight: 600; color: #2D3748">${this.point.dispatchedPices}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px">
                      <span style="color: #718096">Scheduled Tonnage:</span>
                      <span style="font-weight: 600; color: #2D3748">${this.point.scheduledTonnage} T</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between">
                      <span style="color: #718096">Dispatched Tonnage:</span>
                      <span style="font-weight: 600; color: #2D3748">${this.point.dispatchedTonnage} T</span>
                    </div>
                  </div>`;
        }
      },
      plotOptions: {
        column: {
          borderRadius: 4,
          pointWidth: 20,
          dataLabels: {
            enabled: true,
            format: "{y:.1f}%",
            style: { 
              fontSize: "11px", 
              fontWeight: "normal", 
              color: "#4A5568",
              textOutline: 'none',
              fontFamily: "'Inter', sans-serif"
            }
          },
          
        }
      },
      series: [{
        name: "Customer",
        data
      }],
      credits: { enabled: false },
      legend: {
        enabled: false
      }
    };
  }, [safeData]);
  
  const [gradeFilter, setGradeFilter] = useState("");

  // Extract unique grades
  const allGrades = useMemo(
    () => [...new Set(safeData.map(({ grade }) => grade))],
    [safeData]
  );

  // Filter grades based on user input
  const filteredGrades = useMemo(() => {
    return allGrades.filter((grade) =>
      grade.toLowerCase().includes(gradeFilter.toLowerCase())
    );
  }, [allGrades, gradeFilter]);

  // Grade-wise Tonnage Chart
  const gradeTonnageOptions = useMemo(() => {
    const gradeMap = {};

    safeData.forEach(({ grade, weight }) => {
      gradeMap[grade] = parseFloat(
        ((gradeMap[grade] || 0) + (parseFloat(weight) || 0) / 1000).toFixed(2)
      );
    });

    let sortedEntries = Object.entries(gradeMap).sort((a, b) => b[1] - a[1]);

    if (gradeFilter) {
      sortedEntries = sortedEntries.filter(([grade]) =>
        grade.toLowerCase().includes(gradeFilter.toLowerCase())
      );
    }

    return {
      chart: { 
        type: "column", 
        backgroundColor: "transparent", 
        animation: true,
        style: { fontFamily: "'Inter', sans-serif" },
        height: '400px'
      },
      title: {
        text: "Grade-wise Tonnage Distribution",
        style: { 
          fontSize: "16px", 
          fontWeight: 600, 
          color: "#2D3748",
          fontFamily: "'Inter', sans-serif"
        },
        align: 'left',
        margin: 30
      },
      xAxis: {
        categories: sortedEntries.map(([grade]) => truncateLabel(grade, 15)),
        labels: { 
          style: { 
            fontSize: "14px", 
            color: "#4A5568",
            fontFamily: "'Inter', sans-serif"
          },
          rotation: -45
        },
        lineColor: '#E2E8F0',
        tickLength: 0
      },
      yAxis: {
        title: { 
          text: "Tonnes", 
          style: { 
            fontSize: "12px", 
            color: "#4A5568",
            fontFamily: "'Inter', sans-serif"
          } 
        },
        gridLineColor: "#EDF2F7",
        lineWidth: 1,
        lineColor: '#E2E8F0',
        labels: { 
          style: { 
            color: "#718096", 
            fontSize: "11px",
            fontFamily: "'Inter', sans-serif"
          } 
        }
      },
      series: [
        {
          name: "Grade",
          data: sortedEntries.map(([, tonnage]) => tonnage),
          color: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, "#38B2AC"],  // Teal-400
              [1, "#81E6D9"]   // Teal-300
            ]
          }
        }
      ],
      plotOptions: {
        column: {
          borderRadius: 4,
          pointWidth: 20,
          dataLabels: {
            enabled: true,
            format: "{y:.1f}T",
            style: { 
              fontSize: "11px", 
              fontWeight: "normal", 
              color: "#4A5568",
              textOutline: 'none',
              fontFamily: "'Inter', sans-serif"
            }
          }
        }
      },
      tooltip: {
        backgroundColor: "#FFFFFF",
        borderColor: "#E2E8F0",
        borderRadius: 8,
        shadow: true,
        useHTML: true,
        style: { fontFamily: "'Inter', sans-serif" },
        formatter: function() {
          return `<div style="font-family: 'Inter', sans-serif">
                    <div style="font-size: 14px; font-weight: 600; color: #2D3748; margin-bottom: 8px">${this.point.category || this.series.name}</div>
                    <div style="display: flex; justify-content: space-between">
                      <span style="color: #718096">Tonnage:</span>
                      <span style="font-weight: 600; color: #2D3748">${this.y.toFixed(2)} Tons</span>
                    </div>
                  </div>`;
        }
      },
      credits: { enabled: false },
      legend: {
        enabled: false
      }
    };
  }, [safeData, gradeFilter]);

  // Grade & Diameter-wise Tonnage Chart
  const gradeDiaTonnageOptions = useMemo(() => {
    const gradeDiaMap = {};

    safeData.forEach(({ grade, dia, weight }) => {
      const key = `${grade} - Dia ${dia}`;
      gradeDiaMap[key] =
        (gradeDiaMap[key] || 0) + parseFloat(weight) / 1000;
    });

    Object.keys(gradeDiaMap).forEach((key) => {
      gradeDiaMap[key] = parseFloat(gradeDiaMap[key].toFixed(2));
    });

    let sortedEntries = Object.entries(gradeDiaMap).sort((a, b) => b[1] - a[1]);

    if (gradeFilter) {
      sortedEntries = sortedEntries.filter(([key]) =>
        key.toLowerCase().includes(gradeFilter.toLowerCase())
      );
    }

    return {
      chart: { 
        type: "column", 
        backgroundColor: "transparent", 
        animation: true,
        style: { fontFamily: "'Inter', sans-serif" },
        height: '500px'
      },
      title: {
        text: "Grade & Diameter-wise Tonnage Distribution",
        style: { 
          fontSize: "16px", 
          fontWeight: 600, 
          color: "#2D3748",
          fontFamily: "'Inter', sans-serif"
        },
        align: 'left',
        margin: 30
      },
      xAxis: {
        categories: sortedEntries.map(([key]) => truncateLabel(key, 20)),
        labels: { 
          style: { 
            fontSize: "14px", 
            color: "#4A5568",
            fontFamily: "'Inter', sans-serif"
          },
          rotation: -45
        },
        lineColor: '#E2E8F0',
        tickLength: 0
      },
      yAxis: {
        title: { 
          text: "Tonnage", 
          style: { 
            fontSize: "12px", 
            color: "#4A5568",
            fontFamily: "'Inter', sans-serif"
          } 
        },
        gridLineColor: "#EDF2F7",
        lineWidth: 1,
        lineColor: '#E2E8F0',
        labels: { 
          style: { 
            color: "#718096", 
            fontSize: "11px",
            fontFamily: "'Inter', sans-serif"
          } 
        }
      },
      series: [
        {
          name: "Tonnage",
          data: sortedEntries.map(([, tonnage]) => tonnage),
          color: {
            linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
            stops: [
              [0, "#48BB78"],  // Green-400
              [1, "#9AE6B4"]    // Green-300
            ]
          }
        }
      ],
      plotOptions: {
        bar: {
          borderRadius: 4,
          pointWidth: 20,
          dataLabels: {
            enabled: true,
            format: "{y:.1f}T",
            style: { 
              fontSize: "11px", 
              fontWeight: "normal", 
              color: "#4A5568",
              textOutline: 'none',
              fontFamily: "'Inter', sans-serif"
            }
          }
        }
      },
      tooltip: {
        backgroundColor: "#FFFFFF",
        borderColor: "#E2E8F0",
        borderRadius: 8,
        shadow: true,
        useHTML: true,
        style: { fontFamily: "'Inter', sans-serif" },
        formatter: function() {
          return `<div style="font-family: 'Inter', sans-serif">
                    <div style="font-size: 14px; font-weight: 600; color: #2D3748; margin-bottom: 8px">${this.point.category || this.series.name}</div>
                    <div style="display: flex; justify-content: space-between">
                      <span style="color: #718096">Tonnage:</span>
                      <span style="font-weight: 600; color: #2D3748">${this.y.toFixed(2)} Tons</span>
                    </div>
                  </div>`;
        }
      },
      credits: { enabled: false },
      legend: {
        enabled: false
      }
    };
  }, [safeData, gradeFilter]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 ">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <HighchartsReact highcharts={Highcharts} options={customerTonnageOptions} />
      </div>
      <div className="bg-white rounded-xl  shadow-sm border border-gray-100">
        <HighchartsReact highcharts={Highcharts} options={deliveryRatingOptions} />
      </div>
      <div className="bg-white rounded-xl  shadow-sm border border-gray-100">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Grade:</label>
          <input
            type="text"
            placeholder="Search grade..."
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <HighchartsReact highcharts={Highcharts} options={gradeTonnageOptions} />
      </div>
      <div className="bg-white rounded-xl  shadow-sm border border-gray-100">
        <HighchartsReact highcharts={Highcharts} options={gradeDiaTonnageOptions} />
      </div>
    </div>
  );
};

export default GraphicalAnalysis;