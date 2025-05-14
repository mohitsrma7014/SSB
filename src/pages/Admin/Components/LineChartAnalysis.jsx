import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const LineChartAnalysis = ({ title, data, xField, darkMode }) => {
  const options = {
    chart: {
      type: 'line',
      backgroundColor: darkMode ? '#374151' : 'transparent',
      height: 400
    },
    title: {
      text: title,
      style: {
        color: darkMode ? '#F3F4F6' : '#111827',
        fontSize: '16px',
        fontWeight: 600
      },
      align: 'left'
    },
    xAxis: {
      categories: data.map(item => item[xField]),
      labels: {
        style: {
          color: darkMode ? '#9CA3AF' : '#4B5563'
        },
        rotation: -45
      },
      lineColor: darkMode ? '#4B5563' : '#E5E7EB'
    },
    yAxis: {
      title: {
        text: 'Quantity',
        style: {
          color: darkMode ? '#9CA3AF' : '#4B5563'
        }
      },
      labels: {
        style: {
          color: darkMode ? '#9CA3AF' : '#6B7280'
        }
      },
      gridLineColor: darkMode ? '#4B5563' : '#E5E7EB'
    },
    series: [
      {
        name: 'Pieces',
        data: data.map(item => item.total_pices),
        color: '#3B82F6',
        marker: {
          symbol: 'circle'
        }
      },
      {
        name: 'Weight (Tons)',
        data: data.map(item => item.total_weight),
        color: '#10B981',
        marker: {
          symbol: 'square'
        }
      }
    ],
    legend: {
      itemStyle: {
        color: darkMode ? '#D1D5DB' : '#374151'
      }
    },
    tooltip: {
      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
      style: {
        color: darkMode ? '#F3F4F6' : '#111827'
      },
      shared: true
    },
    plotOptions: {
      line: {
        dataLabels: {
          enabled: true,
          style: {
            color: darkMode ? '#F3F4F6' : '#111827',
            textOutline: 'none'
          }
        }
      }
    },
    credits: {
      enabled: false
    }
  };

  return (
    <div className={`rounded-lg shadow p-4 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export default LineChartAnalysis;