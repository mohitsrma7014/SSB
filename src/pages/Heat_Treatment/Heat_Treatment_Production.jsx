import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";
import debounce from 'lodash.debounce';

const Heat_Treatment_Production = () => {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() - 2);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [data, setData] = useState({});
  const [date, setDate] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [component, setComponent] = useState('');
  const [customer, setCustomer] = useState('');
  const [line, setLine] = useState('');
  const [componentSuggestions, setComponentSuggestions] = useState([]);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [lineSuggestions, setLineSuggestions] = useState([]);
  const selectedColumns = ['date','shift','batch_number', 'component', 'ringweight','furnace','process', 'production','supervisor','operator','remark','cycle_time','hardness','unit','verified_by'];

  const [batchId, setBatchId] = useState('');
  const [search, setSearch] = useState('');

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Heat-Treatment Production Page"; // Set the page title here

  useEffect(() => {
    fetchData();
  }, [date, month, year, component, customer, line, batchId]);

  const fetchData = async () => {
    if (date) {
      // Create a new Date object to avoid modifying the original date object
      const localDate = new Date(date);
      
      // Set the hours, minutes, seconds, and milliseconds to 0 to avoid time-related issues
      localDate.setHours(0, 0, 0, 0);
  
      // Construct the date string in the format YYYY-MM-DD
      const formattedDate = `${localDate.getFullYear()}-${(localDate.getMonth() + 1).toString().padStart(2, '0')}-${localDate.getDate().toString().padStart(2, '0')}`;
      
      // Update the params with the formatted date
      const params = {
        date: formattedDate,
        month,
        year,
        component,
        customer,
        line,
        batch_id: batchId
      };
  
      try {
        const response = await axios.get('http://192.168.1.199:8001/heat_treatment/api/production-report', { params });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setData({});
      }
    } else {
      const params = {
        date: '',
        month,
        year,
        component,
        customer,
        line,
        batch_id: batchId
      };
  
      try {
        const response = await axios.get('http://192.168.1.199:8001/heat_treatment/api/production-report', { params });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setData({});
      }
    }
  };
  
  const handleSearch = (event) => {
    setSearch(event.target.value);
  };

  const filteredTableData = data.table_data?.filter(item => 
    Object.values(item).some(val => val.toString().toLowerCase().includes(search.toLowerCase()))
  );

  const sortDataDescending = (data) => {
    return data.sort((a, b) => b.production_weight_ton - a.production_weight_ton);
  };
  const sortDataDescending1 = (data) => {
    return data.sort((a, b) => b.cost_per_kg - a.cost_per_kg);
  };
  const fetchSuggestions = async (type, value) => {
    if (value.length < 2) {
      // Clear suggestions if input is less than 2 characters
      if (type === 'component') setComponentSuggestions([]);
      if (type === 'customer') setCustomerSuggestions([]);
      if (type === 'line') setLineSuggestions([]);
      return;
    }

    try {
      const response = await axios.get('http://192.168.1.199:8001/heat_treatment/api/suggestions', {
        params: { type, value },
      });
      if (type === 'component') setComponentSuggestions(response.data);
      if (type === 'customer') setCustomerSuggestions(response.data);
      if (type === 'line') setLineSuggestions(response.data);
    } catch (error) {
      console.error(`Error fetching ${type} suggestions:`, error);
    }
  };

  // Debounced versions of the fetchSuggestions function
  const debouncedFetchComponentSuggestions = debounce((value) => fetchSuggestions('component', value), 300);
  const debouncedFetchCustomerSuggestions = debounce((value) => fetchSuggestions('customer', value), 300);
  const debouncedFetchLineSuggestions = debounce((value) => fetchSuggestions('line', value), 300);

  useEffect(() => {
    debouncedFetchComponentSuggestions(component);
  }, [component]);

  useEffect(() => {
    debouncedFetchCustomerSuggestions(customer);
  }, [customer]);

  useEffect(() => {
    debouncedFetchLineSuggestions(line);
  }, [line]);
  const handleFocus = (field) => {
    if (field === 'component') setIsComponentFocused(true);
    if (field === 'customer') setIsCustomerFocused(true);
    if (field === 'line') setIsLineFocused(true);
  };

  const handleBlur = (field) => {
    if (field === 'component') setIsComponentFocused(false);
    if (field === 'customer') setIsCustomerFocused(false);
    if (field === 'line') setIsLineFocused(false);
  };
  const handleSuggestionSelect = (type, value) => {
    // Update the corresponding state
    if (type === 'component') {
      setComponent(value);
      setComponentSuggestions([]); // Clear the suggestions after selection
    }
    if (type === 'customer') {
      setCustomer(value);
      setCustomerSuggestions([]); // Clear the suggestions after selection
    }
    if (type === 'line') {
      setLine(value);
      setLineSuggestions([]); // Clear the suggestions after selection
    }
  };
  const filteredTableData1 = data.table_data?.map(item => {
    const filteredItem = {};
    selectedColumns.forEach(column => {
      if (item[column] !== undefined) {
        filteredItem[column] = item[column];
      }
    });
    return filteredItem;
  });
  
  

  const componentChartOptions = {
    chart: {
      type: 'column',
      backgroundColor: '#f4f4f9',
      height: 500,
    },
    title: {
      text: 'Component Data',
      style: {
        color: '#333',
        fontSize: '18px',
        fontWeight: 'bold',
      }
    },
    credits: {
      enabled: false, // Hide credits
    },
    xAxis: {
      categories: sortDataDescending(data.component_data || []).map(item => item.component),
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Production Weight (Ton)',
        style: {
          color: '#333',
          fontSize: '16px',
        }
      },
    },
    series: [
      {
        name: 'Production Weight (Ton)',
        data: sortDataDescending(data.component_data || []).map(item => item.production_weight_ton),
        color: '#66bb6a',
        borderRadius: 5,
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#333'
          },
          formatter: function () {
            return this.y.toFixed(2); // Round to 2 decimal places
          }
        },
        point: {
          events: {
            mouseOver: function () {
              this.graphic.css({
                fill: '#ff7043',
              });
            },
            mouseOut: function () {
              this.graphic.css({
                fill: '#66bb6a',
              });
            },
          }
        },
      }
    ]
  };
  
  const customerChartOptions = {
    chart: {
      type: 'column',
      backgroundColor: '#f4f4f9',
      height: 250,
    },
    title: {
      text: 'Furnace Data',
      style: {
        color: '#333',
        fontSize: '18px',
        fontWeight: 'bold',
      }
    },
    credits: {
      enabled: false, // Hide credits
    },
    xAxis: {
      categories: sortDataDescending(data.customer_data || []).map(item => item.furnace),
      labels: {
        rotation: 0,
        staggerLines: 2,
        style: {
          fontSize: '8px',
          whiteSpace: 'normal',
        }
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Production Weight (Ton)',
        style: {
          color: '#333',
          fontSize: '16px',
        }
      },
    },
    series: [
      {
        name: 'Production Weight (Ton)',
        data: sortDataDescending(data.customer_data || []).map(item => item.production_weight_ton),
        color: '#42a5f5',
        borderRadius: 5,
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#333'
          },
          formatter: function () {
            return this.y.toFixed(2); // Round to 2 decimal places
          }
        },
        point: {
          events: {
            mouseOver: function () {
              this.graphic.css({
                fill: '#ffb74d',
              });
            },
            mouseOut: function () {
              this.graphic.css({
                fill: '#42a5f5',
              });
            },
          }
        },
      }
    ]
  };
  
  const lineChartOptions = {
    chart: {
      type: 'column',
      backgroundColor: '#f4f4f9',
      height: 250,
    },
    title: {
      text: 'Cost/Kg (Furnace)',
      style: {
        color: '#333',
        fontSize: '18px',
        fontWeight: 'bold',
      }
    },
    credits: {
      enabled: false, // Hide credits
    },
    xAxis: {
      categories: sortDataDescending1(data.line_data || []).map(item => item.furnace),
      labels: {
        rotation: 0,
        staggerLines: 2,
        style: {
          fontSize: '8px',
          whiteSpace: 'normal',
        }
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Cost(Rs)',
        style: {
          color: '#333',
          fontSize: '16px',
        }
      },
    },
    series: [
      {
        name: 'Cost/KG(Furnace)',
        data: sortDataDescending1(data.line_data || []).map(item => item.cost_per_kg),
        color: '#ffca28',
        borderRadius: 5,
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#333'
          },
          formatter: function () {
            return this.y.toFixed(2); // Round to 2 decimal places
          }
        },
        point: {
          events: {
            mouseOver: function () {
              this.graphic.css({
                fill: '#ff7043',
              });
            },
            mouseOut: function () {
              this.graphic.css({
                fill: '#ffca28',
              });
            },
          }
        },
      }
    ]
  };
  const handleSubmit = async () => {
    const params = {
      date: date ? date.toISOString().split('T')[0] : '',
      month: month || '',
      year: year || '',
      component: component.trim(),
      customer: customer.trim(),
      line: line.trim(),
      batch_id: batchId.trim(),
    };

    try {
      const response = await axios.get('http://192.168.1.199:8001/heat_treatment/api/production-report', { params });
      setData(response.data);
      console.log("Filters applied with params:", params);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const isFormValid = () => {
    // Validation: Ensure at least one filter is applied
    return (
      date ||
      month ||
      year ||
      component.trim() !== '' ||
      customer.trim() !== '' ||
      line.trim() !== '' ||
      batchId.trim() !== ''
    );
  };

  
  

  const hasData = data && Object.keys(data).length > 0;

  const isFiltersApplied = month || year || component || customer || line || batchId;

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
        <main className="flex flex-col mt-20  justify-center flex-grow pl-2">
      {/* Filters */}
      <div className="filters">
      <div>
        <label>Select Date:</label>
        <DatePicker
          selected={date}
          onChange={(selectedDate) => {
            setDate(selectedDate);
            setMonth('');
            setYear('');
            setComponent('');
            setCustomer('');
            setLine('');
          }}
          dateFormat="yyyy-MM-dd"
          className="datepicker"
        />
      </div>
      <div>
        <label>Select Month:</label>
        <select
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setDate(null);
          }}
        >
          <option value="">Select Month</option>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((monthName, i) => (
            <option key={i + 1} value={i + 1}>
              {monthName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Select Year:</label>
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Select Year</option>
          {[...Array(20).keys()].map((i) => (
            <option key={i} value={2020 + i}>
              {2020 + i}
            </option>
          ))}
        </select>
      </div>
            

      <div>
        <label>Select Component:</label>
        <input
          type="text"
          value={component}
          onChange={(e) => setComponent(e.target.value)}
          onFocus={() => handleFocus('component')}
          onBlur={() => handleBlur('component')}
          placeholder="Enter component"
        />
        {component && componentSuggestions.length > 0 && (
          <ul className="suggestions">
            {componentSuggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSuggestionSelect('component', suggestion)}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label>Select Furnace:</label>
        <input
          type="text"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          onFocus={() => handleFocus('customer')}
          onBlur={() => handleBlur('customer')}
          placeholder="Enter Furnace"
        />
        {customer && customerSuggestions.length > 0 && (
          <ul className="suggestions">
            {customerSuggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSuggestionSelect('customer', suggestion)}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label>Select Process:</label>
        <input
          type="text"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          onFocus={() => handleFocus('line')}
          onBlur={() => handleBlur('line')}
          placeholder="Enter Process"
        />
        {line && lineSuggestions.length > 0 && (
          <ul className="suggestions">
            {lineSuggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSuggestionSelect('line', suggestion)}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>

      {hasData ? (
        <>
          {/* KPIs */}
          <div className="kpi-row">
            <div className="kpi">Total Production: {data.total_production} Pcs.</div>
            <div className="kpi">Production (Kg) : {data.production_weight_kg?.toFixed(2)}Kg</div>
            <div className="kpi">Production (Ton): {data.production_weight_ton?.toFixed(2)}Ton</div>
            <div className="kpi">Total Unit Consumed: {data.total_unique_units} </div>
            <div className="kpi">Average Cost(/Kg) : {data.rejection_percentage?.toFixed(2)}Rs</div>
            
          </div>

          <div className={isFiltersApplied ? 'charts-column' : 'charts-row'} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="chart-container">
              <HighchartsReact highcharts={Highcharts} options={componentChartOptions} />
            </div>
            <div className="chart-container1">
              <HighchartsReact highcharts={Highcharts} options={customerChartOptions} />
              <HighchartsReact highcharts={Highcharts} options={lineChartOptions} />
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <input type="text" placeholder="Search..." value={search} onChange={handleSearch} />
            <table>
              <thead>
              <tr>
                  <th>Date</th>
                  <th>Shift</th>
                  <th>Batch No.</th>
                  <th>Component</th>
                  <th>Ring-Wg.</th>
                  <th>Furnace</th>
                  <th>Process</th>
                  <th>Production</th>
                  <th>Supervisor</th>
                  <th>Operator</th>
                  <th>Remark</th>
                  <th>Cycle Time</th>
                  <th>Hardness</th>
                  <th>Unit</th>
                  
                  <th>Verified By</th>
                </tr>
              </thead>
              <tbody>
                {filteredTableData1?.map((row, index) => (
                  <tr key={index}>
                    {selectedColumns.map((column, idx) => (
                      <td key={idx}>{row[column]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="no-data">
          {isFiltersApplied ? 'No results for the selected filters' : 'Select filters to view results'}
        </div>
      )}
      </main>
      </div>
    </div>
  );
};

export default Heat_Treatment_Production;
