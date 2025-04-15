import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Descriptions, Tabs, Modal, Input, message, Tag, Timeline } from 'antd';
import { EditOutlined, DeleteOutlined, FileAddOutlined, HistoryOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TabPane } = Tabs;

const MasterlistDetail = ({ apiUrl }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [masterlist, setMasterlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchMasterlist();
  }, [id]);

  const fetchMasterlist = async () => {
    try {
      const response = await axios.get(`${apiUrl}/masterlistn/${id}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setMasterlist(response.data);
      setEditData({
        name: response.data.name,
        description: response.data.description
      });
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch masterlist details');
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/masterlistn/${id}/history/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setHistoryData(response.data);
    } catch (error) {
      message.error('Failed to fetch history');
    }
    setHistoryLoading(false);
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.put(`${apiUrl}/masterlistn/${id}/`, editData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      setMasterlist(response.data);
      setIsEditModalVisible(false);
      message.success('Masterlist updated successfully');
    } catch (error) {
      message.error('Failed to update masterlist');
    }
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this component?',
      onOk: async () => {
        try {
          await axios.delete(`${apiUrl}/masterlistn/${id}/`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          });
          message.success('Masterlist deleted successfully');
          navigate('/');
        } catch (error) {
          message.error('Failed to delete masterlist');
        }
      }
    });
  };

  const navigateToDocuments = () => {
    navigate(`/masterlist/${id}/documents`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!masterlist) {
    return <div>Component not found</div>;
  }

  return (
    <div className="detail-container">
      <Card
        title={masterlist.name}
        extra={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              icon={<EditOutlined />}
              onClick={() => setIsEditModalVisible(true)}
            >
              Edit
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={navigateToDocuments}
            >
              Manage Documents
            </Button>
          </div>
        }
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Details" key="1">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Name">{masterlist.name}</Descriptions.Item>
              <Descriptions.Item label="Description">{masterlist.description}</Descriptions.Item>
              <Descriptions.Item label="Created At">
                {new Date(masterlist.created_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {new Date(masterlist.updated_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>
          <TabPane tab="History" key="2">
            <Button
              icon={<HistoryOutlined />}
              onClick={fetchHistory}
              loading={historyLoading}
            >
              Load History
            </Button>
            <Timeline style={{ marginTop: '20px' }}>
              {historyData.map((historyItem, index) => (
                <Timeline.Item key={index}>
                  <p><strong>{new Date(historyItem.history_date).toLocaleString()}</strong> by {historyItem.history_user || 'System'}</p>
                  {historyItem.changes.length > 0 ? (
                    <ul>
                      {historyItem.changes.map((change, idx) => (
                        <li key={idx}>
                          <Tag color="blue">{change.field}</Tag>: 
                          {change.old ? ` ${change.old}` : ' [empty]'} → 
                          {change.new ? ` ${change.new}` : ' [empty]'}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Initial creation</p>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="Edit Component"
        visible={isEditModalVisible}
        onOk={handleUpdate}
        onCancel={() => setIsEditModalVisible(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            placeholder="Component Name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />
          <Input.TextArea
            placeholder="Description"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};

export default MasterlistDetail;