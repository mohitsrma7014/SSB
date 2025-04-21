import { Card, Timeline, Tag, Progress, Descriptions, Collapse, Divider, Badge, Row, Col, Table } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

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
  
  // First handle batch_tracking data (material issued)
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

  // Then handle blockmt data
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

  // Populate stage data for each batch from other process stages
  stages.slice(1).forEach(stage => { // Skip material_issued as we already handled it
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

  // Check if NPD is completed (5 lots dispatched)
  const completedBatches = Object.values(batchData).filter(batch => 
    batch.stages.dispatch?.length > 0
  ).length;
  const isNpdCompleted = completedBatches >= 5;

  // Calculate overall progress based on batches and stages
  const getOverallProgress = () => {
    if (Object.keys(batchData).length === 0) return 0;
    
    let totalStagesCompleted = 0;
    let totalPossibleStages = 0;
    
    Object.values(batchData).forEach(batch => {
      const batchStages = Object.keys(batch.stages);
      totalStagesCompleted += batchStages.length;
      
      // Only count stages that should have been completed based on the last completed stage
      const lastCompletedStageIndex = Math.max(...batchStages.map(k => stageKeys.indexOf(k)));
      totalPossibleStages += lastCompletedStageIndex + 1; // +1 because array is 0-indexed
    });
    
    return Math.round((totalStagesCompleted / totalPossibleStages) * 100);
  };

  // Calculate process time for completed batches
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

  // Calculate progress for a specific batch
  const getBatchProgress = (batch) => {
    const completedStages = Object.keys(batch.stages).length;
    const lastStageIndex = Math.max(...Object.keys(batch.stages).map(k => stageKeys.indexOf(k)));
    const totalPossibleStages = lastStageIndex + 1; // Stages up to the last completed one
    
    return Math.round((completedStages / totalPossibleStages) * 100);
  };

  // Columns for stage details table
  const stageColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Pieces/Qty',
      dataIndex: 'production',
      key: 'production',
      render: (production, record) => `${production || 'N/A'}${record.target ? ` of ${record.target}` : ''}`
    },
    {
      title: 'Verified By',
      dataIndex: 'verified_by',
      key: 'verified_by',
      render: (verified_by) => verified_by || 'N/A'
    },
    {
      title: 'Remarks',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark) => remark || 'None'
    }
  ];

  return (
    <div className="npd-detail-container" style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h2>{component.component_details?.component || 'Component'} Details</h2>
        </Col>
        <Col>
          <Tag color={getStatusColor(component.component_details?.running_status)}>
            {component.component_details?.running_status?.toUpperCase() || 'UNKNOWN'}
          </Tag>
          {isNpdCompleted && (
            <Tag icon={<CheckCircleOutlined />} color="success" style={{ marginLeft: 8 }}>
              NPD Process Completed
            </Tag>
          )}
        </Col>
      </Row>
      
      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Part Name">{component.component_details?.part_name}</Descriptions.Item>
        <Descriptions.Item label="Customer">{component.component_details?.customer}</Descriptions.Item>
        <Descriptions.Item label="Material Grade">{component.component_details?.material_grade}</Descriptions.Item>
        <Descriptions.Item label="Slug Weight">{component.component_details?.slug_weight}</Descriptions.Item>
        <Descriptions.Item label="Drawing Number">{component.component_details?.drawing_number}</Descriptions.Item>
        <Descriptions.Item label="Drawing Revision">{component.component_details?.drawing_rev_number}</Descriptions.Item>
        <Descriptions.Item label="Forging Line">{component.component_details?.forging_line}</Descriptions.Item>
        <Descriptions.Item label="Batch Progress">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Progress 
              percent={Math.round((completedBatches / 5) * 100)} 
              status={isNpdCompleted ? 'success' : 'active'} 
              style={{ width: '200px', marginRight: 8 }}
            />
            <span>{completedBatches} of 5 lots dispatched</span>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Overall Progress">
          <Progress percent={getOverallProgress()} status="active" />
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">Batch Progress</Divider>
      
      {Object.keys(batchData).length > 0 ? (
        <Collapse accordion>
          {Object.entries(batchData).map(([batchId, batch]) => (
            <Panel 
              header={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Badge 
                    status={
                      getBatchStatus(batch) === 'completed' ? 'success' : 
                      getBatchStatus(batch) === 'in-progress' ? 'processing' : 'default'
                    } 
                  />
                  <span style={{ marginLeft: 8 }}>Batch: {batchId}</span>
                  <div style={{ marginLeft: 16 }}>
                    <Progress 
                      percent={getBatchProgress(batch)} 
                      status={getBatchStatus(batch) === 'completed' ? 'success' : 'active'}
                      size="small" 
                      style={{ width: 150 }}
                    />
                  </div>
                  {getBatchStatus(batch) === 'completed' && (
                    <Tag color="green" icon={<CheckCircleOutlined />} style={{ marginLeft: 12 }}>
                      Completed in {getProcessTimeForBatch(batch)}
                    </Tag>
                  )}
                </div>
              }
              key={batchId}
            >
              {batch.blockInfo && (
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Supplier">{batch.blockInfo.supplier}</Descriptions.Item>
                    <Descriptions.Item label="Heat No">{batch.blockInfo.heatno}</Descriptions.Item>
                    <Descriptions.Item label="Pieces">{batch.blockInfo.pices}</Descriptions.Item>
                    <Descriptions.Item label="Weight">{batch.blockInfo.weight}</Descriptions.Item>
                    <Descriptions.Item label="Created At">
                      {new Date(batch.blockInfo.created_at).toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}
              
              <h4>Process Timeline</h4>
              <Timeline mode="left" style={{ marginBottom: 24 }}>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{stage.name}</strong>
                        {isCompleted && (
                          <span>
                            {new Date(stageEntries[0].date).toLocaleDateString()} - 
                            Qty: {stageEntries.reduce((sum, entry) => sum + (parseInt(entry.production) || 0), 0)}
                          </span>
                        )}
                      </div>
                      
                      {isCompleted && stageEntries.length > 0 && (
                        <Table
                          columns={stageColumns}
                          dataSource={stageEntries.map((entry, idx) => ({
                            ...entry,
                            key: `${stage.key}-${idx}`,
                            status: 'completed'
                          }))}
                          size="small"
                          pagination={false}
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </Panel>
          ))}
        </Collapse>
      ) : (
        <Card>
          <p>No batch data available for this component</p>
        </Card>
      )}

      {isNpdCompleted && (
        <div style={{ marginTop: 32 }}>
          <Card title="NPD Process Summary" type="inner" style={{ background: '#f6ffed' }}>
            <Descriptions column={2}>
              <Descriptions.Item label="Total Batches">5</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="success">Completed</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Average Process Time">
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
              </Descriptions.Item>
              <Descriptions.Item label="Total Pieces Processed">
                {Object.values(batchData).reduce((sum, batch) => {
                  return sum + (parseInt(batch.blockInfo?.pices) || 0);
                }, 0)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}
    </div>
  );
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'running': return 'green';
    case 'not running': return 'red';
    case 'npd': return 'orange';
    default: return 'gray';
  }
};

export default NpdDetail;