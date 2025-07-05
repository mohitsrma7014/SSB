import React, { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { FaChartLine, FaCalendarAlt } from "react-icons/fa";
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const categories = ["total_production", "total_rejection", "rejection_cost", "rejection_percentage"];

// Define benchmark and reduction percentage for each year and process
const processBenchmarks = {
     2021: {
        forging: { benchmark: 3.34, reduction: 25  ,cost_benchmark: 1200000,cost_reduction: 20 },
        pre_mc: { benchmark: 0.9, reduction: 25 ,cost_benchmark: 1200000,cost_reduction: 20},
        cnc: { benchmark: 1.60, reduction: 25 ,cost_benchmark: 1200000,cost_reduction: 20},
        overall: { benchmark: 4.78, reduction: 25,cost_benchmark: 1200000,cost_reduction: 20 }
    },
     2022: {
        forging: { benchmark: 3.03, reduction: 25 ,cost_benchmark: 1200000,cost_reduction: 20},
        pre_mc: { benchmark: 0.9, reduction: 25 ,cost_benchmark: 1200000,cost_reduction: 20},
        cnc: { benchmark: 1.37, reduction: 25,cost_benchmark: 1200000,cost_reduction: 20 },
        overall: { benchmark: 4.40, reduction: 25,cost_benchmark: 1200000,cost_reduction: 20 }
    },
    2023: {
        forging: { benchmark: 3.10, reduction: 25 ,cost_benchmark: 1200000,cost_reduction: 20},
        pre_mc: { benchmark: 0.9, reduction: 25 ,cost_benchmark: 1200000,cost_reduction: 20},
        cnc: { benchmark: 1.82, reduction: 25 ,cost_benchmark: 1200000,cost_reduction: 20},
        overall: { benchmark: 4.53, reduction: 25,cost_benchmark: 1200000,cost_reduction: 20 }
    },
    2024: {
        forging: { benchmark: 3.10, reduction: 25 ,cost_benchmark: 2431115,cost_reduction: 25},
        pre_mc: { benchmark: 0.9, reduction: 25,cost_benchmark: 0,cost_reduction: 25 },
        cnc: { benchmark: 1.82, reduction: 25,cost_benchmark: 1323493,cost_reduction: 25 },
        overall: { benchmark: 4.53, reduction: 25,cost_benchmark: 3754608,cost_reduction: 25 }
    },
    2025: {
        forging: { benchmark: 2.16, reduction: 25 ,cost_benchmark: 1700716,cost_reduction: 25},
        pre_mc: { benchmark: 0.18, reduction: 50 ,cost_benchmark: 0,cost_reduction: 25},
       cnc: { benchmark: 1.69, reduction: 25 ,cost_benchmark: 1307377,cost_reduction: 25},
        overall: { benchmark: 3.77, reduction: 25 ,cost_benchmark: 3124385,cost_reduction: 25}
    },
    2026: {
        forging: { benchmark: 3.0, reduction: 25,cost_benchmark: 1200000,cost_reduction: 20 },
        pre_mc: { benchmark: 0.6, reduction: 50 ,cost_benchmark: 1200000,cost_reduction: 20},
        cnc: { benchmark: 2.0, reduction: 25 ,cost_benchmark: 1200000,cost_reduction: 20},
        overall: { benchmark: 3.5, reduction: 25,cost_benchmark: 1200000,cost_reduction: 20 }
    }
};

// Update the calculateTargetValues function to include cost targets
const calculateTargetValues = () => {
    const targets = {};
    Object.keys(processBenchmarks).forEach(year => {
        targets[year] = {};
        Object.keys(processBenchmarks[year]).forEach(process => {
            const { benchmark, reduction, cost_benchmark, cost_reduction } = processBenchmarks[year][process];
            targets[year][process] = {
                percentage_target: benchmark * (1 - reduction / 100),
                cost_target: cost_benchmark * (1 - cost_reduction / 100)
            };
        });
    });
    return targets;
};


const targetValues = calculateTargetValues();

const monthMap = {
    "04": "Apr", "05": "May", "06": "Jun", "07": "Jul", "08": "Aug", 
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec", 
    "01": "Jan", "02": "Feb", "03": "Mar"
};

const Dashboard = () => {
    const currentYear = new Date().getFullYear();
    const [selectedCategory, setSelectedCategory] = useState("rejection_percentage");
    const [year, setYear] = useState(currentYear);
    const [data, setData] = useState([]);
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };
    const pageTitle = "Yearly trends";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://192.168.1.199:8001/cnc/api/fy-trends/${year}/`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error("Error fetching data:", error);
                setData([]);
            }
        };
        fetchData();
    }, [year]);

    const orderedMonths = ["04", "05", "06", "07", "08", "09", "10", "11", "12", "01", "02", "03"];

    const allMonths = orderedMonths.map(num => {
        const isNextYear = parseInt(num) <= 3;
        const displayYear = isNextYear ? parseInt(year) + 1 : parseInt(year);
        return `${monthMap[num]}/${displayYear.toString().slice(-2)}`;
    });

    const formatYearLabel = (year) => {
        return `${year-1}-${year.toString().slice(-2)}`;
    };

    const dataMap = data.reduce((acc, d) => {
        const [month, yr] = d.month_year.split("-");
        const displayYear = parseInt(month) <= 3 ? parseInt(year) + 1 : parseInt(year);
        const formattedMonth = `${monthMap[month]}/${displayYear.toString().slice(-2)}`;
        acc[formattedMonth] = d;
        return acc;
    }, {});

    const formattedData = allMonths.map(month => {
        const dataItem = dataMap[month];
        if (dataItem) {
            return dataItem;
        } else {
            const [monthStr, yearStr] = month.split('/');
            const monthNum = Object.entries(monthMap).find(([num, name]) => name === monthStr)[0];
            const actualYear = parseInt(monthNum) <= 3 ? parseInt(yearStr) + 2000 - 1 : parseInt(yearStr) + 2000;
            return {
                month_year: `${monthNum}-${actualYear}`,
                forging: { total_production: 0, total_rejection: 0, rejection_cost: 0, rejection_percentage: 0 },
                cnc: { total_production: 0, total_rejection: 0, rejection_cost: 0, rejection_percentage: 0 },
                pre_mc: { total_production: 0, total_rejection: 0, rejection_cost: 0, rejection_percentage: 0 },
                overall: { total_production: 0, total_rejection: 0, rejection_cost: 0, rejection_percentage: 0 }
            };
        }
    });

    const generateOptions = (category, process) => {
        const categoryTitles = {
            total_production: "PRODUCTION (In Pcs.)",
            total_rejection: "REJECTION (In Pcs.)",
            rejection_cost: "COST (In Lac.)",
            rejection_percentage: "REJECTION %"
        };
        
        const formattedTitle = `${process.toUpperCase()} ${categoryTitles[category]}`;
        
        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
        const currentDisplayYear = parseInt(currentMonth) <= 3 ? now.getFullYear() - 1 : now.getFullYear();
        const currentMonthYear = `${monthMap[currentMonth]}/${String(currentDisplayYear).slice(-2)}`;
        
        // Prepare series data
        const seriesData = formattedData.map(d => {
            const monthYear = d.month_year;
            const [month, yr] = monthYear.split('-');
            const formattedMonthYear = `${monthMap[month]}/${String(yr).slice(-2)}`;
            const isCurrentMonth = formattedMonthYear === currentMonthYear;
            const categoryValue = d[process.toLowerCase()][category];
            
            const value = category === "rejection_cost"
                ? parseFloat((categoryValue / 100000).toFixed(2)) || 0
                : category === "rejection_percentage"
                ? parseFloat(categoryValue.toFixed(2)) || 0
                : categoryValue;
            
            return {
                y: value,
                month: monthYear,
                production: d[process.toLowerCase()].total_production || 0,
                rejection: d[process.toLowerCase()].total_rejection || 0,
                cost: parseFloat((d[process.toLowerCase()].rejection_cost / 100000).toFixed(2)) || 0,
                percentage: parseFloat(d[process.toLowerCase()].rejection_percentage.toFixed(2)) || 0,
                marker: isCurrentMonth ? { 
                    radius: 6,
                    symbol: "circle",
                    fillColor: '#28a745',
                    lineWidth: 3,
                    lineColor: '#28a745'
                } : { radius: 4, symbol: "circle" }
            };
        });
        if (category === "rejection_cost") {
    const currentCostBenchmark = processBenchmarks[year]?.[process]?.cost_benchmark || 0;
    const prevYearCostBenchmark = processBenchmarks[year-1]?.[process]?.cost_benchmark || 0;
    const costTargetValue = targetValues[year]?.[process]?.cost_target || 0;
    
    // Prepare colored series data based on cost target
    const coloredSeriesData = formattedData.map(d => {
        const monthYear = d.month_year;
        const [month, yr] = monthYear.split('-');
        const formattedMonthYear = `${monthMap[month]}/${String(yr).slice(-2)}`;
        const isCurrentMonth = formattedMonthYear === currentMonthYear;
        const costValue = parseFloat((d[process.toLowerCase()].rejection_cost / 100000).toFixed(2)) || 0;
        const actualCost = d[process.toLowerCase()].rejection_cost || 0;
        const isBelowTarget = actualCost <= costTargetValue;
        
        return {
            y: costValue,
            month: monthYear,
            color: isBelowTarget ? '#2ecc71' : '#ff4444', // Green if below target, red if above
            production: d[process.toLowerCase()].total_production || 0,
            rejection: d[process.toLowerCase()].total_rejection || 0,
            cost: costValue,
            percentage: parseFloat(d[process.toLowerCase()].rejection_percentage.toFixed(2)) || 0,
            marker: isCurrentMonth ? { 
                radius: 6,
                symbol: "circle",
                fillColor: isBelowTarget ? '#2ecc71' : '#ff4444',
                lineWidth: 3,
                lineColor: isBelowTarget ? '#2ecc71' : '#ff4444'
            } : { radius: 4, symbol: "circle" }
        };
    });
    
    return {
        // ... (keep existing chart config options)
        yAxis: { 
            title: { 
                text: "COST (In Lac)", 
                style: { 
                    fontSize: "14px", 
                    color: "#555",
                    fontWeight: '500'
                } 
            },
            gridLineColor: "rgba(238, 238, 238, 0.8)",
            plotLines: [
                {
                    value: costTargetValue / 100000, // Convert to lakhs
                    color: '#ff4444',
                    dashStyle: 'solid',
                    width: 2,
                    zIndex: 15,
                    label: {
                        text: `<b>Target: ₹${(costTargetValue / 100000).toFixed(2)} Lac</b>`,
                        useHTML: true,
                        align: 'right',
                        y: 15,
                        style: {
                            color: '#ff4444',
                            fontWeight: 'bold',
                            fontSize: '12px'
                        }
                    }
                }
            ]
        },
        tooltip: {
            // ... (keep existing tooltip config)
            formatter: function () {
                if (this.x === 0) { // Two years back benchmark
                    return `
                        <div style="padding:8px; font-weight: 500;">
                            <b style="font-size:14px; color:#3498db;">FY ${formatYearLabel(year-1)} COST BENCHMARK</b><br/>
                            <span style="color:#555;">Value: <b>₹${(prevYearCostBenchmark / 100000).toFixed(2)} Lac</b></span><br/>
                            <span style="color:#555;">Reduction Target: <b>${processBenchmarks[year-1]?.[process]?.cost_reduction || 0}%</b></span>
                        </div>`;
                }
                if (this.x === 1) { // Previous year benchmark
                    return `
                        <div style="padding:8px; font-weight: 500;">
                            <b style="font-size:14px; color:#3498db;">FY ${formatYearLabel(year)} COST BENCHMARK</b><br/>
                            <span style="color:#555;">Value: <b>₹${(currentCostBenchmark / 100000).toFixed(2)} Lac</b></span><br/>
                            <span style="color:#555;">Reduction Target: <b>${processBenchmarks[year]?.[process]?.cost_reduction || 0}%</b></span>
                        </div>`;
                }
                
                const point = this.points[0].point;
                const isBelowTarget = (point.cost * 100000) <= costTargetValue; // Convert back to rupees for comparison
                return `
                    <div style="padding:8px; font-weight: 500;">
                        <b style="font-size:14px; color:#444;">${category.replace(/_/g, " ").toUpperCase()}</b><br/>
                        <span style="color:#777;">Month-Year: <b>${point.month}</b></span><br/>  
                        <span style="color:#0b84a5;">Production: <b>${point.production} pcs</b></span><br/>
                        <span style="color:#f95d6a;">Rejection: <b>${point.rejection} pcs</b></span><br/>
                        <span style="color:${isBelowTarget ? '#2ecc71' : '#ff4444'};">
                            Cost: <b>₹${point.cost} Lac ${isBelowTarget ? '(Below Target)' : '(Above Target)'}</b>
                        </span>
                        <span style="color:#ffa600;">Percentage: <b>${point.percentage}%</b></span>
                    </div>`;
            }
        },
        series: [
            {
                name: formattedTitle,
                data: [
                    // Cost benchmark values for previous years
                    {
                        y: prevYearCostBenchmark / 100000,
                        color: '#3498db',
                        name: `${formatYearLabel(year-1)} Cost Benchmark`,
                        marker: { enabled: false }
                    },
                    {
                        y: currentCostBenchmark / 100000,
                        color: '#3498db',
                        name: `${formatYearLabel(year)} Cost Benchmark`,
                        marker: { enabled: false }
                    },
                    // Actual monthly cost data (green/red based on target)
                    ...coloredSeriesData
                ],
                type: 'column',
                colorByPoint: true,
                zIndex: 10
            }
        ]
    };
}
        // Options for rejection percentage (with benchmark and target)
        if (category === "rejection_percentage") {
            const currentBenchmark = processBenchmarks[year]?.[process] || { benchmark: 0, reduction: 0 };
            const prevYearBenchmark = processBenchmarks[year]?.[process] || { benchmark: 0, reduction: 0 };
            const twoYearsBackBenchmark = processBenchmarks[year-1]?.[process] || { benchmark: 0, reduction: 0 };
            const targetValue = targetValues[year]?.[process]?.percentage_target || 0;
            
            // Prepare colored series data based on target
            const coloredSeriesData = formattedData.map(d => {
                const monthYear = d.month_year;
                const [month, yr] = monthYear.split('-');
                const formattedMonthYear = `${monthMap[month]}/${String(yr).slice(-2)}`;
                const isCurrentMonth = formattedMonthYear === currentMonthYear;
                const categoryValue = d[process.toLowerCase()][category];
                
                const value = parseFloat(categoryValue.toFixed(2)) || 0;
                const isBelowTarget = value <= targetValue;
                
                return {
                    y: value,
                    month: monthYear,
                    color: isBelowTarget ? '#2ecc71' : '#ff4444', // Green if below target, red if above
                    production: d[process.toLowerCase()].total_production || 0,
                    rejection: d[process.toLowerCase()].total_rejection || 0,
                    cost: parseFloat((d[process.toLowerCase()].rejection_cost / 100000).toFixed(2)) || 0,
                    percentage: value,
                    marker: isCurrentMonth ? { 
                        radius: 6,
                        symbol: "circle",
                        fillColor: isBelowTarget ? '#2ecc71' : '#ff4444',
                        lineWidth: 3,
                        lineColor: isBelowTarget ? '#2ecc71' : '#ff4444'
                    } : { radius: 4, symbol: "circle" }
                };
            });
            
            return {
                chart: {
                    type: "column",
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    shadow: { 
                        color: "rgba(0,0,0,0.1)", 
                        offsetX: 2, 
                        offsetY: 2, 
                        opacity: 0.5,
                        width: 3
                    },
                    style: { fontFamily: "Inter, sans-serif" },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutBounce'
                    }
                },
                title: { 
                    text: formattedTitle, 
                    style: { 
                        fontSize: "18px", 
                        fontWeight: "bold", 
                        color: "#333",
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    } 
                },
                xAxis: { 
                    categories: [
                        formatYearLabel(year-1), 
                        formatYearLabel(year), 
                        ...allMonths
                    ],
                    labels: { 
                        style: { 
                            fontSize: "12px", 
                            color: "#666",
                            fontWeight: '500'
                        } 
                    },
                    lineColor: "#ddd",
                    tickColor: "#ddd",
                    gridLineWidth: 1,
                    gridLineColor: 'rgba(221, 221, 221, 0.5)'
                },
                yAxis: { 
                    title: { 
                        text: category.toUpperCase(), 
                        style: { 
                            fontSize: "14px", 
                            color: "#555",
                            fontWeight: '500'
                        } 
                    },
                    gridLineColor: "rgba(238, 238, 238, 0.8)",
                    plotLines: [
                        {
                            value: targetValue,
                            color: '#ff4444', // Red target line
                            dashStyle: 'solid',
                            width: 2,
                            zIndex: 15,
                            label: {
                                text: `<b>Target: ${targetValue.toFixed(2)}%</b>`,
                                useHTML: true,
                                align: 'right',
                                y: 15,
                                style: {
                                    color: '#ff4444',
                                    fontWeight: 'bold',
                                    fontSize: '12px'
                                }
                            }
                        }
                    ]
                },
                tooltip: {
                    enabled: true,
                    shared: true,
                    useHTML: true,
                    backgroundColor: "rgba(255,255,255,0.98)",
                    borderColor: "#ddd",
                    borderRadius: 8,
                    shadow: true,
                    style: { 
                        fontSize: "13px", 
                        color: "#333",
                        padding: '12px'
                    },
                    formatter: function () {
                        if (this.x === 0) { // Two years back benchmark
                            return `
                                <div style="padding:8px; font-weight: 500;">
                                    <b style="font-size:14px; color:#3498db;">FY ${formatYearLabel(year-1)} BENCHMARK</b><br/>
                                    <span style="color:#555;">Value: <b>${twoYearsBackBenchmark.benchmark}%</b></span><br/>
                                    <span style="color:#555;">Reduction Target: <b>${twoYearsBackBenchmark.reduction}%</b></span>
                                </div>`;
                        }
                        if (this.x === 1) { // Previous year benchmark
                            return `
                                <div style="padding:8px; font-weight: 500;">
                                    <b style="font-size:14px; color:#3498db;">FY ${formatYearLabel(year)} BENCHMARK</b><br/>
                                    <span style="color:#555;">Value: <b>${prevYearBenchmark.benchmark}%</b></span><br/>
                                    <span style="color:#555;">Reduction Target: <b>${prevYearBenchmark.reduction}%</b></span>
                                </div>`;
                        }
                        
                        
                        const point = this.points[0].point;
                        const isBelowTarget = point.y <= targetValue;
                        return `
                            <div style="padding:8px; font-weight: 500;">
                                <b style="font-size:14px; color:#444;">${category.replace(/_/g, " ").toUpperCase()}</b><br/>
                                <span style="color:#777;">Month-Year: <b>${point.month}</b></span><br/>  
                                <span style="color:#0b84a5;">Production: <b>${point.production} pcs</b></span><br/>
                                <span style="color:#f95d6a;">Rejection: <b>${point.rejection} pcs</b></span><br/>
                                <span style="color:#ff7c43;">Cost: <b>₹${point.cost} Lac</b></span><br/>
                                <span style="color:${isBelowTarget ? '#2ecc71' : '#ff4444'};">
                                    Percentage: <b>${point.percentage}% ${isBelowTarget ? '(Below Target)' : '(Above Target)'}</b>
                                </span>
                            </div>`;
                    }
                },
                plotOptions: {
                    column: {
                        borderRadius: 4,
                        pointPadding: 0.1,
                        groupPadding: 0.1,
                        borderWidth: 0,
                        animation: {
                            duration: 1500
                        },
                        states: {
                            hover: {
                                brightness: 0.1,
                                borderColor: '#333',
                                shadow: true
                            }
                        }
                    },
                    series: {
                        dataLabels: {
                            enabled: true,
                            formatter: function () {
                                return this.y.toFixed(2);
                            },
                            style: { 
                                fontSize: "10px", 
                                fontWeight: "bold", 
                                color: "#444",
                                textOutline: '1px contrast'
                            }
                        }
                    }
                },
                series: [
                    {
                        name: formattedTitle,
                        data: [
                            // Benchmark values for previous years
                            {
                                y: twoYearsBackBenchmark.benchmark,
                                color: '#3498db',
                                name: `${formatYearLabel(year-1)} Benchmark`,
                                marker: { enabled: false }
                            },
                            {
                                y: prevYearBenchmark.benchmark,
                                color: '#3498db',
                                name: `${formatYearLabel(year)} Benchmark`,
                                marker: { enabled: false }
                            },
                           
                            // Actual monthly data (green/red based on target)
                            ...coloredSeriesData
                        ],
                        type: 'column',
                        colorByPoint: true,
                        zIndex: 10,
                        animation: {
                            duration: 1500,
                            easing: 'easeOutBounce'
                        }
                    }
                ],
                credits: { enabled: false },
                legend: {
                    align: 'right',
                    verticalAlign: 'top',
                    layout: 'horizontal',
                    itemStyle: {
                        fontWeight: '500',
                        color: '#555'
                    }
                }
            };
        }
        
        // Default options for other categories (total_production, total_rejection, rejection_cost)
        return {
            chart: {
                type: "column",
                backgroundColor: "#ffffff",
                borderRadius: 12,
                shadow: { color: "rgba(0,0,0,0.1)", offsetX: 2, offsetY: 2, opacity: 0.5 },
                style: { fontFamily: "Inter, sans-serif" },
                animation: {
                    duration: 1000
                }
            },
            title: { 
                text: formattedTitle, 
                style: { fontSize: "18px", fontWeight: "bold", color: "#333" } 
            },
            xAxis: { 
                categories: allMonths, // No benchmark for other categories
                labels: { style: { fontSize: "12px", color: "#666" } },
                lineColor: "#ddd",
                tickColor: "#ddd"
            },
            yAxis: { 
                title: { text: category.toUpperCase(), style: { fontSize: "14px", color: "#555" } },
                gridLineColor: "#eee",
                plotLines: [] // No target line for other categories
            },
            tooltip: {
                enabled: true,
                shared: true,
                useHTML: true,
                backgroundColor: "rgba(255,255,255,0.95)",
                borderColor: "#ddd",
                borderRadius: 8,
                style: { fontSize: "13px", color: "#333" },
                formatter: function () {
                    const point = this.points[0].point;
                    return `
                        <div style="padding:10px; font-weight: 500;">
                            <b style="font-size:14px; color:#444;">${category.replace(/_/g, " ").toUpperCase()}</b><br/>
                            <span style="color:#777;">Month-Year: <b>${point.month}</b></span><br/>  
                            <span style="color:#0b84a5;">Production: <b>${point.production} pcs</b></span><br/>
                            <span style="color:#f95d6a;">Rejection: <b>${point.rejection} pcs</b></span><br/>
                            <span style="color:#ff7c43;">Cost: <b>₹${point.cost} Lac</b></span><br/>
                            <span style="color:#ffa600;">Percentage: <b>${point.percentage}%</b></span>
                        </div>`;
                }
            },
            plotOptions: {
                series: {
                    dataLabels: {
                        enabled: true,
                        formatter: function () {
                            return this.y;
                        },
                        style: { fontSize: "10px", fontWeight: "bold", color: "#444" }
                    },
                    animation: {
                        duration: 1000
                    },
                    states: {
                        hover: {
                            halo: {
                                size: 10,
                                opacity: 0.25
                            }
                        }
                    }
                }
            },
            series: [{
                name: formattedTitle,
                data: seriesData,
                color: '#3498db',
                animation: {
                    duration: 1500
                }
            }],
            credits: { enabled: false }
        };
    };

    return (
        <div className="flex">
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full transition-all duration-300 ${
                    isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
                }`}
                style={{ zIndex: 50 }} 
            >
                {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
            </div>

            {/* Main Content */}
            <div
                className={`flex flex-col flex-grow transition-all duration-300 ${
                    isSidebarVisible ? "ml-64" : "ml-0"
                }`}
            >
                <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />

                {/* Main Content */}
                <main className="flex flex-col mt-20 justify-center flex-grow pl-2">
                    <div className="flex items-center space-x-3">
                        <FaChartLine className="text-blue-600 text-2xl" />
                        <div className="flex space-x-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-2 py-2 rounded-lg transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white text-xs shadow-md' : 'bg-gray-200 text-xs text-gray-800 hover:bg-gray-300 shadow-sm'}`}
                                >
                                    {cat.replace(/_/g, " ").toUpperCase()}
                                </button>
                            ))}
                            <FaCalendarAlt className="text-blue-600 text-2xl" />
                            <select
                                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-all"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-2">
                        <HighchartsReact 
                            highcharts={Highcharts} 
                            options={generateOptions(selectedCategory, "forging")} 
                            containerProps={{ 
                                style: { 
                                    height: "100%", 
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                } 
                            }} 
                        />
                        <HighchartsReact 
                            highcharts={Highcharts} 
                            options={generateOptions(selectedCategory, "pre_mc")} 
                            containerProps={{ 
                                style: { 
                                    height: "100%", 
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                } 
                            }} 
                        />
                        <HighchartsReact 
                            highcharts={Highcharts} 
                            options={generateOptions(selectedCategory, "cnc")} 
                            containerProps={{ 
                                style: { 
                                    height: "100%", 
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                } 
                            }} 
                        />
                        <HighchartsReact 
                            highcharts={Highcharts} 
                            options={generateOptions(selectedCategory, "overall")} 
                            containerProps={{ 
                                style: { 
                                    height: "100%", 
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                } 
                            }} 
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;