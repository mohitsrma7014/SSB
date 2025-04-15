import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Table, Modal, Upload, message, Tabs, Tag, Descriptions } from 'antd';
import { UploadOutlined, FileOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TabPane } = Tabs;

const DocumentManagement = ({ apiUrl }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploadData, setUploadData] = useState({
    document_type: '',
    remarks: '',
    file: null
  });
  const [activeDocType, setActiveDocType] = useState(null);
  const [docTypeHistory, setDocTypeHistory] = useState([]);
  const [docHistoryLoading, setDocHistoryLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [id]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${apiUrl}/masterlistn/${id}/documents/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setDocuments(response.data);
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch documents');
      setLoading(false);
    }
  };

  const fetchDocTypeHistory = async (docType) => {
    setDocHistoryLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/masterlistn/${id}/documents/${docType}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setDocTypeHistory(response.data);
      setActiveDocType(docType);
    } catch (error) {
      message.error('Failed to fetch document history');
    }
    setDocHistoryLoading(false);
  };

  const handleUpload = async () => {
    if (!uploadData.document_type || !uploadData.file) {
      message.error('Please select a document type and file');
      return;
    }

    const formData = new FormData();
    formData.append('document_type', uploadData.document_type);
    formData.append('document', uploadData.file);
    if (uploadData.remarks) {
      formData.append('remarks', uploadData.remarks);
    }

    try {
      await axios.post(`${apiUrl}/masterlistn/${id}/documents/upload/`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      message.success('Document uploaded successfully');
      setIsUploadModalVisible(false);
      setUploadData({
        document_type: '',
        remarks: '',
        file: null
      });
      fetchDocuments();
    } catch (error) {
      message.error('Failed to upload document');
    }
  };

  const handleSetCurrent = async (docId) => {
    try {
      await axios.post(`${apiUrl}/masterlistn/${id}/documents/${docId}/set-current/`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      message.success('Document set as current version');
      fetchDocuments();
      if (activeDocType) {
        fetchDocTypeHistory(activeDocType);
      }
    } catch (error) {
      message.error('Failed to set current document');
    }
  };

  const beforeUpload = (file) => {
    setUploadData({ ...uploadData, file });
    return false; // Prevent default upload
  };

  const documentTypes = [...new Set(documents.map(doc => doc.document_type))];

  const currentDocuments = documents.filter(doc => doc.is_current);

  const columns = [
    {
      title: 'Document Type',
      dataIndex: 'document_type',
      key: 'document_type',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (version, record) => (
        <Tag color={record.is_current ? 'green' : 'default'}>
          v{version} {record.is_current && '(Current)'}
        </Tag>
      ),
    },
    {
      title: 'Uploaded At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: date => new Date(date).toLocaleString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="link"
            href={`${apiUrl}${record.document}`}
            target="_blank"
            icon={<FileOutlined />}
          >
            View
          </Button>
          {!record.is_current && (
            <Button
              type="link"
              onClick={() => handleSetCurrent(record.id)}
            >
              Set as Current
            </Button>
          )}
          <Button
            type="link"
            onClick={() => fetchDocTypeHistory(record.document_type)}
          >
            History
          </Button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (version, record) => (
        <Tag color={record.is_current ? 'green' : 'default'}>
          v{version} {record.is_current && '(Current)'}
        </Tag>
      ),
    },
    {
      title: 'Uploaded At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: date => new Date(date).toLocaleString(),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="link"
            href={`${apiUrl}${record.document}`}
            target="_blank"
            icon={<FileOutlined />}
          >
            View
          </Button>
          {!record.is_current && (
            <Button
              type="link"
              onClick={() => handleSetCurrent(record.id)}
            >
              Set as Current
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="document-container">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/masterlist/${id}`)}
        style={{ marginBottom: '16px' }}
      >
        Back to Component
      </Button>

      <Card
        title="Document Management"
        extra={
          <Button
            type="primary"
            onClick={() => setIsUploadModalVisible(true)}
          >
            Upload New Document
          </Button>
        }
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Current Documents" key="1">
            <Table
              columns={columns}
              dataSource={currentDocuments}
              rowKey="id"
              loading={loading}
            />
          </TabPane>
          <TabPane tab="All Documents" key="2">
            <Table
              columns={columns}
              dataSource={documents}
              rowKey="id"
              loading={loading}
            />
          </TabPane>
          {activeDocType && (
            <TabPane tab={`${activeDocType} History`} key="3">
              <Descriptions bordered column={1} style={{ marginBottom: '20px' }}>
                <Descriptions.Item label="Document Type">{activeDocType}</Descriptions.Item>
              </Descriptions>
              <Table
                columns={historyColumns}
                dataSource={docTypeHistory}
                rowKey="id"
                loading={docHistoryLoading}
              />
            </TabPane>
          )}
        </Tabs>
      </Card>

      <Modal
        title="Upload New Document"
        visible={isUploadModalVisible}
        onOk={handleUpload}
        onCancel={() => setIsUploadModalVisible(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            placeholder="Document Type"
            value={uploadData.document_type}
            onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
          />
          <Input.TextArea
            placeholder="Remarks (Optional)"
            value={uploadData.remarks}
            onChange={(e) => setUploadData({ ...uploadData, remarks: e.target.value })}
          />
          <Upload
            beforeUpload={beforeUpload}
            showUploadList={true}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Select File</Button>
          </Upload>
          {uploadData.file && (
            <div>
              <strong>Selected file:</strong> {uploadData.file.name}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DocumentManagement;