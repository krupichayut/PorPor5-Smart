import { useState } from 'react';
import MonthlyReport from './MonthlyReport';
import Grades from './Grades';
import { FileText, Printer } from 'lucide-react';

export default function ReportsContainer(props) {
  const [activeTab, setActiveTab] = useState('monthly');

  return (
    <div className="animate-fade-in">
      <div className="tabs-container no-print">
        <button 
          className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} /> รายงานประจำเดือน
        </button>
        <button 
          className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveTab('grades')}
        >
          <Printer size={16} style={{ display: 'inline', marginRight: '6px' }} /> พิมพ์รูปเล่ม ปพ.5
        </button>
      </div>

      <div>
        {activeTab === 'monthly' && <MonthlyReport {...props} />}
        {activeTab === 'grades' && <Grades {...props} />}
      </div>
    </div>
  );
}
