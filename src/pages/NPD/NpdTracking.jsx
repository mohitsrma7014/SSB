import { useState, useEffect, useMemo } from 'react';
import { 
  Table, Pagination, Select, Spin, Progress, Tag, Collapse, Modal, Button, 
  Card, Steps, Timeline, Space, Divider, Typography, Input, Alert 
} from 'antd';
import { 
  FilterOutlined, SearchOutlined, FileSearchOutlined, 
  BarChartOutlined, SyncOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import api from './api';
import NpdDetail from './NpdDetail';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const { Step } = Steps;
const { Panel } = Collapse;
const { Option } = Select;
const { Text, Title } = Typography;

const NpdTracking = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100']
  });
  
  const [filters, setFilters] = useState({
    running_status: '',
    component: '',
    search: ''
  });
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, running: 0, completed: 0 });
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
      const toggleSidebar = () => {
          setIsSidebarVisible(!isSidebarVisible);
      };
      const pageTitle = "NPD Lots Tracking";

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      };
      
      const response = await api.get('/npd-tracking/', { params });
      setComponents(response.data.results);
      setPagination(prev => ({
        ...prev,
        total: response.data.count,
        current: response.data.page,
        pageSize: response.data.page_size,
        totalPages: response.data.total_pages
      }));
      
      // Calculate simple stats
      setStats({
        total: response.data.count,
        running: response.data.results.filter(c => c.running_status === 'running').length,
        completed: response.data.results.filter(c => 
          c.forging_production > 0 && 
          c.heat_treatment_production > 0 &&
          c.final_inspection_production > 0
        ).length
      });
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComponentDetails = async (id) => {
    try {
      setDetailLoading(true);
      const response = await api.get(`/npd-tracking/${id}/`);
      setSelectedComponent(response.data);
    } catch (error) {
      console.error('Error fetching component details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    await fetchComponentDetails(id);
    setModalVisible(true);
  };

  useEffect(() => {
    fetchComponents();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setPagination(prev => ({
      ...prev,
      current: 1,
    }));
  };

  const handleSearch = (e) => {
    handleFilterChange('search', e.target.value);
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'running': 'green',
      'not running': 'red',
      'npd': 'orange',
      'completed': 'blue'
    };
    return statusMap[status?.toLowerCase()] || 'gray';
  };

  const getStatusTag = (status) => {
    const statusText = status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN';
    return (
      <Tag color={getStatusColor(status)}>
        {statusText}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {record.running_status === 'npd' && <Tag color="orange">NPD</Tag>}
          {record.running_status === 'completed' && <Tag icon={<CheckCircleOutlined />} color="success">COMPLETED</Tag>}
        </Space>
      ),
    },
    {
      title: 'Part Name',
      dataIndex: 'part_name',
      key: 'part_name',
      ellipsis: true,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      width: 150,
    },
    {
      title: 'Status',
      dataIndex: 'running_status',
      key: 'running_status',
      render: getStatusTag,
     
      onFilter: (value, record) => record.running_status.toLowerCase() === value,
    },
    
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<FileSearchOutlined />} 
          onClick={() => handleViewDetails(record.id)}
          style={{ color: '#1890ff' }}
        />
      ),
    },
  ];

  const filteredComponents = useMemo(() => {
    if (!filters.search) return components;
    const searchTerm = filters.search.toLowerCase();
    return components.filter(comp => 
      comp.component.toLowerCase().includes(searchTerm) ||
      comp.part_name?.toLowerCase()?.includes(searchTerm) ||
      comp.customer?.toLowerCase()?.includes(searchTerm)
    );
  }, [components, filters.search]);

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
    <div className="npd-tracking-container">
      <Card 
        title={<Title level={4} style={{ margin: 0 }}><BarChartOutlined /> NPD Lots Tracking</Title>}
        extra={
          <Space>
            <Input
              placeholder="Search components..."
              prefix={<SearchOutlined />}
              onChange={handleSearch}
              style={{ width: 250 }}
              allowClear
            />
            <Button 
              icon={<SyncOutlined />} 
              onClick={fetchComponents}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          

         

          <Spin spinning={loading} tip="Loading NPD components...">
            <Table
              columns={columns}
              dataSource={filteredComponents}
              rowKey="id"
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 'max-content' }}
              bordered
              size="middle"
              className="npd-table"
            />
          </Spin>
        </Space>
      </Card>

      <Modal
        title={
          <Space>
            <FileSearchOutlined />
            {selectedComponent ? `NPD Tracking: ${selectedComponent.component_details?.component}` : 'Loading...'}
          </Space>
        }
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width="90%"
        style={{ top: 0 }}
        bodyStyle={{ padding: 0 }}
        destroyOnClose
      >
        <Spin spinning={detailLoading} tip="Loading component details...">
          {selectedComponent && <NpdDetail component={selectedComponent} />}
        </Spin>
      </Modal>
    </div>
                </main>
            </div>
        </div>
  );
};

export default NpdTracking;