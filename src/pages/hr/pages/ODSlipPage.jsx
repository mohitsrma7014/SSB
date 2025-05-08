import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, 
  DatePicker, TimePicker, Space, 
  Card, Pagination, message, Popconfirm, Tag, InputNumber, Checkbox, Row, Col 
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

const ODSlipPage = () => {
  const [odSlips, setOdSlips] = useState([]);
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
  const [currentOdSlip, setCurrentOdSlip] = useState(null);
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
  const pageTitle = "Manual Punch Management";

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    setEmployeeLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/employees1/`);
      setEmployees(response.data || []); // Ensure we always have an array
    } catch (error) {
      message.error('Failed to fetch employees');
      console.error(error);
      setEmployees([]); // Set to empty array on error
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Fetch OD slips with backend filtering
  const fetchOdSlips = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: params.pagination?.current || pagination.current,
        page_size: params.pagination?.pageSize || pagination.pageSize,
        ...filters,
        ...params.filters,
        search: searchText,
      };

      // Remove undefined or empty filters
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      const response = await axios.get(`${BASE_URL}/api/odslips/`, { 
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
      
      setOdSlips(response.data.results);
      setPagination({
        ...pagination,
        current: params.pagination?.current || pagination.current,
        pageSize: params.pagination?.pageSize || pagination.pageSize,
        total: response.data.count,
      });
    } catch (error) {
      message.error('Failed to fetch OD slips');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOdSlips();
    fetchEmployees();
  }, [filters, searchText]);

  const handleTableChange = (newPagination, filters) => {
    fetchOdSlips({
      pagination: newPagination,
      filters,
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchText('');
    setFilters({});
    fetchOdSlips({ pagination: { ...pagination, current: 1 } });
  };

  const showAddModal = () => {
    setCurrentOdSlip(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showBulkModal = () => {
    setSelectedEmployees([]);
    bulkForm.resetFields();
    setIsBulkModalVisible(true);
  };

  const showEditModal = (odSlip) => {
    setCurrentOdSlip(odSlip);
    // Find the employee by employee_id from the OD slip data
    const employee = employees.find(e => e.employee_id === odSlip.employee_id);
    form.setFieldsValue({
      ...odSlip,
      employee: employee?.id,
      od_date: odSlip.od_date ? dayjs(odSlip.od_date) : null,
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
      const odSlipData = {
        ...values,
        employee: values.employee,
        od_date: values.od_date?.format('YYYY-MM-DD'),
      };

      Modal.confirm({
        title: currentOdSlip ? 'Confirm Update' : 'Confirm Add',
        content: `Are you sure you want to ${currentOdSlip ? 'update' : 'add'} this OD slip?`,
        onOk: async () => {
          try {
            if (currentOdSlip) {
              await axios.put(`${BASE_URL}/api/odslips/${currentOdSlip.id}/`, odSlipData);
              message.success('OD slip updated successfully');
            } else {
              await axios.post(`${BASE_URL}/api/odslips/`, odSlipData);
              message.success('OD slip added successfully');
            }
            fetchOdSlips();
            setIsModalVisible(false);
          } catch (error) {
            message.error(`Failed to ${currentOdSlip ? 'update' : 'add'} OD slip`);
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
        title: 'Confirm Bulk OD Slips',
        content: `Are you sure you want to add OD slips for ${selectedEmployees.length} employees?`,
        onOk: async () => {
          try {
            const odSlipsData = selectedEmployees.map(employeeId => ({
              employee: employeeId,
              od_date: values.od_date?.format('YYYY-MM-DD'),
              extra_hours: values.extra_hours,
              extra_days: values.extra_days,
              approved_by: values.approved_by,
              reason: values.reason,
            }));

            // Send bulk OD slips to the server
            await Promise.all(odSlipsData.map(odSlip => 
              axios.post(`${BASE_URL}/api/odslips/`, odSlip)
            ));

            message.success(`OD slips added successfully for ${selectedEmployees.length} employees`);
            fetchOdSlips();
            setIsBulkModalVisible(false);
          } catch (error) {
            message.error('Failed to add bulk OD slips');
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
        content: 'Are you sure you want to delete this OD slip?',
        onOk: async () => {
          try {
            await axios.delete(`${BASE_URL}/api/odslips/${id}/`);
            message.success('OD slip deleted successfully');
            fetchOdSlips();
          } catch (error) {
            message.error('Failed to delete OD slip');
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
      title: 'OD Date',
      key: 'od_date',
      render: (_, record) => (
        <span>
          {record.od_date ? dayjs(record.od_date).format('DD/MM/YYYY') : 'N/A'}
        </span>
      ),
      sorter: (a, b) => new Date(a.od_date) - new Date(b.od_date),
    },
    {
      title: 'Extra Hours',
      dataIndex: 'extra_hours',
      key: 'extra_hours',
      render: (hours) => hours ? `${hours} hours` : 'N/A',
    },
    {
      title: 'Extra Days',
      dataIndex: 'extra_days',
      key: 'extra_days',
      render: (days) => days ? `${days} days` : 'N/A',
    },
    {
      title: 'Approved By',
      dataIndex: 'approved_by',
      key: 'approved_by',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (text) => text || 'N/A',
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
            title="Are you sure to delete this OD slip?"
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
          <div className="od-slip-page">
            <Card
              title="OD Slip Management"
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
                    Add OD Slip
                  </Button>
                  <Button type="primary" onClick={showBulkModal}>
                    Bulk Add OD Slips
                  </Button>
                </Space>
              }
            >
              <Table
                columns={columns}
                rowKey="id"
                dataSource={odSlips}
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
                bordered
              />
            </Card>

            {/* Single OD Slip Modal */}
            <Modal
              title={currentOdSlip ? 'Edit OD Slip' : 'Add OD Slip'}
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
                  extra_hours: 0,
                  extra_days: 0,
                  reason: '',
                  approved_by: '',
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
                      notFoundContent={employeeLoading ? "Loading..." : "No employees found"}
                    >
                      {employees?.map(employee => (
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
                    name="od_date"
                    label="OD Date"
                    rules={[{ required: true, message: 'Please select OD date!' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="extra_hours"
                    label="Extra Hours"
                    rules={[{ required: true, message: 'Please input extra hours!' }]}
                  >
                    <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="extra_days"
                    label="Extra Days"
                    rules={[{ required: true, message: 'Please input extra days!' }]}
                  >
                    <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="approved_by"
                    label="Approved By"
                    rules={[{ required: true, message: 'Please input approver name!' }]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="reason"
                    label="Reason"
                    rules={[{ required: true, message: 'Please input reason!' }]}
                  >
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </div>
              </Form>
            </Modal>

            {/* Bulk OD Slip Modal */}
            <Modal
              title="Bulk Add OD Slips"
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
                  extra_hours: 0,
                  extra_days: 0,
                  reason: '',
                  approved_by: '',
                }}
              >
                <Row gutter={16}>
                  <Col span={4.2}>
                    <Form.Item
                      name="od_date"
                      label="OD Date"
                      rules={[{ required: true, message: 'Please select OD date!' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={4.2}>
                    <Form.Item
                      name="extra_hours"
                      label="Extra Hours"
                      rules={[{ required: true, message: 'Please input extra hours!' }]}
                    >
                      <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={4.2}>
                    <Form.Item
                      name="extra_days"
                      label="Extra Days"
                      rules={[{ required: true, message: 'Please input extra days!' }]}
                    >
                      <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={4.2}>
                    <Form.Item
                      name="approved_by"
                      label="Approved By"
                      rules={[{ required: true, message: 'Please input approver name!' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={4.2}>
                    <Form.Item
                      name="reason"
                      label="Reason"
                      rules={[{ required: true, message: 'Please input reason!' }]}
                    >
                      <Input.TextArea rows={1} />
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

export default ODSlipPage;