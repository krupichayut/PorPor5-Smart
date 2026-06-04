import { useState } from 'react';
import Scores from './Scores';
import MissingWork from './MissingWork';
import { Award, FileText } from 'lucide-react';

export default function GradingContainer(props) {
  const [activeTab, setActiveTab] = useState('scores');

  return (
    <div className="animate-fade-in">
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'scores' ? 'active' : ''}`}
          onClick={() => setActiveTab('scores')}
        >
          <Award size={16} style={{ display: 'inline', marginRight: '6px' }} /> บันทึกคะแนน
        </button>
        <button 
          className={`tab-btn ${activeTab === 'missing' ? 'active' : ''}`}
          onClick={() => setActiveTab('missing')}
        >
          <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} /> ติดตามงานค้าง
        </button>
      </div>

      <div>
        {activeTab === 'scores' && <Scores {...props} />}
        {activeTab === 'missing' && <MissingWork {...props} />}
      </div>
    </div>
  );
}
