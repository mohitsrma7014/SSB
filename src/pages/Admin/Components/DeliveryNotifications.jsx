import React, { useState, useEffect } from 'react';
import { Dialog, Tab, Tabs } from '@mui/material';
import './DeliveryNotifications.css';

const DeliveryNotifications = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = async () => {
    try {
      const response = await fetch('http://192.168.1.199:8001/raw_material/api/delivery-notifications/');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (item) => {
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) return <div className="notification-loading">Loading delivery notifications...</div>;
  if (error) return <div className="notification-error">Error: {error}</div>;
  if (!data) return <div className="notification-no-data">No delivery data available</div>;

  const { upcoming_deliveries, due_deliveries, last_updated } = data;

  const summary = {
    today: upcoming_deliveries.today.length,
    threeDays: upcoming_deliveries['3_days'].length,
    sevenDays: upcoming_deliveries['7_days'].length,
    overdue: due_deliveries['30_days_due'].length
  };

  return (
    <div className="delivery-notification-container">
      <div className="notification-header">
        <h3>Delivery Alerts</h3>
        <span className="last-updated">Last updated: {new Date(last_updated).toLocaleTimeString()}</span>
        <button className="refresh-btn" onClick={refreshData}>Refresh</button>
      </div>

      <div className="summary-section">
        <div className="summary-item today" onClick={() => setActiveTab('today')}>
          <div className="summary-count">{summary.today}</div>
          <div className="summary-label">Today</div>
        </div>
        <div className="summary-item three-days" onClick={() => setActiveTab('3_days')}>
          <div className="summary-count">{summary.threeDays}</div>
          <div className="summary-label">Next 3 Days</div>
        </div>
        <div className="summary-item seven-days" onClick={() => setActiveTab('7_days')}>
          <div className="summary-count">{summary.sevenDays}</div>
          <div className="summary-label">Next 7 Days</div>
        </div>
        <div className="summary-item overdue" onClick={() => setActiveTab('overdue')}>
          <div className="summary-count">{summary.overdue}</div>
          <div className="summary-label">Overdue</div>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        variant="fullWidth"
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="Today" value="today" />
        <Tab label="3 Days" value="3_days" />
        <Tab label="7 Days" value="7_days" />
        <Tab label="Overdue" value="overdue" />
      </Tabs>

      <div className="content-section">
        {activeTab === 'today' && (
          <DeliveryList 
            items={upcoming_deliveries.today} 
            onItemClick={handleOpenDialog}
            type="upcoming"
          />
        )}
        {activeTab === '3_days' && (
          <DeliveryList 
            items={upcoming_deliveries['3_days']} 
            onItemClick={handleOpenDialog}
            type="upcoming"
          />
        )}
        {activeTab === '7_days' && (
          <DeliveryList 
            items={upcoming_deliveries['7_days']} 
            onItemClick={handleOpenDialog}
            type="upcoming"
          />
        )}
        {activeTab === 'overdue' && (
          <DeliveryList 
            items={due_deliveries['30_days_due']} 
            onItemClick={handleOpenDialog}
            type="overdue"
          />
        )}
      </div>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedItem && (
          <DeliveryDetail 
            item={selectedItem} 
            onClose={handleCloseDialog} 
            refreshData={refreshData}
          />
        )}
      </Dialog>
    </div>
  );
};

const DeliveryList = ({ items, onItemClick, type }) => {
  if (items.length === 0) {
    return <div className="no-items">No deliveries in this category</div>;
  }

  return (
    <div className="delivery-list">
      {items.map((item, index) => (
        <div 
          key={index} 
          className={`delivery-item ${type}`}
          onClick={() => onItemClick(item)}
        >
          <div className="item-header">
            <span className="component">{item.component}</span>
            <span className="customer">{item.customer}</span>
          </div>
          <div className="item-details">
            <div>
              <span className="label">Remaining:</span>
              <span className="value">{item.remaining_pieces} pcs</span>
            </div>
            <div>
              <span className="label">Weight:</span>
              <span className="value">{item.weight} kg</span>
            </div>
            {type === 'upcoming' ? (
              <div>
                <span className="label">Due in:</span>
                <span className="value">{item.days_remaining} days</span>
              </div>
            ) : (
              <div>
                <span className="label">Overdue by:</span>
                <span className="value">{item.days_overdue} days</span>
              </div>
            )}
          </div>
          <button className="view-more-btn">View Details</button>
        </div>
      ))}
    </div>
  );
};

