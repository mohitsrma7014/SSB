// src/pages/NpdTracking.jsx
import { useState, useEffect } from 'react';
import { Table, Pagination, Select, Spin, Progress, Tag, Collapse, Modal, Button } from 'antd';
import { FilterOutlined, PlusOutlined } from '@ant-design/icons';
import api from './api';
import NpdDetail from './NpdDetail';

const { Panel } = Collapse;
const { Option } = Select;

const NpdTracking = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    running_status: '',
    component: '',
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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
      setPagination({
        ...pagination,
        total: response.data.count,
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

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'green';
      case 'not running': return 'red';
      case 'npd': return 'orange';
      default: return 'gray';
    }
  };

  const getStageStatus = (component, stage) => {
    if (stage === 'forging' && component.forging_production > 0) return 'completed';
    if (stage === 'heat_treatment' && component.heat_treatment_production > 0) return 'completed';
    return 'pending';
  };

  const columns = [
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
      render: (text, record) => (
        <span>
          {text}
          {record.running_status === 'npd' && <Tag color="orange" style={{ marginLeft: 8 }}>NPD</Tag>}
        </span>
      ),
    },
    {
      title: 'Part Name',
      dataIndex: 'part_name',
      key: 'part_name',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Status',
      dataIndex: 'running_status',
      key: 'running_status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const totalStages = 7;
        const completedStages = [
          record.forging_production > 0,
          record.heat_treatment_production > 0,
        ].filter(Boolean).length;
        const percent = Math.round((completedStages / totalStages) * 100);
        
        return (
          <Progress 
            percent={percent} 
            status={percent === 100 ? 'success' : 'active'} 
            strokeColor={percent === 100 ? '#52c41a' : '#1890ff'}
          />
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<PlusOutlined />} 
          onClick={() => handleViewDetails(record.id)}
        />
      ),
    },
  ];

  const expandedRowRender = (record) => {
    const stages = [
      { name: 'Material Issued', key: 'material_issued' },
      { name: 'Forging', key: 'forging' },
      { name: 'Heat Treatment', key: 'heat_treatment' },
      { name: 'Pre-Machining', key: 'pre_machining' },
      { name: 'CNC Machining', key: 'cnc_machining' },
      { name: 'Marking', key: 'marking' },
      { name: 'Visual Inspection', key: 'visual_inspection' },
      { name: 'Final Inspection', key: 'final_inspection' },
      { name: 'Dispatch', key: 'dispatch' },
    ];

    return (
      <div style={{ margin: 0 }}>
        <h4>Process Flow for Batch: {record.batch_number || 'N/A'}</h4>
        <div className="process-flow">
          {stages.map((stage) => (
            <div 
              key={stage.key}
              className={`process-stage ${getStageStatus(record, stage.key)}`}
            >
              <div className="stage-name">{stage.name}</div>
              <div className="stage-status">
                {getStageStatus(record, stage.key) === 'completed' ? (
                  <Tag color="success">Completed</Tag>
                ) : (
                  <Tag color="default">Pending</Tag>
                )}
              </div>
              {record[`${stage.key}_date`] && (
                <div className="stage-date">
                  {new Date(record[`${stage.key}_date`]).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="npd-tracking-container">
      <div className="page-header">
        <h2>NPD Lots Tracking</h2>
        <div className="filters">
          <Select
            placeholder="Filter by Status"
            style={{ width: 200, marginRight: 16 }}
            allowClear
            onChange={(value) => handleFilterChange('running_status', value)}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="Running">Running</Option>
            <Option value="not running">Not Running</Option>
            <Option value="npd">NPD</Option>
          </Select>
          
          <Select
            placeholder="Filter by Component"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => handleFilterChange('component', value)}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {Array.from(new Set(components.map(item => item.component))).map(comp => (
              <Option key={comp} value={comp}>{comp}</Option>
            ))}
          </Select>
        </div>
      </div>
      
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={components}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          expandable={{
            expandedRowRender,
            expandedRowKeys: expandedRows,
            onExpand: (expanded, record) => {
              setExpandedRows(expanded ? [record.id] : []);
            },
          }}
        />
      </Spin>

      <Modal
        title={selectedComponent ? `NPD Tracking: ${selectedComponent.component}` : 'Loading...'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
      >
        <Spin spinning={detailLoading}>
          {selectedComponent && <NpdDetail component={selectedComponent} />}
        </Spin>
      </Modal>
    </div>
  );
};

export default NpdTracking;