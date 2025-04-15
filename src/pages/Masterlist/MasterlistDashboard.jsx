import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Table, Modal, Input, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const MasterlistDashboard = ({ apiUrl }) => {
  const [masterlists, setMasterlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newMasterlist, setNewMasterlist] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchMasterlists();
  }, []);

  const fetchMasterlists = async () => {
    try {
      const response = await axios.get(`${apiUrl}/masterlistn/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setMasterlists(response.data);
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch masterlists');
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const filteredData = masterlists.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleCreateMasterlist = async () => {
    try {
      const response = await axios.post(`${apiUrl}/masterlistn/`, newMasterlist, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      setMasterlists([response.data, ...masterlists]);
      setIsModalVisible(false);
      setNewMasterlist({ name: '', description: '' });
      message.success('Masterlist created successfully');
    } catch (error) {
      message.error('Failed to create masterlist');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/masterlist/${record.id}`)}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="dashboard-container">
      <Card
        title="Components Masterlist"
        extra={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Input
              placeholder="Search components"
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              New Component
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          onRow={(record) => ({
            onClick: () => navigate(`/masterlist/${record.id}`),
          })}
        />
      </Card>

      <Modal
        title="Create New Component"
        visible={isModalVisible}
        onOk={handleCreateMasterlist}
        onCancel={() => setIsModalVisible(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            placeholder="Component Name"
            value={newMasterlist.name}
            onChange={(e) => setNewMasterlist({ ...newMasterlist, name: e.target.value })}
          />
          <Input.TextArea
            placeholder="Description"
            value={newMasterlist.description}
            onChange={(e) => setNewMasterlist({ ...newMasterlist, description: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};

export default MasterlistDashboard;