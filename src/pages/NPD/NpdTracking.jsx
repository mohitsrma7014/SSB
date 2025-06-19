import { useState, useEffect, useMemo } from 'react';
import { 
  Table, Pagination, Select, Spin, Progress, Tag, Card, 
  Space, Typography, Input, Alert, Tabs, Descriptions, Button, 
  Modal, Badge, Collapse
} from 'antd';
import { 
  SearchOutlined, SyncOutlined, DownloadOutlined,
  InfoCircleOutlined, FileDoneOutlined, ToolOutlined, 
  FireOutlined, ShoppingOutlined, EyeOutlined, PlusOutlined,
  DownOutlined, UpOutlined 
} from '@ant-design/icons';
import api from './api';
import { exportFilteredData } from './excelExport';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const { TabPane } = Tabs;
const { Option } = Select;
const { Text, Title } = Typography;
const { Panel } = Collapse;

const NpdTracking = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 100,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100']
  });
  
  const [filters, setFilters] = useState({
    running_status: '',
    component: '',
    search: ''
  });
  
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState({ total: 0, running: 0, completed: 0, npd: 0 });
  const [expandedBatches, setExpandedBatches] = useState({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    
      const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
      };
      const pageTitle = "NPD Tracking Sheet"; // Set the page title here

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      };
      
      const response = await api.get('/npd-tracking/', { params });
      
      if (!response.data || !Array.isArray(response.data.results)) {
        throw new Error('Invalid data format received from API');
      }
      
      const formattedData = response.data.results.map(item => {
        const component = item.component_details;
        
        // Get unique raw material batches
        const rawMaterialBatches = item.blockmt 
          ? [...new Set(item.blockmt.map(rm => rm.block_mt_id))] 
          : [];
        
        // Calculate batch-wise progress
        const batchProgress = calculateBatchProgress(item);
        
        // Calculate overall progress (based on 5 lots)
        const overallProgress = calculateOverallProgress(item);
        
        return {
          ...item,
          key: component.id,
          component: component.component || '-',
          part_name: component.part_name || '-',
          customer: component.customer || '-',
          running_status: component.running_status || 'unknown',
          rawMaterialBatches,
          batchProgress,
          overallProgress
        };
      });
      
      setData(formattedData);
      
      setPagination(prev => ({
        ...prev,
        total: response.data.count || 0,
        current: response.data.page || 1,
        pageSize: response.data.page_size || 10,
      }));
      
      // Calculate stats
      const running = formattedData.filter(c => c.running_status.toLowerCase() === 'running').length;
      const completed = formattedData.filter(c => c.running_status.toLowerCase() === 'completed').length;
      const npd = formattedData.filter(c => c.running_status.toLowerCase() === 'npd').length;
      
      setStats({
        total: formattedData.length,
        running,
        completed,
        npd
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.error('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress for each batch
  const calculateBatchProgress = (record) => {
    if (!record) return {};
    
    const batches = {};
    
    // Get all unique batch numbers across processes
    const allBatches = new Set();
    
    // Collect batch numbers from each process
    [record.forging, record.heat_treatment, record.cnc_machining, record.final_inspection, record.dispatch].forEach(process => {
      if (process && Array.isArray(process)) {
        process.forEach(item => {
          if (item.batch_number) {
            allBatches.add(item.batch_number);
          }
        });
      }
    });
    
    // Calculate progress for each batch
    Array.from(allBatches).forEach(batch => {
      const steps = [
        record.forging?.some(f => f.batch_number === batch),
        record.heat_treatment?.some(ht => ht.batch_number === batch),
        record.cnc_machining?.some(cnc => cnc.batch_number === batch),
        record.final_inspection?.some(fi => fi.batch_number === batch),
        record.dispatch?.some(d => d.batch_number === batch)
      ];
      
      const completedSteps = steps.filter(Boolean).length;
      batches[batch] = Math.round((completedSteps / steps.length) * 100);
    });
    
    return batches;
  };

  // Calculate overall progress based on 5 lots
  const calculateOverallProgress = (record) => {
    if (!record.dispatch) return 0;
    
    // Count dispatched lots
    const dispatchedLots = record.dispatch.length;
    
    // Calculate progress (100% when 5 lots are dispatched)
    return Math.min(100, Math.round((dispatchedLots / 5) * 100));
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSearch = (e) => {
    handleFilterChange('search', e.target.value);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'running': { color: 'green', text: 'RUNNING' },
      'completed': { color: 'blue', text: 'COMPLETED' },
      'npd': { color: 'orange', text: 'NPD' },
      'default': { color: 'gray', text: 'UNKNOWN' }
    };
    
    const config = statusMap[status?.toLowerCase()] || statusMap.default;
    
    return (
      <Tag color={config.color}>
        {config.text}
      </Tag>
    );
  };

  const toggleBatchDetails = (recordKey) => {
    setExpandedBatches(prev => ({
      ...prev,
      [recordKey]: !prev[recordKey]
    }));
  };

  const showDetailModal = (record) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
      render: (text) => <Text strong>{text || '-'}</Text>,
      width: 150,
      fixed: 'left'
    },
    {
      title: 'Part Name',
      dataIndex: 'part_name',
      key: 'part_name',
      render: (text) => text || '-',
      width: 150
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: (text) => text || '-',
      width: 150
    },
    {
      title: 'Status',
      dataIndex: 'running_status',
      key: 'running_status',
      render: getStatusTag,
      width: 60,
      filters: [
        { text: 'NPD', value: 'npd' },
        { text: 'Running', value: 'running' },
        { text: 'Completed', value: 'completed' },
      ],
      onFilter: (value, record) => record.running_status?.toLowerCase() === value,
    },
    {
      title: 'Raw Material Batches',
      key: 'raw_material',
      render: (_, record) => (
        <div>
          {record.rawMaterialBatches.length > 0 ? (
            <Text>{record.rawMaterialBatches.length} batch(es)</Text>
          ) : (
            <Text type="secondary">No batches</Text>
          )}
        </div>
      ),
      width: 150
    },
    {
      title: 'Batch Progress',
      key: 'batch_progress',
      render: (_, record) => (
        <div>
          {Object.keys(record.batchProgress).length > 0 ? (
            <Space direction="vertical" size="small">
              {Object.entries(record.batchProgress).map(([batch, progress]) => (
                <Progress 
                  key={batch}
                  percent={progress} 
                  size="small" 
                  status={progress === 100 ? 'success' : 'active'}
                  format={() => `Batch ${batch}: ${progress}%`}
                />
              ))}
            </Space>
          ) : (
            <Text type="secondary">No batch progress</Text>
          )}
        </div>
      ),
      width: 200
    },
    {
      title: 'Overall Progress',
      key: 'overall_progress',
      render: (_, record) => (
        <Progress 
          percent={record.overallProgress} 
          size="small" 
          status={record.overallProgress === 100 ? 'success' : 'active'}
          format={() => `${record.overallProgress}% (${record.dispatch?.length || 0}/5 lots)`}
        />
      ),
      width: 180
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Space>
          {/* <Button 
            type="primary" 
            icon={expandedBatches[record.key] ? <UpOutlined /> : <DownOutlined />} 
            onClick={() => toggleBatchDetails(record.key)}
            size="small"
          /> */}
          <Button 
            type="primary" 
            icon={<InfoCircleOutlined />} 
            onClick={() => showDetailModal(record)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  const filteredComponents = useMemo(() => {
    if (!filters.search) return data;
    const searchTerm = filters.search.toLowerCase();
    return data.filter(comp => 
      (comp.component?.toLowerCase()?.includes(searchTerm)) ||
      (comp.part_name?.toLowerCase()?.includes(searchTerm)) ||
      (comp.customer?.toLowerCase()?.includes(searchTerm))
    );
  }, [data, filters.search]);

  const renderBatchDetails = (record) => {
    if (!expandedBatches[record.key]) return null;
    
    return (
      <div style={{ padding: '16px', background: '#fafafa', marginBottom: '16px' }}>
        <Title level={5} style={{ marginBottom: '16px' }}>Batch Details</Title>
        
        {Object.keys(record.batchProgress).map(batch => (
          <Card 
            key={batch} 
            title={`Batch ${batch}`} 
            size="small" 
            style={{ marginBottom: '16px' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Progress 
                percent={record.batchProgress[batch]} 
                status={record.batchProgress[batch] === 100 ? 'success' : 'active'}
                format={() => `Batch Progress: ${record.batchProgress[batch]}%`}
              />
              
              <Tabs size="small">
                {record.forging?.filter(f => f.batch_number === batch).length > 0 && (
                  <TabPane tab="Forging" key="forging">
                    <Descriptions bordered size="small" column={3}>
                      <Descriptions.Item label="Total Pieces">
                        {record.forging.find(f => f.batch_number === batch)?.production || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Target">
                        {record.forging.find(f => f.batch_number === batch)?.target || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date">
                        {record.forging.find(f => f.batch_number === batch)?.date || '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                )}
                
                {record.heat_treatment?.filter(ht => ht.batch_number === batch).length > 0 && (
                  <TabPane tab="Heat Treatment" key="heat_treatment">
                    <Descriptions bordered size="small" column={3}>
                      <Descriptions.Item label="Total Pieces">
                        {record.heat_treatment.find(ht => ht.batch_number === batch)?.production || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Target">
                        {record.heat_treatment.find(ht => ht.batch_number === batch)?.target || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date">
                        {record.heat_treatment.find(ht => ht.batch_number === batch)?.date || '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                )}
                
                {record.cnc_machining?.filter(cnc => cnc.batch_number === batch).length > 0 && (
                  <TabPane tab="CNC Machining" key="cnc_machining">
                    <Descriptions bordered size="small" column={3}>
                      <Descriptions.Item label="Total Pieces">
                        {record.cnc_machining.find(cnc => cnc.batch_number === batch)?.production || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Setup">
                        {record.cnc_machining.find(cnc => cnc.batch_number === batch)?.Setup || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date">
                        {record.cnc_machining.find(cnc => cnc.batch_number === batch)?.date || '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                )}
                
                {record.final_inspection?.filter(fi => fi.batch_number === batch).length > 0 && (
                  <TabPane tab="Inspection" key="inspection">
                    <Descriptions bordered size="small" column={3}>
                      <Descriptions.Item label="Total Pieces">
                        {record.final_inspection.find(fi => fi.batch_number === batch)?.production || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date">
                        {record.final_inspection.find(fi => fi.batch_number === batch)?.date || '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                )}
                
                {record.dispatch?.filter(d => d.batch_number === batch).length > 0 && (
                  <TabPane tab="Dispatch" key="dispatch">
                    <Descriptions bordered size="small" column={3}>
                      <Descriptions.Item label="Quantity">
                        {record.dispatch.find(d => d.batch_number === batch)?.pices || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date">
                        {record.dispatch.find(d => d.batch_number === batch)?.date || '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                )}
              </Tabs>
            </Space>
          </Card>
        ))}
      </div>
    );
  };

  const renderProcessDetail = (processData, fields, batchNumber = null) => {
    if (!processData || processData.length === 0) {
      return <Alert message="No data available for this process" type="info" showIcon />;
    }
    
    // Filter by batch number if provided
    const itemsToShow = batchNumber 
      ? processData.filter(item => item.batch_number === batchNumber)
      : processData;
    
    if (itemsToShow.length === 0) {
      return <Alert message={`No data available for batch ${batchNumber}`} type="info" showIcon />;
    }
    
    return (
      <Table 
        dataSource={itemsToShow}
        columns={fields.map(field => ({
          title: field.label,
          dataIndex: field.key,
          key: field.key,
          render: (value) => value || '-'
        }))}
        size="small"
        pagination={false}
        bordered
        rowKey={(record) => `${record.id || Math.random()}`}
      />
    );
  };

  const renderModalContent = () => {
    if (!selectedRecord) return <Spin tip="Loading details..." />;
    
    return (
      <Tabs defaultActiveKey="1">
        <TabPane tab="Raw Material" key="1">
          {selectedRecord.blockmt?.length > 0 ? (
            <Table 
              dataSource={selectedRecord.blockmt}
              columns={[
                { title: 'Batch ID', dataIndex: 'block_mt_id', key: 'block_mt_id' },
                { title: 'Supplier', dataIndex: 'supplier', key: 'supplier' },
                { title: 'Grade', dataIndex: 'grade', key: 'grade' },
                { title: 'Heat No', dataIndex: 'heatno', key: 'heatno' },
                { title: 'Dia', dataIndex: 'dia', key: 'dia' },
                { title: 'Weight', dataIndex: 'weight', key: 'weight' },
                { title: 'Verified By', dataIndex: 'verified_by', key: 'verified_by' }
              ]}
              size="small"
              pagination={false}
              bordered
            />
          ) : (
            <Alert message="No raw material data available" type="info" showIcon />
          )}
        </TabPane>
        
        <TabPane tab="Batch Progress" key="2">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={5}>Overall Progress</Title>
            <Progress 
              percent={selectedRecord.overallProgress} 
              status={selectedRecord.overallProgress === 100 ? 'success' : 'active'}
              format={() => `${selectedRecord.overallProgress}% (${selectedRecord.dispatch?.length || 0}/5 lots dispatched)`}
            />
            
            <Title level={5}>Batch-wise Progress</Title>
            {Object.keys(selectedRecord.batchProgress).length > 0 ? (
              Object.entries(selectedRecord.batchProgress).map(([batch, progress]) => (
                <Collapse key={batch}>
                  <Panel 
                    header={
                      <Space>
                        <Text strong>Batch {batch}</Text>
                        <Progress 
                          percent={progress} 
                          status={progress === 100 ? 'success' : 'active'}
                          size="small"
                          showInfo={false}
                          style={{ width: '200px' }}
                        />
                        <Text>{progress}% complete</Text>
                      </Space>
                    } 
                    key={batch}
                  >
                    <Tabs size="small">
                      <TabPane tab="Forging" key="forging">
                        {renderProcessDetail(selectedRecord.forging, [
                          { label: 'Date', key: 'date' },
                          { label: 'Production', key: 'production' },
                          { label: 'Target', key: 'target' },
                          { label: 'Verified By', key: 'verified_by' }
                        ], batch)}
                      </TabPane>
                      
                      <TabPane tab="Heat Treatment" key="heat_treatment">
                        {renderProcessDetail(selectedRecord.heat_treatment, [
                          { label: 'Date', key: 'date' },
                          { label: 'Production', key: 'production' },
                          { label: 'Target', key: 'target' },
                          { label: 'Verified By', key: 'verified_by' }
                        ], batch)}
                      </TabPane>
                      
                      <TabPane tab="CNC Machining" key="cnc_machining">
                        {renderProcessDetail(selectedRecord.cnc_machining, [
                          { label: 'Date', key: 'date' },
                          { label: 'Production', key: 'production' },
                          { label: 'Setup', key: 'Setup' },
                          { label: 'Verified By', key: 'verified_by' }
                        ], batch)}
                      </TabPane>
                      
                      <TabPane tab="Inspection" key="inspection">
                        {renderProcessDetail(selectedRecord.final_inspection, [
                          { label: 'Date', key: 'date' },
                          { label: 'Production', key: 'production' },
                          { label: 'Verified By', key: 'verified_by' }
                        ], batch)}
                      </TabPane>
                      
                      <TabPane tab="Dispatch" key="dispatch">
                        {renderProcessDetail(selectedRecord.dispatch, [
                          { label: 'Date', key: 'date' },
                          { label: 'Quantity', key: 'production' },
                          { label: 'Verified By', key: 'verified_by' }
                        ], batch)}
                      </TabPane>
                    </Tabs>
                  </Panel>
                </Collapse>
              ))
            ) : (
              <Alert message="No batch progress data available" type="info" showIcon />
            )}
          </Space>
        </TabPane>
      </Tabs>
    );
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
      <main className="flex flex-col mt-20  justify-center flex-grow pl-2">
    <div style={{ padding: '0px' }}>
      <Card 
        title={<Title level={4}>NPD Tracking</Title>}
        extra={
          <Space>
            <Input
              placeholder="Search components..."
              prefix={<SearchOutlined />}
              onChange={handleSearch}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder="Filter by status"
              style={{ width: 150 }}
              onChange={(value) => handleFilterChange('running_status', value)}
              allowClear
            >
              <Option value="npd">NPD</Option>
              <Option value="running">Running</Option>
              <Option value="completed">Completed</Option>
            </Select>
            <Button 
              icon={<SyncOutlined />} 
              onClick={fetchData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => exportFilteredData(filteredComponents, filters)}
              disabled={filteredComponents.length === 0}
            >
              Export
            </Button>
          </Space>
        }
      >
        <Descriptions size="small" column={4} style={{ marginBottom: 16 }}>
         
          <Descriptions.Item label="Current Total NPD Parts">
            <Tag color="orange">{stats.npd}</Tag>
          </Descriptions.Item>
        </Descriptions>

        <Spin spinning={loading} tip="Loading data...">
          <Table
            columns={columns}
            dataSource={filteredComponents}
            rowKey="key"
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
            bordered
            size="middle"
            style={{ whiteSpace: 'nowrap' }}
            expandable={{
              expandedRowRender: record => renderBatchDetails(record),
              rowExpandable: record => Object.keys(record.batchProgress).length > 0,
              expandRowByClick: false
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={`Component Details: ${selectedRecord?.component || ''}`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
      >
        {selectedRecord && (
          <Descriptions bordered column={3} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Part Name">{selectedRecord.part_name}</Descriptions.Item>
            <Descriptions.Item label="Customer">{selectedRecord.customer}</Descriptions.Item>
            <Descriptions.Item label="Status">{getStatusTag(selectedRecord.running_status)}</Descriptions.Item>
            <Descriptions.Item label="Raw Material Batches">
              {selectedRecord.rawMaterialBatches.length > 0 ? (
                selectedRecord.rawMaterialBatches.join(', ')
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Total Batches">
              {Object.keys(selectedRecord.batchProgress).length}
            </Descriptions.Item>
            <Descriptions.Item label="Dispatched Lots">
              {selectedRecord.dispatch?.length || 0}/5
            </Descriptions.Item>
          </Descriptions>
        )}
        {renderModalContent()}
      </Modal>
    </div>
    </main>
    </div>
    </div>
  );
};

export default NpdTracking;