import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import MonthlyReport from './MonthlyReport';
import Grades from './Grades';
import { FileText, Printer } from 'lucide-react';

export default function ReportsContainer(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { tab } = useParams();
  const isKnownTab = !tab || tab === 'monthly' || tab === 'grades';
  const activeTab = tab === 'grades' || location.state?.activeTab === 'grades' ? 'grades' : 'monthly';

  const switchTab = (nextTab) => {
    navigate(nextTab === 'grades' ? '/reports/grades' : '/reports/monthly', { replace: true });
  };

  if (!isKnownTab) {
    return <Navigate to="/reports/monthly" replace />;
  }

  return (
    <div className="animate-fade-in report-studio">
      <div className="tabs-container report-tabs no-print">
        <button 
          className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => switchTab('monthly')}
        >
          <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} /> รายงานประจำเดือน
        </button>
        <button 
          className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => switchTab('grades')}
        >
          <Printer size={16} style={{ display: 'inline', marginRight: '6px' }} /> พิมพ์รูปเล่ม PicthClass
        </button>
      </div>

      <div className="report-stage">
        {activeTab === 'monthly' && <MonthlyReport {...props} />}
        {activeTab === 'grades' && <Grades {...props} />}
      </div>
    </div>
  );
}
