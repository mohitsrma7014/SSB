import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, 
  DatePicker, TimePicker, Space, 
  Card, Pagination, message, Popconfirm, Tag, Checkbox, Row, Col
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, EditOutlined, 
  EyeOutlined, DeleteOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";
const { Option } = Select;
const BASE_URL = 'http://192.168.1.199:8002';

const ShiftAssignmentPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBulkModalVisible, setIsBulkModalVisible] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState({
    department: undefined,
    search: '',
  });
    
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Shift Assignment Management";

  // Shift types from your model
  const shiftTypes = [
    { value: 'DAY', label: 'Day Shift', color: 'green' },
    { value: 'NIGHT', label: 'Night Shift', color: 'volcano' },
    { value: 'ROT', label: 'Rotational Shift', color: 'orange' },
  ];

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    setEmployeeLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/employees2/`);
      setEmployees(response.data || []); // Ensure we always have an array
    } catch (error) {
      message.error('Failed to fetch employees');
      console.error(error);
      setEmployees([]); // Set to empty array on error
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Fetch shift assignments with backend filtering
  const fetchAssignments = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: params.pagination?.current || pagination.current,
        page_size: params.pagination?.pageSize || pagination.pageSize,
        ...filters,
        ...params.filters,
        search: searchText, // Add search text to query params
      };

      // Remove undefined or empty filters
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      const response = await axios.get(`${BASE_URL}/api/shiftassignments/`, { 
        params: queryParams,
        paramsSerializer: params => {
          return Object.entries(params)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return value.map(v => `${key}=${encodeURIComponent(v)}`).join('&');
              }
              return `${key}=${encodeURIComponent(value)}`;
            })
            .join('&');
        }
      });
      
      setAssignments(response.data.results);
      setPagination({
        ...pagination,
        current: params.pagination?.current || pagination.current,
        pageSize: params.pagination?.pageSize || pagination.pageSize,
        total: response.data.count,
      });
    } catch (error) {
      message.error('Failed to fetch shift assignments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchEmployees();
  }, [filters, searchText]);

  const handleTableChange = (newPagination, filters) => {
    fetchAssignments({
      pagination: newPagination,
      filters,
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchText('');
    setFilters({});
    fetchAssignments({ pagination: { ...pagination, current: 1 } });
  };

  const showAddModal = () => {
    setCurrentAssignment(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showBulkModal = () => {
    setSelectedEmployees([]);
    bulkForm.resetFields();
    setIsBulkModalVisible(true);
  };

  const showEditModal = (assignment) => {
    setCurrentAssignment(assignment);
    form.setFieldsValue({
      ...assignment,
      employee: employees.find(e => e.employee_id === assignment.employee_id)?.id,
      start_date: assignment.start_date ? dayjs(assignment.start_date) : null,
      end_date: assignment.end_date ? dayjs(assignment.end_date) : null,
      working_time_in: assignment.working_time_in ? dayjs(assignment.working_time_in, 'HH:mm:ss') : null,
      working_time_out: assignment.working_time_out ? dayjs(assignment.working_time_out, 'HH:mm:ss') : null,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleBulkCancel = () => {
    setIsBulkModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      setConfirmLoading(true);
      const values = await form.validateFields();
      const assignmentData = {
        ...values,
        employee: values.employee,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
        working_time_in: values.working_time_in?.format('HH:mm:ss'),
        working_time_out: values.working_time_out?.format('HH:mm:ss'),
      };

      Modal.confirm({
        title: currentAssignment ? 'Confirm Update' : 'Confirm Add',
        content: `Are you sure you want to ${currentAssignment ? 'update' : 'add'} this shift assignment?`,
        onOk: async () => {
          try {
            if (currentAssignment) {
              await axios.put(`${BASE_URL}/api/shiftassignments/${currentAssignment.id}/`, assignmentData);
              message.success('Shift assignment updated successfully');
            } else {
              await axios.post(`${BASE_URL}/api/shiftassignments/`, assignmentData);
              message.success('Shift assignment added successfully');
            }
            fetchAssignments();
            setIsModalVisible(false);
          } catch (error) {
            message.error(`Failed to ${currentAssignment ? 'update' : 'add'} shift assignment`);
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

  const handleBulkSubmit = async () => {
    try {
      setConfirmLoading(true);
      const values = await bulkForm.validateFields();
      
      if (selectedEmployees.length === 0) {
        message.error('Please select at least one employee');
        setConfirmLoading(false);
        return;
      }

      Modal.confirm({
        title: 'Confirm Bulk Assignment',
        content: `Are you sure you want to assign this shift to ${selectedEmployees.length} employees?`,
        onOk: async () => {
          try {
            const assignments = selectedEmployees.map(employeeId => ({
              employee: employeeId,
              shift_type: values.shift_type,
              start_date: values.start_date?.format('YYYY-MM-DD'),
              end_date: values.end_date?.format('YYYY-MM-DD'),
              working_time_in: values.working_time_in?.format('HH:mm:ss'),
              working_time_out: values.working_time_out?.format('HH:mm:ss'),
            }));

            // Send bulk assignments to the server
            await Promise.all(assignments.map(assignment => 
              axios.post(`${BASE_URL}/api/shiftassignments/`, assignment)
            ));

            message.success(`Shift assignments added successfully for ${selectedEmployees.length} employees`);
            fetchAssignments();
            setIsBulkModalVisible(false);
          } catch (error) {
            message.error('Failed to add bulk shift assignments');
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
        content: 'Are you sure you want to delete this shift assignment?',
        onOk: async () => {
          try {
            await axios.delete(`${BASE_URL}/api/shiftassignments/${id}/`);
            message.success('Shift assignment deleted successfully');
            fetchAssignments();
          } catch (error) {
            message.error('Failed to delete shift assignment');
            console.error(error);
          }
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId) 
        : [...prev, employeeId]
    );
  };

  const toggleSelectAll = () => {
    const filteredEmployees = getFilteredEmployees();
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  const getFilteredEmployees = () => {
    return employees.filter(employee => {
      const matchesDepartment = !employeeFilter.department || 
        employee.employee_department === employeeFilter.department;
      const matchesSearch = !employeeFilter.search ||
        employee.employee_name.toLowerCase().includes(employeeFilter.search.toLowerCase()) ||
        employee.employee_id.toLowerCase().includes(employeeFilter.search.toLowerCase());
      return matchesDepartment && matchesSearch;
    });
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (text, record) => (
        <span>
          {text || 'Unknown'} ({record.employee_id || 'N/A'})
        </span>
      ),
    },
    
    {
      title: 'Shift Type',
      dataIndex: 'shift_type',
      key: 'shift_type',
      render: (shift) => {
        const shiftInfo = shiftTypes.find(s => s.value === shift);
        return <Tag color={shiftInfo?.color}>{shiftInfo?.label || shift}</Tag>;
      },
      filters: shiftTypes.map(shift => ({ text: shift.label, value: shift.value })),
      filteredValue: filters.shift_type ? [filters.shift_type] : null,
      onFilter: (value, record) => record.shift_type === value,
    },
    {
      title: 'Date Range',
      key: 'date_range',
      render: (_, record) => (
        <span>
          {record.start_date ? dayjs(record.start_date).format('DD/MM/YYYY') : 'N/A'} - {record.end_date ? dayjs(record.end_date).format('DD/MM/YYYY') : 'N/A'}
        </span>
      ),
      sorter: (a, b) => dayjs(a.start_date).unix() - dayjs(b.start_date).unix(),
    },
    {
      title: 'Working Hours',
      key: 'working_hours',
      render: (_, record) => (
        <span>
          <ClockCircleOutlined /> {record.working_time_in || 'N/A'} - {record.working_time_out || 'N/A'}
        </span>
      ),
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
            title="Are you sure to delete this assignment?"
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

  const filteredEmployees = getFilteredEmployees();

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
          <div className="shift-assignment-page">
            <Card
              title="Shift Assignment Management"
              extra={
                <Space>
                  <Input.Search
                    placeholder="Search employees"
                    allowClear
                    enterButton
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onSearch={handleSearch}
                    style={{ width: 300 }}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                    Assign New Shift
                  </Button>
                  <Button type="primary" onClick={showBulkModal}>
                    Bulk Assign Shift
                  </Button>
                </Space>
              }
            >
              <Table
                columns={columns}
                rowKey="id"
                dataSource={assignments}
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
                bordered
              />
            </Card>

            {/* Single Assignment Modal */}
            <Modal
              title={currentAssignment ? 'Edit Shift Assignment' : 'Assign New Shift'}
              open={isModalVisible}
              onOk={handleSubmit}
              onCancel={handleCancel}
              width={800}
              destroyOnClose
              confirmLoading={confirmLoading}
            >
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  shift_type: 'DAY',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Form.Item
                    name="employee"
                    label="Employee"
                    rules={[{ required: true, message: 'Please select employee!' }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="children"
                      loading={employeeLoading}
                      filterOption={(input, option) => {
                        const children = option?.children || '';
                        return String(children).toLowerCase().includes(input.toLowerCase());
                      }}
                    >
                      {employees.map(employee => (
                        <Option 
                          key={employee.id} 
                          value={employee.id}
                        >
                          {employee.employee_name} ({employee.employee_id}) - {employee.employee_department}
                        </Option>
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
                        <Option key={shift.value} value={shift.value}>
                          <Tag color={shift.color}>{shift.label}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="start_date"
                    label="Start Date"
                    rules={[{ required: true, message: 'Please select start date!' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="end_date"
                    label="End Date"
                    rules={[{ required: true, message: 'Please select end date!' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="working_time_in"
                    label="Start Time"
                    rules={[{ required: true, message: 'Please select start time!' }]}
                  >
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="working_time_out"
                    label="End Time"
                    rules={[{ required: true, message: 'Please select end time!' }]}
                  >
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              </Form>
            </Modal>

            {/* Bulk Assignment Modal */}
            <Modal
              title="Bulk Assign Shift"
              open={isBulkModalVisible}
              onOk={handleBulkSubmit}
              onCancel={handleBulkCancel}
              width={1000}
              destroyOnClose
              confirmLoading={confirmLoading}
            >
              <Form
                form={bulkForm}
                layout="vertical"
                initialValues={{
                  shift_type: 'DAY',
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="shift_type"
                      label="Shift Type"
                      rules={[{ required: true, message: 'Please select shift type!' }]}
                    >
                      <Select>
                        {shiftTypes.map(shift => (
                          <Option key={shift.value} value={shift.value}>
                            <Tag color={shift.color}>{shift.label}</Tag>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="start_date"
                      label="Start Date"
                      rules={[{ required: true, message: 'Please select start date!' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="end_date"
                      label="End Date"
                      rules={[{ required: true, message: 'Please select end date!' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="working_time_in"
                      label="Start Time"
                      rules={[{ required: true, message: 'Please select start time!' }]}
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="working_time_out"
                      label="End Time"
                      rules={[{ required: true, message: 'Please select end time!' }]}
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Input.Search
                        placeholder="Search employees"
                        allowClear
                        onChange={(e) => setEmployeeFilter(prev => ({
                          ...prev,
                          search: e.target.value
                        }))}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Select
                        placeholder="Filter by department"
                        allowClear
                        style={{ width: '100%' }}
                        onChange={(value) => setEmployeeFilter(prev => ({
                          ...prev,
                          department: value
                        }))}
                      >
                        {[...new Set(employees.map(emp => emp.employee_department))].map(dept => (
                          <Option key={dept} value={dept}>{dept}</Option>
                        ))}
                      </Select>
                    </Col>
                  </Row>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Checkbox
                    onChange={toggleSelectAll}
                    checked={selectedEmployees.length > 0 && 
                             selectedEmployees.length === filteredEmployees.length}
                    indeterminate={selectedEmployees.length > 0 && 
                                  selectedEmployees.length < filteredEmployees.length}
                  >
                    Select All ({filteredEmployees.length} employees)
                  </Checkbox>
                </div>

                <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #d9d9d9', padding: 16 }}>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: 50 }}></th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map(employee => (
                        <tr key={employee.id}>
                          <td>
                            <Checkbox
                              checked={selectedEmployees.includes(employee.id)}
                              onChange={() => toggleEmployeeSelection(employee.id)}
                            />
                          </td>
                          <td>{employee.employee_id}</td>
                          <td>{employee.employee_name}</td>
                          <td>{employee.employee_department}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Form>
            </Modal>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ShiftAssignmentPage;