const DeliveryDetail = ({ item, onClose, refreshData }) => {
  const [disclosureStatus, setDisclosureStatus] = useState('none');
  const [disclosureNotes, setDisclosureNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const updateDisclosure = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://192.168.1.199:8001/raw_material/api/update-disclosure/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          component: item.original_component,
          scheduled_date: item.scheduled_date,
          disclosure_status: disclosureStatus,
          disclosure_notes: disclosureNotes,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update disclosure');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating disclosure:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisclosureSubmit = async () => {
    if (disclosureStatus === 'none') return;
    
    try {
      await updateDisclosure();
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        refreshData();
      }, 1500);
    } catch (error) {
      alert('Failed to submit disclosure. Please try again.');
    }
  };

  return (
    <div className="delivery-detail">
      <div className="detail-header">
        <h3>Delivery Details</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="detail-grid">
        <div className="detail-row">
          <span className="detail-label">Component:</span>
          <span className="detail-value">{item.original_component}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Customer:</span>
          <span className="detail-value">{item.customer}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Grade:</span>
          <span className="detail-value">{item.grade}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Diameter:</span>
          <span className="detail-value">{item.dia} mm</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Scheduled Date:</span>
          <span className="detail-value">{new Date(item.scheduled_date).toLocaleDateString()}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Scheduled Pieces:</span>
          <span className="detail-value">{item.scheduled_pieces}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Dispatched Pieces:</span>
          <span className="detail-value">{item.dispatched_pieces}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Remaining Pieces:</span>
          <span className="detail-value highlight">{item.remaining_pieces}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Weight:</span>
          <span className="detail-value">{item.weight} kg</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Slug Weight:</span>
          <span className="detail-value">{item.slug_weight} kg</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Location:</span>
          <span className="detail-value">{item.location || 'Not specified'}</span>
        </div>
        {'days_remaining' in item ? (
          <div className="detail-row">
            <span className="detail-label">Days Remaining:</span>
            <span className="detail-value">{item.days_remaining}</span>
          </div>
        ) : (
          <div className="detail-row">
            <span className="detail-label">Days Overdue:</span>
            <span className="detail-value">{item.days_overdue}</span>
          </div>
        )}
      </div>
      
      {'days_overdue' in item && (
        <div className="disclosure-section">
          <h4>Disclosure Information</h4>
          
          <div className="disclosure-options">
            <label className="disclosure-option">
              <input
                type="radio"
                name="disclosure"
                value="not_received"
                checked={disclosureStatus === 'not_received'}
                onChange={() => setDisclosureStatus('not_received')}
              />
              Not Received by Customer
            </label>
            
            <label className="disclosure-option">
              <input
                type="radio"
                name="disclosure"
                value="not_produced"
                checked={disclosureStatus === 'not_produced'}
                onChange={() => setDisclosureStatus('not_produced')}
              />
              Not Produced
            </label>
            
            <label className="disclosure-option">
              <input
                type="radio"
                name="disclosure"
                value="delay"
                checked={disclosureStatus === 'delay'}
                onChange={() => setDisclosureStatus('delay')}
              />
              Delay
            </label>
            
            <label className="disclosure-option">
              <input
                type="radio"
                name="disclosure"
                value="customer_denied"
                checked={disclosureStatus === 'customer_denied'}
                onChange={() => setDisclosureStatus('customer_denied')}
              />
              Customer Denied
            </label>
          </div>
          
          <div className="disclosure-notes">
            <label>Notes:</label>
            <textarea
              value={disclosureNotes}
              onChange={(e) => setDisclosureNotes(e.target.value)}
              placeholder="Additional information..."
              rows={4}
            />
          </div>
        </div>
      )}
      
      <div className="detail-actions">
        {'days_overdue' in item && (
          <button 
            className={`action-btn primary ${isSubmitting ? 'submitting' : ''}`} 
            onClick={handleDisclosureSubmit}
            disabled={isSubmitting || disclosureStatus === 'none'}
          >
            {isSubmitting ? 'Submitting...' : 'Mark Disclosure'}
          </button>
        )}
        <button className="action-btn secondary">Reschedule</button>
        <button className="action-btn" onClick={onClose}>Close</button>
      </div>
      
      {submitSuccess && (
        <div className="success-message">
          Disclosure submitted successfully! This item will be removed from overdue list.
        </div>
      )}
    </div>
  );
};

export default DeliveryNotifications;