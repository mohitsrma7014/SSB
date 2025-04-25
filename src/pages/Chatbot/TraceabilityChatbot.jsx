import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import {
  Paper,
  TextField,
  IconButton,
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  InsertChart as ChartIcon,
  TableChart as TableIcon,
  Info as InfoIcon,
  Person as UserIcon,
  SmartToy as BotIcon
} from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";
// Custom styles
const useStyles = makeStyles((theme) => ({
  chatContainer: {
    height: '80vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  chatHeader: {
    padding: '16px',
    backgroundColor: '#1976d2',
    color: 'white',
    display: 'flex',
    alignItems: 'center'
  },
  chatHistory: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    backgroundColor: '#fafafa'
  },
  chatInputArea: {
    padding: '16px',
    backgroundColor: 'white',
    borderTop: '1px solid #e0e0e0'
  },
  userMessage: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px'
  },
  botMessage: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '16px'
  },
  messageBubble: {
    maxWidth: '80%',
    padding: '12px 16px',
    borderRadius: '8px'
  },
  userBubble: {
    backgroundColor: '#1976d2',
    color: 'white',
    borderTopRightRadius: '0 !important'
  },
  botBubble: {
    backgroundColor: 'white',
    color: 'black',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    borderTopLeftRadius: '0 !important'
  },
  tableContainer: {
    marginTop: '8px',
    maxHeight: '300px',
    overflow: 'auto'
  },
  visualizationContainer: {
    marginTop: '8px',
    textAlign: 'center'
  },
  loadingIndicator: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px'
  },
  responseTypeIndicator: {
    marginLeft: '8px',
    fontSize: '0.75rem',
    color: '#666'
  },
  markdownContent: {
    '& p': {
      margin: '4px 0'
    },
    '& ul, & ol': {
      paddingLeft: '20px',
      margin: '8px 0'
    },
    '& li': {
      marginBottom: '4px'
    },
    '& pre': {
      backgroundColor: '#f5f5f5',
      padding: '8px',
      borderRadius: '4px',
      overflowX: 'auto'
    },
    '& code': {
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      padding: '2px 4px',
      borderRadius: '2px'
    }
  }
}));

const AIAnalystChat = () => {
  const classes = useStyles();
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "SSB AI Assistant"; // Set the page title here
  
  // Sample initial message
  useEffect(() => {
    setChatHistory([{
      role: 'assistant',
      content: {
        type: 'welcome',
        message: "Hello! I'm SSB AI Assistant. Ask me anything about raw materials, production, suppliers, or any other data in our system."
      },
      timestamp: new Date()
    }]);
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    
    setLoading(true);
    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setQuery('');
    
    try {
      const response = await axios.post('http://192.168.1.199:8001/raw_material/ai-analyst/', {
        query,
        chat_history: chatHistory
      });
      
      const botMessage = {
        role: 'assistant',
        content: response.data,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: {
          type: 'error',
          message: "Sorry, I encountered an error processing your request. Please try again."
        },
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderResponse = (message) => {
    if (!message.content) return null;
    
    const { type } = message.content;
    
    switch (type) {
      case 'welcome':
        return (
          <Typography variant="body1">
            {message.content.message}
          </Typography>
        );
        
      case 'error':
        return (
          <Typography variant="body1" color="error">
            {message.content.message}
          </Typography>
        );
        
      case 'data_query':
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              {message.content.summary}
              <span className={classes.responseTypeIndicator}>
                <Tooltip title="Data Query">
                  <TableIcon fontSize="small" />
                </Tooltip>
              </span>
            </Typography>
            
            {message.content.count > 0 && (
              <>
                <Chip 
                  label={`Showing ${Math.min(10, message.content.count)} of ${message.content.count} records`} 
                  size="small" 
                  variant="outlined" 
                />
                <TableContainer component={Paper} className={classes.tableContainer}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {Object.keys(message.content.data[0] || {}).map(key => (
                          <TableCell key={key}>{key}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {message.content.data.map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row).map((value, j) => (
                            <TableCell key={j}>
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        );
        
      case 'data_analysis':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Analysis Results
              <span className={classes.responseTypeIndicator}>
                <Tooltip title="Data Analysis">
                  <InfoIcon fontSize="small" />
                </Tooltip>
              </span>
            </Typography>
            
            <Typography variant="body1" paragraph>
              {message.content.insights}
            </Typography>
            
            {message.content.analysis && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Statistical Summary:
                </Typography>
                <TableContainer component={Paper} className={classes.tableContainer}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        {Object.keys(message.content.analysis).map(key => (
                          <TableCell key={key}>{key}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(message.content.analysis[Object.keys(message.content.analysis)[0]] || {}).map(([metric]) => (
                        <TableRow key={metric}>
                          <TableCell>{metric}</TableCell>
                          {Object.keys(message.content.analysis).map(key => (
                            <TableCell key={key}>
                              {typeof message.content.analysis[key][metric] === 'number'
                                ? message.content.analysis[key][metric].toFixed(2)
                                : String(message.content.analysis[key][metric])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        );
        
      case 'visualization':
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              Here's the visualization you requested:
              <span className={classes.responseTypeIndicator}>
                <Tooltip title="Visualization">
                  <ChartIcon fontSize="small" />
                </Tooltip>
              </span>
            </Typography>
            <Box className={classes.visualizationContainer}>
              <img 
                src={`data:image/png;base64,${message.content.image}`} 
                alt="Data Visualization" 
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          </Box>
        );
        
      case 'general_response':
        return (
          <Box className={classes.markdownContent} 
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(marked.parse(message.content.response || '')) 
            }} 
          />
        );
        
      default:
        return (
          <Typography variant="body1">
            {JSON.stringify(message.content, null, 2)}
          </Typography>
        );
    }
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
    <Paper elevation={3} className={classes.chatContainer}>
      <Box className={classes.chatHeader}>
        <BotIcon style={{ marginRight: '8px' }} />
        <Typography variant="h6">SSB AI Assistant</Typography>
      </Box>
      
      <Box className={classes.chatHistory}>
        <List>
          {chatHistory.map((message, idx) => (
            <React.Fragment key={idx}>
              <ListItem 
                className={message.role === 'user' ? classes.userMessage : classes.botMessage}
                alignItems="flex-start"
              >
                <ListItemAvatar>
                  <Avatar>
                    {message.role === 'user' ? <UserIcon /> : <BotIcon />}
                  </Avatar>
                </ListItemAvatar>
                <Paper 
                  className={`${classes.messageBubble} ${
                    message.role === 'user' ? classes.userBubble : classes.botBubble
                  }`}
                >
                  {message.role === 'user' ? (
                    <Typography variant="body1">{message.content}</Typography>
                  ) : (
                    renderResponse(message)
                  )}
                  <Typography variant="caption" display="block" color="textSecondary" mt={1}>
                    {format(message.timestamp, 'hh:mm a')}
                  </Typography>
                </Paper>
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
          {loading && (
            <Box className={classes.loadingIndicator}>
              <CircularProgress size={24} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>
      
      <Box className={classes.chatInputArea}>
        <form onSubmit={handleSubmit}>
          <Box display="flex" alignItems="center">
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about production data, suppliers, etc."
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
              multiline
              maxRows={4}
            />
            <IconButton 
              type="submit" 
              color="primary" 
              disabled={!query.trim() || loading}
              style={{ marginLeft: '8px' }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </form>
      </Box>
    </Paper>
    </main>
    </div>
    </div>
  );
};

export default AIAnalystChat;