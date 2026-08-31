import { useState } from 'react';
import Attributes from './Attributes';
import Literacy from './Literacy';
import Competencies from './Competencies';
import PAEvidence from './PAEvidence';
import { Star, BookType, Brain, Camera } from 'lucide-react';

export default function AssessmentsContainer(props) {
  const [activeTab, setActiveTab] = useState('attributes');

  return (
    <div className="animate-fade-in hairline-grid">
      <div className="tabs-container studio-module-tabs">
        <button 
          className={`tab-btn ${activeTab === 'attributes' ? 'active' : ''}`}
          onClick={() => setActiveTab('attributes')}
        >
          <Star size={16} style={{ display: 'inline', marginRight: '6px' }} /> คุณลักษณะอันพึงประสงค์
        </button>
        <button 
          className={`tab-btn ${activeTab === 'literacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('literacy')}
        >
          <BookType size={16} style={{ display: 'inline', marginRight: '6px' }} /> อ่าน คิดวิเคราะห์ เขียน
        </button>
        <button 
          className={`tab-btn ${activeTab === 'competencies' ? 'active' : ''}`}
          onClick={() => setActiveTab('competencies')}
        >
          <Brain size={16} style={{ display: 'inline', marginRight: '6px' }} /> สมรรถนะสำคัญ
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pa' ? 'active' : ''}`}
          onClick={() => setActiveTab('pa')}
        >
          <Camera size={16} style={{ display: 'inline', marginRight: '6px' }} /> หลักฐาน ว PA
        </button>
      </div>

      <div>
        {activeTab === 'attributes' && <Attributes {...props} />}
        {activeTab === 'literacy' && <Literacy {...props} />}
        {activeTab === 'competencies' && <Competencies {...props} />}
        {activeTab === 'pa' && <PAEvidence {...props} />}
      </div>
    </div>
  );
}
