import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, 
  DatePicker, TimePicker, Space, 
  Card, Pagination, message, Popconfirm, Tag, Row, Col
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

const GatePassPage = () => {
  const [gatePasses, setGatePasses] = useState([]);
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
  const [currentGatePass, setCurrentGatePass] = useState(null);
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Gate Pass Management";

  // Action choices from your model
  const actionChoices = [
    { value: 'FD', label: 'Full Day', color: 'green' },
    { value: 'HD', label: 'Half Day Cut', color: 'orange' },
    { value: 'FD_CUT', label: 'Full Day Cut', color: 'red' },
  ];

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    setEmployeeLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/employees1/`);
      setEmployees(response.data || []);
    } catch (error) {
      message.error('Failed to fetch employees');
      console.error(error);
      setEmployees([]);
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Fetch gate passes with backend filtering
  const fetchGatePasses = async (params = {}) => {
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

      const response = await axios.get(`${BASE_URL}/api/gatepasses/`, { 
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
      
      setGatePasses(response.data.results);
      setPagination({
        ...pagination,
        current: params.pagination?.current || pagination.current,
        pageSize: params.pagination?.pageSize || pagination.pageSize,
        total: response.data.count,
      });
    } catch (error) {
      message.error('Failed to fetch gate passes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatePasses();
    fetchEmployees();
  }, [filters, searchText]);

  const handleTableChange = (newPagination, filters) => {
    fetchGatePasses({
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
    fetchGatePasses({ pagination: { ...pagination, current: 1 } });
  };

  const showAddModal = () => {
    setCurrentGatePass(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (gatePass) => {
    setCurrentGatePass(gatePass);
    form.setFieldsValue({
      ...gatePass,
      employee: gatePass.employee.id,
      date: gatePass.date ? dayjs(gatePass.date) : null,
      out_time: gatePass.out_time ? dayjs(gatePass.out_time, 'HH:mm:ss') : null,
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
      const gatePassData = {
        ...values,
        employee: values.employee,
        date: values.date?.format('YYYY-MM-DD'),
        out_time: values.out_time?.format('HH:mm:ss'),
      };

      Modal.confirm({
        title: currentGatePass ? 'Confirm Update' : 'Confirm Add',
        content: `Are you sure you want to ${currentGatePass ? 'update' : 'add'} this gate pass?`,
        onOk: async () => {
          try {
            if (currentGatePass) {
              await axios.put(`${BASE_URL}/api/gatepasses/${currentGatePass.id}/`, gatePassData);
              message.success('Gate pass updated successfully');
            } else {
              await axios.post(`${BASE_URL}/api/gatepasses/`, gatePassData);
              message.success('Gate pass added successfully');
            }
            fetchGatePasses();
            setIsModalVisible(false);
          } catch (error) {
            message.error(`Failed to ${currentGatePass ? 'update' : 'add'} gate pass`);
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
        content: 'Are you sure you want to delete this gate pass?',
        onOk: async () => {
          try {
            await axios.delete(`${BASE_URL}/api/gatepasses/${id}/`);
            message.success('Gate pass deleted successfully');
            fetchGatePasses();
          } catch (error) {
            message.error('Failed to delete gate pass');
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A',
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Out Time',
      dataIndex: 'out_time',
      key: 'out_time',
      render: (time) => time || 'N/A',
    },
    {
      title: 'Action Taken',
      dataIndex: 'action_taken',
      key: 'action_taken',
      render: (action) => {
        const actionInfo = actionChoices.find(a => a.value === action);
        return <Tag color={actionInfo?.color}>{actionInfo?.label || action}</Tag>;
      },
      filters: actionChoices.map(action => ({ text: action.label, value: action.value })),
      filteredValue: filters.action_taken ? [filters.action_taken] : null,
      onFilter: (value, record) => record.action_taken === value,
    },
    {
      title: 'Approved By',
      dataIndex: 'approved_by',
      key: 'approved_by',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
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
            title="Are you sure to delete this gate pass?"
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
          <div className="gate-pass-page">
            <Card
              title="Gate Pass Management"
              extra={
                <Space>
                  <Input.Search
                    placeholder="Search employees"
                    allowClear
                    enterButton
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onSearch={handleSearch}
                    style={{ width: 300 , maxWidth: '100%'}}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                    Create New Gate Pass
                  </Button>
                </Space>
              }
            >
              <Table
                columns={columns}
                rowKey="id"
                dataSource={gatePasses}
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
                style={{  maxWidth: '99%' }}
                locale={{
    emptyText: searchText ? `No results found for "${searchText}"` : 'No data'
  }}
                bordered
              />
            </Card>

            {/* Gate Pass Modal */}
            <Modal
              title={currentGatePass ? 'Edit Gate Pass' : 'Create New Gate Pass'}
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
                    name="date"
                    label="Date"
                    rules={[{ required: true, message: 'Please select date!' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="out_time"
                    label="Out Time"
                    rules={[{ required: true, message: 'Please select out time!' }]}
                  >
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="action_taken"
                    label="Action Taken"
                    rules={[{ required: true, message: 'Please select action!' }]}
                  >
                    <Select>
                      {actionChoices.map(action => (
                        <Option key={action.value} value={action.value}>
                          <Tag color={action.color}>{action.label}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="approved_by"
                    label="Approved By"
                    rules={[{ required: true, message: 'Please enter approver name!' }]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="reason"
                    label="Reason (Optional)"
                  >
                    <Input.TextArea />
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

export default GatePassPage;