import { Card, Timeline, Tag, Progress, Descriptions, Collapse, Divider, Badge, Row, Col, Table, Space, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Title, Text } = Typography;

const NpdDetail = ({ component }) => {
  const stageKeys = [
    'material_issued',
    'forging',
    'heat_treatment',
    'pre_machining',
    'cnc_machining',
    'marking',
    'visual_inspection',
    'final_inspection',
    'dispatch'
  ];

  const stages = stageKeys.map(key => ({
    key,
    name: key
      .split('_')
      .map(k => k.charAt(0).toUpperCase() + k.slice(1))
      .join(' ')
  }));

  // Group data by batch (block_mt_id)
  const batchData = {};
  
  component.batch_tracking?.forEach(tracking => {
    if (!batchData[tracking.batch_number]) {
      batchData[tracking.batch_number] = {
        stages: {}
      };
    }
    if (!batchData[tracking.batch_number].stages.material_issued) {
      batchData[tracking.batch_number].stages.material_issued = [];
    }
    batchData[tracking.batch_number].stages.material_issued.push({
      ...tracking,
      date: tracking.material_issued_date,
      production: tracking.material_issued_production
    });
  });

  component.blockmt?.forEach(block => {
    if (!batchData[block.block_mt_id]) {
      batchData[block.block_mt_id] = {
        blockInfo: block,
        stages: {}
      };
    } else {
      batchData[block.block_mt_id].blockInfo = block;
    }
  });

  stages.slice(1).forEach(stage => {
    const stageEntries = component[stage.key] || [];
    stageEntries.forEach(entry => {
      if (entry.batch_number && batchData[entry.batch_number]) {
        if (!batchData[entry.batch_number].stages[stage.key]) {
          batchData[entry.batch_number].stages[stage.key] = [];
        }
        batchData[entry.batch_number].stages[stage.key].push(entry);
      }
    });
  });

  const completedBatches = Object.values(batchData).filter(batch => 
    batch.stages.dispatch?.length > 0
  ).length;
  const isNpdCompleted = completedBatches >= 5;

  const getOverallProgress = () => {
    if (Object.keys(batchData).length === 0) return 0;
    
    let totalStagesCompleted = 0;
    let totalPossibleStages = 0;
    
    Object.values(batchData).forEach(batch => {
      const batchStages = Object.keys(batch.stages);
      totalStagesCompleted += batchStages.length;
      
      const lastCompletedStageIndex = Math.max(...batchStages.map(k => stageKeys.indexOf(k)));
      totalPossibleStages += lastCompletedStageIndex + 1;
    });
    
    return Math.round((totalStagesCompleted / totalPossibleStages) * 100);
  };

  const getProcessTimeForBatch = (batch) => {
    const firstStage = batch.stages.material_issued?.[0]?.date;
    const lastStage = batch.stages.dispatch?.[0]?.date;
    
    if (!firstStage || !lastStage) return 'N/A';
    
    const start = new Date(firstStage);
    const end = new Date(lastStage);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const getBatchStatus = (batch) => {
    if (batch.stages.dispatch?.length > 0) return 'completed';
    if (Object.keys(batch.stages).length > 0) return 'in-progress';
    return 'not-started';
  };

  const getBatchProgress = (batch) => {
    const completedStages = Object.keys(batch.stages).length;
    const lastStageIndex = Math.max(...Object.keys(batch.stages).map(k => stageKeys.indexOf(k)));
    const totalPossibleStages = lastStageIndex + 1;
    
    return Math.round((completedStages / totalPossibleStages) * 100);
  };

  const stageColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
      responsive: ['md']
    },
    {
      title: 'Pieces/Qty',
      dataIndex: 'production',
      key: 'production',
      render: (production, record) => (
        <Text strong>
          {production || 'N/A'}
        </Text>
      )
    },
    {
      title: 'Verified By',
      dataIndex: 'verified_by',
      key: 'verified_by',
      render: (verified_by) => verified_by || 'N/A',
      responsive: ['md']
    },
    {
      title: 'Remarks',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark) => remark ? <Text type="secondary">{remark}</Text> : 'None',
      responsive: ['lg']
    }
  ];

  return (
    <div className="npd-detail-container" style={{ padding: '16px' }}>
      <Card 
        bordered={false} 
        style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size="small">
              <Title level={3} style={{ margin: 0 }}>
                {component.component_details?.component || 'Component'} Details
              </Title>
              <Text type="secondary">{component.component_details?.part_name}</Text>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Tag 
                color={getStatusColor(component.component_details?.running_status)}
                style={{ fontSize: 14, padding: '4px 8px' }}
              >
                {component.component_details?.running_status?.toUpperCase() || 'UNKNOWN'}
              </Tag>
              {isNpdCompleted && (
                <Tag 
                  icon={<CheckCircleOutlined />} 
                  color="success" 
                  style={{ fontSize: 14, padding: '4px 8px' }}
                >
                  NPD Process Completed
                </Tag>
              )}
            </Space>
          </Col>
        </Row>
      </Card>
      
      <Card 
        title="Component Overview" 
        bordered={false} 
        style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
      >
        <Descriptions 
          bordered 
          column={{ xs: 1, sm: 2 }} 
          size="middle"
          labelStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item label="Customer">{component.component_details?.customer || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Material Grade">{component.component_details?.material_grade || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Slug Weight">{component.component_details?.slug_weight || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Drawing Number">{component.component_details?.drawing_number || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Forging Line">{component.component_details?.forging_line || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Batch Progress">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Progress 
                percent={Math.round((completedBatches / 5) * 100)} 
                status={isNpdCompleted ? 'success' : 'active'} 
                strokeWidth={12}
                strokeColor={isNpdCompleted ? '#52c41a' : '#1890ff'}
              />
              <Text type="secondary">
                {completedBatches} of 5 lots dispatched
              </Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Overall Progress">
            <Progress 
              percent={getOverallProgress()} 
              status="active" 
              strokeWidth={12}
              strokeColor={getOverallProgress() === 100 ? '#52c41a' : '#1890ff'}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card 
        title={<span style={{ fontSize: 18 }}>Batch Progress Tracking</span>}
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
      >
        {Object.keys(batchData).length > 0 ? (
          <Collapse accordion expandIconPosition="right" ghost>
            {Object.entries(batchData).map(([batchId, batch]) => (
              <Panel 
                header={
                  <Row align="middle" gutter={16} style={{ padding: '8px 0' }}>
                    <Col flex="none">
                      <Badge 
                        status={
                          getBatchStatus(batch) === 'completed' ? 'success' : 
                          getBatchStatus(batch) === 'in-progress' ? 'processing' : 'default'
                        } 
                      />
                    </Col>
                    <Col flex="auto">
                      <Text strong>Batch: {batchId}</Text>
                    </Col>
                    <Col flex="none">
                      <Progress 
                        percent={getBatchProgress(batch)} 
                        status={getBatchStatus(batch) === 'completed' ? 'success' : 'active'}
                        size="small" 
                        style={{ width: 150 }}
                        showInfo={false}
                      />
                    </Col>
                    {getBatchStatus(batch) === 'completed' && (
                      <Col flex="none">
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                          Completed in {getProcessTimeForBatch(batch)}
                        </Tag>
                      </Col>
                    )}
                  </Row>
                }
                key={batchId}
                extra={
                  <Tag color={getBatchStatus(batch) === 'completed' ? 'success' : 'processing'}>
                    {getBatchStatus(batch).replace('-', ' ').toUpperCase()}
                  </Tag>
                }
              >
                {batch.blockInfo && (
                  <Card 
                    size="small" 
                    style={{ marginBottom: 24, borderLeft: '4px solid #1890ff' }}
                    title={<Text strong>Batch Information</Text>}
                  >
                    <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                      <Descriptions.Item label="Supplier">{batch.blockInfo.supplier || 'N/A'}</Descriptions.Item>
                      <Descriptions.Item label="Heat No">{batch.blockInfo.heatno || 'N/A'}</Descriptions.Item>
                      <Descriptions.Item label="Pieces">{batch.blockInfo.pices || 'N/A'}</Descriptions.Item>
                      <Descriptions.Item label="Weight">{batch.blockInfo.weight || 'N/A'}</Descriptions.Item>
                      <Descriptions.Item label="Created At">
                        {batch.blockInfo.created_at ? new Date(batch.blockInfo.created_at).toLocaleString() : 'N/A'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}
                
                <Title level={5} style={{ marginBottom: 16 }}>Process Timeline</Title>
                <Timeline mode="alternate" style={{ marginBottom: 24 }}>
                  {stages.map(stage => {
                    const stageEntries = batch.stages[stage.key] || [];
                    const isCompleted = stageEntries.length > 0;
                    const isCurrentStage = 
                      !isCompleted && 
                      Object.keys(batch.stages).length > 0 && 
                      stageKeys.indexOf(stage.key) === 
                        Math.max(...Object.keys(batch.stages).map(k => stageKeys.indexOf(k))) + 1;
                    
                    return (
                      <Timeline.Item
                        key={stage.key}
                        color={isCompleted ? 'green' : isCurrentStage ? 'blue' : 'gray'}
                        dot={isCurrentStage ? <ClockCircleOutlined style={{ fontSize: '16px' }} /> : null}
                      >
                        <Card 
                          size="small" 
                          title={<Text strong>{stage.name}</Text>}
                          style={{ 
                            borderLeft: isCompleted ? '3px solid #52c41a' : 
                                      isCurrentStage ? '3px solid #1890ff' : '3px solid #d9d9d9'
                          }}
                          bodyStyle={{ padding: isCompleted ? 0 : '16px' }}
                        >
                          {isCompleted ? (
                            <Table
                              columns={stageColumns}
                              dataSource={stageEntries.map((entry, idx) => ({
                                ...entry,
                                key: `${stage.key}-${idx}`,
                                status: 'completed'
                              }))}
                              size="small"
                              pagination={false}
                              bordered={false}
                            />
                          ) : (
                            <Text type="secondary">
                              {isCurrentStage ? 'Currently in this stage' : 'Not started yet'}
                            </Text>
                          )}
                        </Card>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </Panel>
            ))}
          </Collapse>
        ) : (
          <Card bordered={false}>
            <Space direction="vertical" align="center" style={{ width: '100%', padding: '24px 0' }}>
              <InfoCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              <Text type="secondary">No batch data available for this component</Text>
            </Space>
          </Card>
        )}
      </Card>

      {isNpdCompleted && (
        <Card 
          title="NPD Process Summary" 
          bordered={false} 
          style={{ marginTop: 24, borderRadius: 12, background: '#f6ffed' }}
        >
          <Descriptions column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Total Batches">
              <Text strong>5</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color="success">Completed</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Average Process Time">
              <Text strong>
                {(() => {
                  const times = Object.values(batchData)
                    .map(batch => {
                      const start = batch.stages.material_issued?.[0]?.date;
                      const end = batch.stages.dispatch?.[0]?.date;
                      return start && end ? (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24) : null;
                    })
                    .filter(t => t !== null);
                  
                  if (times.length === 0) return 'N/A';
                  const avg = times.reduce((a, b) => a + b, 0) / times.length;
                  return `${Math.round(avg)} days`;
                })()}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Total Pieces Processed">
              <Text strong>
                {Object.values(batchData).reduce((sum, batch) => {
                  return sum + (parseInt(batch.blockInfo?.pices) || 0);
                }, 0)}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'running': return 'green';
    case 'not running': return 'red';
    case 'npd': return 'orange';
    default: return 'gray';
  }
};

export default NpdDetail;