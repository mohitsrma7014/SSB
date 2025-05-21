import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, 
  DatePicker, TimePicker, InputNumber, Space, 
  Card, Pagination, message, Popconfirm 
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, EditOutlined, 
  EyeOutlined, DeleteOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

const { Option } = Select;
const BASE_URL = 'http://192.168.1.199:8002';

const EmployeeListPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Employee Management";

  // Departments from your model
  const departments = [
    'HR', 'CNC', 'FORGING', 'HAMMER', 'STORE', 
    'TOOL ROOM', 'TURNING', 'ACCOUNTS', 'RM', 
    'ENGINEERING', 'LAB', 'FI', 'MAINTENANCE','DISPATCH','ELECTRICAL','Other','CANTEEN','FI-D MAGNET','FI-FINAL INSPECTION','FI-MARKING','FI-PACKING & LOADING','FI-VISUAL',
    'HAMMER','HEAT TREATMENT','MPI','RING ROLLING','SHOT BLAST','TURNING','MATERIAL MOVEMENT'
  ];

  // Employee types from your model
  const employeeTypes = [
    { value: 'FT', label: 'Full Time' },
    { value: 'PT', label: 'Part Time' },
    { value: 'CT', label: 'Contract' },
  ];

  // Shift types from your model
  const shiftTypes = [
    { value: 'DAY', label: 'Day Shift' },
    { value: 'NIGHT', label: 'Night Shift' },
    { value: 'ROT', label: 'Rotational Shift' },
  ];

  // Position choices from your model
  const positions = [
    'INCHARGE', 'MAINTENANCE', 'QA', 'FORMAN', 
    'EXECUTIVE', 'QUALITY ENGINEER', 'Designer','Developer',
    'OPERATOR', 'PROGRAMMER', 'HEAD','Supervisor','Chaker','Visual','Helper','Loader','Packer'
  ];

  // Status options
  const statusOptions = [
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];

  const fetchEmployees = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: params.pagination?.current || pagination.current,
        page_size: params.pagination?.pageSize || pagination.pageSize,
        ...filters,
        ...params.filters,
      };

      // Remove undefined or empty filters
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      const response = await axios.get(`${BASE_URL}/api/employees/`, { params: queryParams });
      setEmployees(response.data.results);
      setPagination({
        ...pagination,
        current: params.pagination?.current || pagination.current,
        pageSize: params.pagination?.pageSize || pagination.pageSize,
        total: response.data.count,
      });
    } catch (error) {
      message.error('Failed to fetch employees');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [filters]);
  

  const handleTableChange = (newPagination, filters) => {
    fetchEmployees({
      pagination: newPagination,
      filters,
    });
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setFilters({
      ...filters,
      [dataIndex]: selectedKeys[0],
    });
  };

  const handleReset = (clearFilters, dataIndex) => {
    clearFilters();
    const newFilters = { ...filters };
    delete newFilters[dataIndex];
    setFilters(newFilters);
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleReset(clearFilters, dataIndex)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
  });

  const showAddModal = () => {
    setCurrentEmployee(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (employee) => {
    setCurrentEmployee(employee);
    form.setFieldsValue({
      ...employee,
      working_time_in: employee.working_time_in ? dayjs(employee.working_time_in, 'HH:mm:ss') : null,
      working_time_out: employee.working_time_out ? dayjs(employee.working_time_out, 'HH:mm:ss') : null,
      is_active: employee.is_active !== undefined ? employee.is_active : true,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      setConfirmLoading(true);
      const values = await form.validateFields();
      const employeeData = {
        ...values,
        salary: parseFloat(values.salary || 0),
        incentive: parseFloat(values.incentive || 0),
        working_hours: parseFloat(values.working_hours || 0),
        no_of_cl: parseInt(values.no_of_cl || 0),
        working_time_in: values.working_time_in ? values.working_time_in.format('HH:mm:ss') : null,
        working_time_out: values.working_time_out ? values.working_time_out.format('HH:mm:ss') : null,
      };

      Modal.confirm({
        title: currentEmployee ? 'Confirm Update' : 'Confirm Add',
        content: `Are you sure you want to ${currentEmployee ? 'update' : 'add'} this employee?`,
        onOk: async () => {
          try {
            if (currentEmployee) {
              // Update existing employee
              console.log('Sending data:', employeeData);
              await axios.put(`${BASE_URL}/api/employees/${currentEmployee.id}/`, employeeData);
              message.success('Employee updated successfully');
            } else {
              // Add new employee
              await axios.post(`${BASE_URL}/api/employees/`, employeeData);
              message.success('Employee added successfully');
            }
            fetchEmployees();
            setIsModalVisible(false);
          } catch (error) {
            message.error(`Failed to ${currentEmployee ? 'update' : 'add'} employee`);
            console.error(error);
          } finally {
            setConfirmLoading(false);
          }
        },
        onCancel: () => {
          setConfirmLoading(false);
        },
      });
    } catch (error) {
      setConfirmLoading(false);
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      Modal.confirm({
        title: 'Confirm Delete',
        content: 'Are you sure you want to delete this employee?',
        onOk: async () => {
          try {
            await axios.delete(`${BASE_URL}/api/employees/${id}/`);
            message.success('Employee deleted successfully');
            fetchEmployees();
          } catch (error) {
            message.error('Failed to delete employee');
            console.error(error);
          }
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      ...getColumnSearchProps('employee_id'),
      sorter: true,
    },
    {
      title: 'Name',
      dataIndex: 'employee_name',
      key: 'employee_name',
      ...getColumnSearchProps('employee_name'),
      sorter: true,
    },
    {
      title: 'Department',
      dataIndex: 'employee_department',
      key: 'employee_department',
      filters: departments.map(dept => ({ text: dept, value: dept })),
      filteredValue: filters.employee_department ? [filters.employee_department] : null,
    },
    {
      title: 'Type',
      dataIndex: 'employee_type',
      key: 'employee_type',
      render: (type) => employeeTypes.find(t => t.value === type)?.label || type,
      filters: employeeTypes.map(type => ({ text: type.label, value: type.value })),
      filteredValue: filters.employee_type ? [filters.employee_type] : null,
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      filters: positions.map(pos => ({ text: pos, value: pos })),
      filteredValue: filters.position ? [filters.position] : null,
    },
    {
      title: 'Shift',
      dataIndex: 'shift_type',
      key: 'shift_type',
      render: (shift) => shiftTypes.find(s => s.value === shift)?.label || shift,
      filters: shiftTypes.map(shift => ({ text: shift.label, value: shift.value })),
      filteredValue: filters.shift_type ? [filters.shift_type] : null,
    },
    
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (status) => status ? 'Active' : 'Inactive',
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      filteredValue: filters.is_active !== undefined ? [filters.is_active] : null,
    },
    {
      title: 'Sunday Off',
      dataIndex: 'is_getting_sunday',
      key: 'is_getting_sunday',
      render: (value) => value ? 'Yes' : 'No',
    },
    {
      title: 'Gets OT',
      dataIndex: 'is_getting_ot',
      key: 'is_getting_ot',
      render: (value) => value ? 'Yes' : 'No',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => showEditModal(record)}
            title="View Details"
          />
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
            title="Edit"
          />
          <Popconfirm
            title="Are you sure to delete this employee?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />} 
              title="Delete"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
    <div className="employee-list-page">
      <Card
        title="Employee Management"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            Add New Employee
          </Button>
        }
      >
        <Table
          columns={columns}
          rowKey="id"
          dataSource={employees}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          bordered
        />
      </Card>

      <Modal
        title={currentEmployee ? 'Edit Employee' : 'Add New Employee'}
        visible={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        width={1000}
        destroyOnClose
        confirmLoading={confirmLoading}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_getting_sunday: true,
            is_getting_ot: false,
            no_of_cl: 0,
            working_hours: 8.0,
            is_active: true,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            {/* Row 1 */}
            <Form.Item
              name="employee_id"
              label="Employee ID"
              rules={[{ required: true, message: 'Please input employee ID!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="employee_name"
              label="Employee Name"
              rules={[{ required: true, message: 'Please input employee name!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="father_name"
              label="Father's Name"
              rules={[{ required: true, message: 'Please input father name!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="employee_type"
              label="Employee Type"
              rules={[{ required: true, message: 'Please select employee type!' }]}
            >
              <Select>
                {employeeTypes.map(type => (
                  <Option key={type.value} value={type.value}>{type.label}</Option>
                ))}
              </Select>
            </Form.Item>

            {/* Row 2 */}
            <Form.Item
              name="employee_department"
              label="Department"
              rules={[{ required: true, message: 'Please select department!' }]}
            >
              <Select>
                {departments.map(dept => (
                  <Option key={dept} value={dept}>{dept}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="position"
              label="Position"
              rules={[{ required: true, message: 'Please select position!' }]}
            >
              <Select>
                {positions.map(pos => (
                  <Option key={pos} value={pos}>{pos}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="shift_type"
              label="Shift Type"
              rules={[{ required: true, message: 'Please select shift type!' }]}
            >
              <Select>
                {shiftTypes.map(shift => (
                  <Option key={shift.value} value={shift.value}>{shift.label}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Status"
              rules={[{ required: true, message: 'Please select status!' }]}
            >
              <Select>
                {statusOptions.map(status => (
                  <Option key={status.value} value={status.value}>{status.label}</Option>
                ))}
              </Select>
            </Form.Item>

            {/* Row 3 */}
            <Form.Item
              name="salary"
              label="Salary"
              rules={[{ required: true, message: 'Please input salary!' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>

            <Form.Item
              name="incentive"
              label="incentive"
              rules={[{ required: true, message: 'Please input incentive!' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>

            <Form.Item
              name="working_time_in"
              label="Working Time In"
              rules={[{ required: true, message: 'Please select working time in!' }]}
            >
             <TimePicker 
                format="HH:mm" 
                style={{ width: '100%' }} 
                onChange={() => {
                    const inTime = form.getFieldValue('working_time_in');
                    const outTime = form.getFieldValue('working_time_out');
                    if (inTime && outTime) {
                    const diff = outTime.diff(inTime, 'minute');
                    const hours = (diff / 60).toFixed(2);
                    form.setFieldsValue({ working_hours: parseFloat(hours) });
                    }
                }} 
                />

            </Form.Item>

            <Form.Item
              name="working_time_out"
              label="Working Time Out"
              rules={[{ required: true, message: 'Please select working time out!' }]}
            >
              <TimePicker 
                format="HH:mm" 
                style={{ width: '100%' }} 
                onChange={() => {
                    const inTime = form.getFieldValue('working_time_in');
                    const outTime = form.getFieldValue('working_time_out');
                    if (inTime && outTime) {
                    const diff = outTime.diff(inTime, 'minute');
                    const hours = (diff / 60).toFixed(2);
                    form.setFieldsValue({ working_hours: parseFloat(hours) });
                    }
                }} 
                />

            </Form.Item>

            <Form.Item
              name="working_hours"
              label="Working Hours"
              rules={[{ required: true, message: 'Please input working hours!' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} max={24} step={0.5} />
            </Form.Item>

            {/* Row 4 */}
            <Form.Item
              name="no_of_cl"
              label="No. of CL"
              rules={[{ required: true, message: 'Please input number of CL!' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>

            <Form.Item
              name="is_getting_sunday"
              label="Gets Sunday Off"
              rules={[{ required: true, message: 'Please select Sunday off status!' }]}
            >
              <Select>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="is_getting_ot"
              label="Gets OT"
              rules={[{ required: true, message: 'Please select OT status!' }]}
            >
              <Select>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
    </main>
      </div>
    </div>
  );
};

export default EmployeeListPage;