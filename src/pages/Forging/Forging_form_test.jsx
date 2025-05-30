import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { MultiSelect } from 'primereact/multiselect';
import { InputNumber } from 'primereact/inputnumber';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import axios from 'axios';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const ScheduleViewer = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [dateType, setDateType] = useState('month');
  const [dateValue, setDateValue] = useState(null);
  const [rangeDates, setRangeDates] = useState([null, null]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalpices, setTotalpices] = useState(0);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [componentFilter, setComponentFilter] = useState([]);
  const [customerFilter, setCustomerFilter] = useState([]);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [existingSchedules, setExistingSchedules] = useState([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [formData, setFormData] = useState({
    component: '',
    customer: '',
    grade: '',
    standerd: '',
    dia: '',
    slug_weight: '',
    pices: 0,
    weight: 0,
    date1: '',
    location: '',
    verified_by: '',
    supplier: ''
  });

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Schedule Viewer";

  const dateTypeOptions = [
    { label: 'Month', value: 'month' },
    { label: 'Single Date', value: 'date' },
    { label: 'Date Range', value: 'range' }
  ];

  const calculateTableHeight = () => {
    const windowHeight = window.innerHeight;
    const headerHeight = 64;
    const filterHeight = 200;
    const margin = 32;
    return `${windowHeight - headerHeight - filterHeight - margin}px`;
  };

  const [tableHeight, setTableHeight] = useState(calculateTableHeight());

  useEffect(() => {
    const handleResize = () => {
      setTableHeight(calculateTableHeight());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let filteredData = [...schedules];
    
    if (componentFilter.length > 0) {
      filteredData = filteredData.filter(item => 
        componentFilter.includes(item.component)
      );
    }
    
    if (customerFilter.length > 0) {
      filteredData = filteredData.filter(item => 
        customerFilter.includes(item.customer)
      );
    }
    
    setFilteredSchedules(filteredData);
    
    const sum = filteredData.reduce((acc, item) => acc + parseFloat(item.weight), 0);
    setTotalWeight(sum.toFixed(2));
    const sum1 = filteredData.reduce((acc, item) => acc + parseFloat(item.pices), 0);
    setTotalpices(sum1.toFixed(2));
  }, [schedules, componentFilter, customerFilter]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://192.168.1.199:8001/api/user-details/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        const { name, lastname } = response.data;
        setFormData(prev => ({
          ...prev,
          verified_by: `${name} ${lastname}`,
        }));
      } catch (err) {
        console.error('Error fetching user details:', err);
        showToast('error', 'Error', 'Failed to fetch user details');
      }
    };

    fetchUserData();
  }, []);

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  const fetchSchedules = async () => {
    if (
      (dateType === 'month' && !dateValue) ||
      (dateType === 'date' && !dateValue) ||
      (dateType === 'range' && (!rangeDates[0] || !rangeDates[1]))
    ) {
      showToast('error', 'Validation Error', 'Please select a valid date');
      return;
    }

    setLoading(true);

    try {
      let dateParam = '';
      
      if (dateType === 'month') {
        dateParam = `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}`;
      } else if (dateType === 'date') {
        dateParam = `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-${String(dateValue.getDate()).padStart(2, '0')}`;
      } else if (dateType === 'range') {
        const start = rangeDates[0];
        const end = rangeDates[1];
        dateParam = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}:${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      }

      const response = await axios.get(`http://192.168.1.199:8001/raw_material/api/schedules?date=${dateParam}`);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setSchedules(response.data);
      setFilteredSchedules(response.data);
      
      const components = [...new Set(response.data.map(item => item.component))];
      const customers = [...new Set(response.data.map(item => item.customer))];
      
      setAvailableComponents(components.map(c => ({ label: c, value: c })));
      setAvailableCustomers(customers.map(c => ({ label: c, value: c })));
      
      showToast('success', 'Success', 'Data fetched successfully');
    } catch (err) {
      showToast('error', 'Error', err.message || 'Failed to fetch schedules');
      setSchedules([]);
      setFilteredSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchSchedules();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const weightBodyTemplate = (rowData) => {
    return `${rowData.weight} kg`;
  };

  const dateBodyTemplate = (rowData) => {
    return formatDate(rowData.date1);
  };

  const createdBodyTemplate = (rowData) => {
    return formatDate(rowData.created_at);
  };

  const clearFilters = () => {
    setComponentFilter([]);
    setCustomerFilter([]);
    showToast('info', 'Filters Cleared', 'All filters have been reset');
  };

  const fetchComponentSuggestions = async (query) => {
    setLoadingSuggestions(true);
    try {
      const response = await axios.get(`http://192.168.1.199:8001/raw_material/components/`, {
        params: { component: query },
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching component suggestions:', error);
      showToast('error', 'Error', 'Failed to fetch component suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (component) => {
    setFormData(prev => ({
      ...prev,
      component,
    }));

    try {
      const detailsResponse = await axios.get(
        `http://192.168.1.199:8001/raw_material/get-part-details/`,
        { params: { component } }
      );
      const data = detailsResponse.data;

      setFormData(prev => ({
        ...prev,
        component,
        standerd: data.standerd,
        customer: data.customer,
        grade: data.material_grade,
        dia: data.bar_dia,
        slug_weight: data.slug_weight,
        location:data.location,
      }));
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Error', 'Please enter a correct part number');
      setFormData(prev => ({
        ...prev,
        component: '',
        customer: '',
        grade: '',
        dia: '',
        slug_weight: '',
      }));
    }
    setSuggestions([]);
  };

  const checkForDuplicates = async () => {
    if (!formData.component || !formData.date1) return false;
    
    try {
      const dateStr = formData.date1.toISOString().split('T')[0];
      const response = await axios.get(
        `http://192.168.1.199:8001/raw_material/api/schedules/`,
        {
          params: {
            component: formData.component,
            exact_date: dateStr,
            check_duplicates: true
          }
        }
      );

      if (response.data.exists) {
        setExistingSchedules(response.data.schedules);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      showToast('error', 'Error', 'Failed to check for duplicates');
      return false;
    }
  };

  const handleSaveSchedule = async () => {
    if (!formData.component || !formData.date1 || formData.pices <= 0) {
      showToast('error', 'Validation Error', 'Please fill all required fields with valid values');
      return;
    }

    setLoading(true);
    
    try {
      const hasDuplicates = await checkForDuplicates();
      
      if (hasDuplicates) {
        setShowDuplicateDialog(true);
      } else {
        await createNewSchedule();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Error', 'Failed to save schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createNewSchedule = async (forceCreate = false) => {
    try {
      const weight = formData.slug_weight * formData.pices;
      
      const payload = {
        ...formData,
        weight: weight.toFixed(2),
        date1: formData.date1.toISOString().split('T')[0],
      };

      const config = {
        params: {}
      };

      if (forceCreate) {
        config.params.force_create = true;
      }

      const response = await axios.post(
        'http://192.168.1.199:8001/raw_material/api/schedules/',
        payload,
        config
      );

      if (response.status === 201) {
        fetchSchedules();
        setShowAddDialog(false);
        setShowDuplicateDialog(false);
        resetForm();
        showToast('success', 'Success', 'Schedule created successfully');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      showToast('error', 'Error', error.response?.data?.message || 'Failed to create schedule');
      throw error;
    }
  };

  const updateSchedule = async (schedule) => {
    try {
      const updatedPices = schedule.pices + formData.pices;
      const updatedWeight = parseFloat(schedule.weight) + (formData.slug_weight * formData.pices);
      
      const response = await axios.put(
        `http://192.168.1.199:8001/raw_material/api/schedules/${schedule.id}/`,
        {
          pices: updatedPices,
          weight: updatedWeight.toFixed(2),
          location: formData.location || schedule.location,
          supplier: formData.supplier || schedule.supplier,
          verified_by: formData.verified_by || schedule.verified_by
        }
      );

      if (response.status === 200) {
        fetchSchedules();
        setShowDuplicateDialog(false);
        setShowAddDialog(false);
        resetForm();
        showToast('success', 'Success', 'Schedule updated successfully');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      showToast('error', 'Error', error.response?.data?.message || 'Failed to update schedule');
      throw error;
    }
  };

  const resetForm = () => {
    setFormData({
      component: '',
      customer: '',
      grade: '',
      standerd: '',
      dia: '',
      slug_weight: '',
      pices: 0,
      weight: 0,
      date1: '',
      location: '',
      verified_by: formData.verified_by,
      supplier: ''
    });
    setExistingSchedules([]);
  };

  const addDialogFooter = (
    <div>
      <Button 
        label="Cancel" 
        icon="pi pi-times" 
        onClick={() => {
          setShowAddDialog(false);
          resetForm();
        }} 
        className="p-button-text rounded-full bg-gray-200 hover:bg-blue-200 border-blue-600 rounded-full px-3 py-2" 
      />
      <Button 
        label="Save" 
        icon="pi pi-check" 
        onClick={handleSaveSchedule} 
        className="p-button-success bg-gray-200 hover:bg-blue-200 border-blue-200 rounded-full px-3 py-2 ml-2" 
        disabled={!formData.component || !formData.date1 || formData.pices <= 0}
      />
    </div>
  );

  const duplicateDialogFooter = (
    <div>
      <Button 
        label="Cancel" 
        icon="pi pi-times" 
        onClick={() => setShowDuplicateDialog(false)} 
        className="p-button-text rounded-full bg-gray-200 hover:bg-blue-200 border-blue-600 rounded-full px-3 py-2" 
      />
      <Button 
        label="Create New Anyway" 
        icon="pi pi-plus" 
        onClick={() => createNewSchedule(true)} 
        className="p-button-success rounded-full bg-gray-200 hover:bg-blue-200 border-blue-600 rounded-full px-3 py-2 ml-2" 
      />
    </div>
  );

  return (
    <div className="flex">
      {/* Toast component for notifications */}
      <Toast ref={toast} position="bottom-right" />

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
        <main className="flex flex-col mt-20 justify-center flex-grow pl-2 pr-4">
          <div className="p-0">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold text-gray-800">Schedule Management</h2>
              <Button 
                label="Add New Schedule" 
                icon="pi pi-plus" 
                onClick={() => setShowAddDialog(true)} 
                 className="p-button-raised p-button-success bg-gray-200 hover:bg-blue-700 border-blue-600 rounded-full px-3 py-2"
              />
            </div>

            <div className="w-fit max-w-full">
              <form 
                onSubmit={handleSubmit} 
                className="flex flex-wrap md:flex-nowrap items-end gap-x-4 gap-y-3 bg-white p-2 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="field flex-grow">
                  <label htmlFor="dateType" className="block text-sm font-medium text-gray-700">
                    Date Type
                  </label>
                  <Dropdown
                    id="dateType"
                    value={dateType}
                    options={dateTypeOptions}
                    onChange={(e) => setDateType(e.value)}
                    placeholder="Select Date Type"
                    className="w-full"
                  />
                </div>

                {dateType === 'month' && (
                  <div className="field flex-grow">
                    <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <Calendar
                      id="month"
                      value={dateValue}
                      onChange={(e) => setDateValue(e.value)}
                      view="month"
                      dateFormat="mm/yy"
                      showIcon
                      placeholder="Select Month"
                      className="w-full mb-2"
                    />
                  </div>
                )}

                {dateType === 'date' && (
                  <div className="field flex-grow">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <Calendar
                      id="date"
                      value={dateValue}
                      onChange={(e) => setDateValue(e.value)}
                      dateFormat="dd/mm/yy"
                      showIcon
                      placeholder="Select Date"
                      className="w-full mb-2"
                    />
                  </div>
                )}

                {dateType === 'range' && (
                  <>
                    <div className="field flex-grow">
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <Calendar
                        id="startDate"
                        value={rangeDates[0]}
                        onChange={(e) => setRangeDates([e.value, rangeDates[1]])}
                        dateFormat="dd/mm/yy"
                        showIcon
                        placeholder="Start Date"
                        className="w-full mb-2"
                      />
                    </div>
                    <div className="field flex-grow">
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <Calendar
                        id="endDate"
                        value={rangeDates[1]}
                        onChange={(e) => setRangeDates([rangeDates[0], e.value])}
                        dateFormat="dd/mm/yy"
                        showIcon
                        placeholder="End Date"
                        className="w-full mb-2"
                      />
                    </div>
                  </>
                )}

                <div className="field">
                  <Button
                    type="submit"
                    label="Fetch Data"
                    icon="pi pi-search"
                    className="p-button-raised bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white rounded-full px-4 py-2 shadow-sm"
                    disabled={loading}
                  />
                </div>
              </form>
            </div>



            {loading && (
              <div className="flex justify-content-center mt-2">
                <ProgressSpinner />
              </div>
            )}

            {!loading && schedules.length > 0 && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Schedule Data</h3>
                  <div className="text-lg font-bold bg-blue-50 px-3 py-2 rounded text-blue-700">
                    Total Weight: {totalWeight} kg | Total Pices: {totalpices} Pcs.
                  </div>
                </div>

                {/* Filter Section */}
                <div className="flex gap-4 mb-2 p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="field flex-grow">
                    <label htmlFor="componentFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Component</label>
                    <MultiSelect
                      id="componentFilter"
                      value={componentFilter}
                      options={availableComponents}
                      onChange={(e) => setComponentFilter(e.value)}
                      placeholder="Select Components"
                      display="chip"
                      className="w-full"
                      filter
                    />
                  </div>
                  <div className="field flex-grow">
                    <label htmlFor="customerFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Customer</label>
                    <MultiSelect
                      id="customerFilter"
                      value={customerFilter}
                      options={availableCustomers}
                      onChange={(e) => setCustomerFilter(e.value)}
                      placeholder="Select Customers"
                      display="chip"
                      className="w-full"
                      filter
                    />
                  </div>
                  <div className="field flex items-end">
                    <Button
                      label="Clear Filters"
                      icon="pi pi-filter-slash"
                      className="p-button-text p-button-sm text-blue-600 hover:text-blue-800"
                      onClick={clearFilters}
                    />
                  </div>
                </div>

                {/* Data Table */}
                <div className="relative bg-white rounded-lg shadow-sm border border-gray-200">
                  <DataTable
                    value={filteredSchedules}
                    paginator
                    rows={20}
                    rowsPerPageOptions={[20, 50, 100]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                    responsiveLayout="scroll"
                    scrollable
                    scrollHeight={tableHeight}
                    className="p-datatable-striped p-datatable-gridlines"
                    headerClassName="sticky top-0 z-10 bg-gray-100 font-semibold text-gray-700"
                    rowClassName={() => 'hover:bg-gray-50'}
                  >
                    <Column field="component" header="Component" sortable filter filterPlaceholder="Search" style={{ minWidth: '100px' }} />
                    <Column field="customer" header="Customer" sortable filter filterPlaceholder="Search" style={{ minWidth: '100px' }} />
                    <Column field="grade" header="Grade" sortable style={{ minWidth: '100px' }} />
                    <Column field="dia" header="Diameter" sortable style={{ minWidth: '70px' }} />
                    <Column field="slug_weight" header="Slug Weight" sortable style={{ minWidth: '70px' }} />
                    <Column field="pices" header="Pieces" sortable style={{ minWidth: '70px' }} />
                    <Column field="weight" header="Weight" body={weightBodyTemplate} sortable style={{ minWidth: '100px' }} />
                    <Column field="date1" header="Schedule Date" body={dateBodyTemplate} sortable style={{ minWidth: '100px' }} />
                    <Column field="location" header="Location" sortable style={{ minWidth: '140px' }} />
                    <Column field="verified_by" header="Verified By" sortable style={{ minWidth: '150px' }} />
                    <Column field="created_at" header="Created At" body={createdBodyTemplate} sortable style={{ minWidth: '100px' }} />
                  </DataTable>
                </div>
              </div>
            )}

            {!loading && schedules.length === 0 && (
              <div className="mt-5 text-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-gray-500 text-lg">
                  No data available. Please select a date range and click 'Fetch Data'.
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Schedule Dialog */}
      <Dialog 
        visible={showAddDialog} 
        style={{ width: '50vw', maxWidth: '800px' }} 
        header="Add New Schedule" 
        modal 
        className="p-fluid "
        footer={addDialogFooter}
        onHide={() => {
          setShowAddDialog(false);
          resetForm();
        }}
      >
        <ConfirmDialog />
        <div className="p-field mb-4 ">
          <label htmlFor="component" className="block text-lg  font-medium text-gray-700 mb-1">Component*</label>
          <div className="p-inputgroup relative">
            <InputText
              id="component"
              value={formData.component}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, component: e.target.value }));
                if (e.target.value.length > 2) {
                  fetchComponentSuggestions(e.target.value);
                } else {
                  setSuggestions([]);
                }
              }}
              placeholder="Start typing to search components"
              className="w-full"
              autoComplete="off"
            />
            {loadingSuggestions && (
              <span className="p-inputgroup-addon">
                <i className="pi pi-spinner pi-spin" />
              </span>
            )}
          </div>
          {suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.map((item, index) => (
                <div 
                  key={index} 
                  className="suggestion-item p-2 border-b border-gray-200 cursor-pointer hover:bg-blue-50"
                  onClick={() => handleSelectSuggestion(item)}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="field">
            <label htmlFor="customer" className="block text-lg  font-medium text-gray-700 mb-1">Customer</label>
            <InputText 
              id="customer" 
              value={formData.customer} 
              readOnly 
              className="w-full bg-gray-100"
            />
          </div>
          <div className="field">
            <label htmlFor="grade" className="block text-lg  font-medium text-gray-700 mb-1">Grade</label>
            <InputText 
              id="grade" 
              value={formData.grade} 
              readOnly 
              className="w-full bg-gray-100"
            />
          </div>
          <div className="field hidden">
            <label htmlFor="standerd" className="block text-lg  font-medium text-gray-700 mb-1">Standard</label>
            <InputText 
              id="standerd" 
              value={formData.standerd} 
              readOnly 
              className="w-full bg-gray-100"
            />
          </div>
          <div className="field">
            <label htmlFor="dia" className="block text-lg  font-medium text-gray-700 mb-1">Diameter</label>
            <InputText 
              id="dia" 
              value={formData.dia} 
              readOnly 
              className="w-full bg-gray-100"
            />
          </div>
          <div className="field">
            <label htmlFor="slug_weight" className="block text-lg  font-medium text-gray-700 mb-1">Slug Weight (kg)</label>
            <InputText 
              id="slug_weight" 
              value={formData.slug_weight} 
              readOnly 
              className="w-full bg-gray-100"
            />
          </div>
          
          <div className="field">
            <label htmlFor="location" className="block text-lg  font-medium text-gray-700 mb-1">Location</label>
            <InputText 
              id="location" 
              value={formData.location} 
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full bg-gray-100"
              readOnly
            />
          </div>
          <div className="field">
            <label htmlFor="weight" className="block text-lg  font-medium text-gray-700 mb-1">Total Weight (kg)</label>
            <InputText 
              id="weight" 
              value={formData.weight} 
              readOnly 
              className="w-full bg-gray-100"
            />
          </div>
          <div className="field">
            <label htmlFor="pices" className="block text-lg  font-medium text-gray-700 mb-1">Pieces*</label>
            <InputNumber 
              id="pices" 
              value={formData.pices} 
              onValueChange={(e) => {
                const pieces = e.value || 0;
                const weight = pieces * formData.slug_weight;
                setFormData(prev => ({
                  ...prev,
                  pices: pieces,
                  weight: weight.toFixed(2)
                }));
              }}
              mode="decimal" 
              min={0}
              className="w-full"
            />
          </div>
          <div className="field">
            <label htmlFor="date1" className="block text-lg  font-medium text-gray-700 mb-1">Schedule Date*</label>
            <Calendar 
              id="date1" 
              value={formData.date1} 
              onChange={(e) => setFormData(prev => ({ ...prev, date1: e.value }))}
              dateFormat="dd/mm/yy" 
              showIcon 
              required 
              className="w-full"
            />
          </div>
          
          <div className="field">
            <label htmlFor="verified_by" className="block text-lg  font-medium text-gray-700 mb-1">Verified By</label>
            <InputText 
              id="verified_by" 
              value={formData.verified_by} 
              readOnly 
              className="w-full bg-gray-100"
            />
          </div>
        </div>
      </Dialog>

      {/* Duplicate Schedules Dialog */}
      <Dialog
        visible={showDuplicateDialog}
        onHide={() => setShowDuplicateDialog(false)}
        header="Duplicate Schedules Found"
        style={{ width: '70vw', maxWidth: '900px' }}
        footer={duplicateDialogFooter}
      >
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="pi pi-exclamation-triangle text-yellow-500 text-xl"></i>
            </div>
            <div className="ml-3">
              <p className="text-lg text-yellow-700">
                This component already has {existingSchedules.length} schedule(s) for the selected Month.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1">
          <div className="col-span-1">
            <h4 className="text-lg font-medium text-gray-800 mb-3">Existing Schedules:</h4>
            <DataTable 
              value={existingSchedules} 
              paginator 
              rows={5}
              className="p-datatable-striped p-datatable-gridlines"
              rowClassName={() => 'hover:bg-gray-50'}
            >
              <Column field="component" header="Component" style={{ minWidth: '180px' }} />
              <Column field="pices" header="Pieces" style={{ minWidth: '100px' }} />
              <Column field="weight" header="Weight" body={weightBodyTemplate} style={{ minWidth: '120px' }} />
              <Column field="date1" header="Date" body={dateBodyTemplate} style={{ minWidth: '120px' }} />
              <Column field="verified_by" header="Verified By" style={{ minWidth: '150px' }} />
              <Column 
                header="Action" 
                body={(rowData) => (
                  <Button
                    label="Add to This"
                    icon="pi pi-plus"
                    className="p-button-success bg-green-100 hover:bg-green-300 border-blue-600 rounded-full px-3 py-2"
                    onClick={() => updateSchedule(rowData)}
                  />
                )}
                style={{ minWidth: '150px',padding:'2px' }}
              />
            </DataTable>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ScheduleViewer;