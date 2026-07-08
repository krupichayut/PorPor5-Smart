import { useState } from 'react';
import Indicators from './Indicators';
import LessonPlans from './LessonPlans';
import { FileText, ClipboardList } from 'lucide-react';

export default function CoursePlanContainer(props) {
  const [activeTab, setActiveTab] = useState('indicators');

  return (
    <div className="animate-fade-in curriculum-studio">
      <div className="tabs-container studio-module-tabs">
        <button 
          className={`tab-btn ${activeTab === 'indicators' ? 'active' : ''}`}
          onClick={() => setActiveTab('indicators')}
        >
          <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} /> โครงสร้างและตัวชี้วัด
        </button>
        <button 
          className={`tab-btn ${activeTab === 'lessonPlans' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessonPlans')}
        >
          <ClipboardList size={16} style={{ display: 'inline', marginRight: '6px' }} /> แผนการสอนและบันทึก
        </button>
      </div>

      <div>
        {activeTab === 'indicators' && <Indicators {...props} />}
        {activeTab === 'lessonPlans' && <LessonPlans {...props} />}
      </div>
    </div>
  );
}
