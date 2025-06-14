import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CloudDownload as CloudDownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const QmsDocumentViewer = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('procedure');
  const [activeCategory, setActiveCategory] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const navigate = useNavigate();
  
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  
  const pageTitle = "IMS Document Viewer";

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.1.199:8001/costumer_complaint/current-documents/');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter documents based on active section and category
  const filteredDocuments = documents.filter(doc => {
    if (activeSection === 'manual') return doc.type === 'manual';
    if (activeCategory) return doc.type === 'procedure' && doc.document_type === activeCategory;
    return doc.type === 'procedure';
  }).filter(doc =>
    doc.document_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique procedure categories
  const procedureCategories = [...new Set(
    documents
      .filter(doc => doc.type === 'procedure')
      .map(doc => doc.document_type)
  )];

  const BASE_URL = "http://192.168.1.199:8001";

const handleViewDocument = (documentUrl) => {
  const fullUrl = `${BASE_URL}${documentUrl}`;
  window.open(fullUrl, '_blank');
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
        <main className="flex flex-col mt-20 justify-center flex-grow pl-2">
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <TextField
                label="Search Documents"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: 300 }}
              />
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={fetchDocuments}
              >
                Refresh
              </Button>
            </Box>

            {/* Navigation Tabs */}
            <Box sx={{ display: 'flex', mb: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Button
                variant={activeSection === 'manual' ? "contained" : "text"}
                onClick={() => {
                  setActiveSection('manual');
                  setActiveCategory(null);
                }}
                sx={{ mr: 1 }}
              >
                Manuals
              </Button>
              <Button
                variant={activeSection === 'procedure' ? "contained" : "text"}
                onClick={() => setActiveSection('procedure')}
              >
                Procedures
              </Button>
            </Box>

            {/* Category Filter (for Procedures) */}
            {activeSection === 'procedure' && (
              <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant={!activeCategory ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setActiveCategory(null)}
                >
                  All
                </Button>
                {procedureCategories.map(category => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </Box>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Document Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Uploaded On</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>{doc.document_name}</TableCell>
                          <TableCell>{doc.document_type}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'inline-block',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: doc.status === 'current' ? 'success.light' : 'warning.light',
                                color: doc.status === 'current' ? 'success.contrastText' : 'warning.contrastText'
                              }}
                            >
                              {doc.status}
                            </Box>
                          </TableCell>
                          <TableCell>{format(new Date(doc.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                          <TableCell>
                            <Tooltip title="View">
                              <IconButton onClick={() => handleViewDocument(doc.document_file)}>
                                <VisibilityIcon color="primary" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton 
                                component="a" 
                                href={`${BASE_URL}${doc.document_file}`}

                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <CloudDownloadIcon color="secondary" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body1" color="textSecondary">
                            No documents found in this category
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </main>
      </div>
    </div>
  );
};

export default QmsDocumentViewer;