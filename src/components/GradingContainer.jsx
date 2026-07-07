import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import Scores from './Scores';
import MissingWork from './MissingWork';
import { Award, FileText } from 'lucide-react';

export default function GradingContainer(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { tab } = useParams();
  const isKnownTab = !tab || tab === 'scores' || tab === 'missing';
  const activeTab = tab === 'missing' || location.state?.activeTab === 'missing' ? 'missing' : 'scores';

  const switchTab = (nextTab) => {
    navigate(nextTab === 'missing' ? '/grading/missing' : '/grading/scores', { replace: true });
  };

  if (!isKnownTab) {
    return <Navigate to="/grading/scores" replace />;
  }

  return (
    <div className="animate-fade-in gradebook-workspace">
      <div className="tabs-container gradebook-tabs">
        <button 
          className={`tab-btn ${activeTab === 'scores' ? 'active' : ''}`}
          onClick={() => switchTab('scores')}
        >
          <Award size={16} style={{ display: 'inline', marginRight: '6px' }} /> บันทึกคะแนน
        </button>
        <button 
          className={`tab-btn ${activeTab === 'missing' ? 'active' : ''}`}
          onClick={() => switchTab('missing')}
        >
          <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} /> ติดตามงานค้าง
        </button>
      </div>

      <div className="gradebook-stage">
        {activeTab === 'scores' && <Scores {...props} />}
        {activeTab === 'missing' && <MissingWork {...props} />}
      </div>
    </div>
  );
}
