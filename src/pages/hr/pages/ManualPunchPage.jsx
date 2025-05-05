import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, 
  DatePicker, TimePicker, Space, 
  Card, Pagination, message, Popconfirm, Tag 
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

const ManualPunchPage = () => {
  const [punches, setPunches] = useState([]);
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
  const [currentPunch, setCurrentPunch] = useState(null);
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
   const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    
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
  // Fetch manual punches with backend filtering
  const fetchPunches = async (params = {}) => {
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

      const response = await axios.get(`${BASE_URL}/api/manualpunches/`, { 
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
      
      setPunches(response.data.results);
      setPagination({
        ...pagination,
        current: params.pagination?.current || pagination.current,
        pageSize: params.pagination?.pageSize || pagination.pageSize,
        total: response.data.count,
      });
    } catch (error) {
      message.error('Failed to fetch manual punches');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPunches();
    fetchEmployees();
  }, [filters, searchText]);

  const handleTableChange = (newPagination, filters) => {
    fetchPunches({
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
    fetchPunches({ pagination: { ...pagination, current: 1 } });
  };

  const showAddModal = () => {
    setCurrentPunch(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (punch) => {
    setCurrentPunch(punch);
    // Find the employee by employee_id from the punch data
    const employee = employees.find(e => e.employee_id === punch.employee_id);
    form.setFieldsValue({
      ...punch,
      employee: employee?.id,
      punch_in_time: punch.punch_in_time ? dayjs(punch.punch_in_time) : null,
      punch_out_time: punch.punch_out_time ? dayjs(punch.punch_out_time) : null,
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
      const punchData = {
        ...values,
        employee: values.employee,
        punch_in_time: values.punch_in_time?.format('YYYY-MM-DD HH:mm:ss'),
        punch_out_time: values.punch_out_time?.format('YYYY-MM-DD HH:mm:ss'),
      };

      Modal.confirm({
        title: currentPunch ? 'Confirm Update' : 'Confirm Add',
        content: `Are you sure you want to ${currentPunch ? 'update' : 'add'} this manual punch?`,
        onOk: async () => {
          try {
            if (currentPunch) {
              await axios.put(`${BASE_URL}/api/manualpunches/${currentPunch.id}/`, punchData);
              message.success('Manual punch updated successfully');
            } else {
              await axios.post(`${BASE_URL}/api/manualpunches/`, punchData);
              message.success('Manual punch added successfully');
            }
            fetchPunches();
            setIsModalVisible(false);
          } catch (error) {
            message.error(`Failed to ${currentPunch ? 'update' : 'add'} manual punch`);
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
        content: 'Are you sure you want to delete this manual punch?',
        onOk: async () => {
          try {
            await axios.delete(`${BASE_URL}/api/manualpunches/${id}/`);
            message.success('Manual punch deleted successfully');
            fetchPunches();
          } catch (error) {
            message.error('Failed to delete manual punch');
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
      title: 'Punch In',
      key: 'punch_in',
      render: (_, record) => (
        <span>
          {record.punch_in_time ? dayjs(record.punch_in_time).format('DD/MM/YYYY HH:mm') : 'Not Recorded'}
        </span>
      ),
      sorter: (a, b) => new Date(a.punch_in_time) - new Date(b.punch_in_time),
    },
    {
      title: 'Punch Out',
      key: 'punch_out',
      render: (_, record) => (
        <span>
          {record.punch_out_time ? dayjs(record.punch_out_time).format('DD/MM/YYYY HH:mm') : 'Not Recorded'}
        </span>
      ),
      sorter: (a, b) => new Date(a.punch_out_time) - new Date(b.punch_out_time),
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
            title="Are you sure to delete this punch?"
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
    <div className="manual-punch-page">
      <Card
        title="Manual Punch Management"
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
              Add Manual Punch
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          rowKey="id"
          dataSource={punches}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          bordered
        />
      </Card>

      <Modal
        title={currentPunch ? 'Edit Manual Punch' : 'Add Manual Punch'}
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
              name="punch_in_time"
              label="Punch In Time"
            >
              <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="punch_out_time"
              label="Punch Out Time"
            >
              <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
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
      </div>

      </main>
      </div>
      </div>
  );
};

export default ManualPunchPage;