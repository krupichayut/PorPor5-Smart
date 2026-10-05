import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import MonthlyReport from './MonthlyReport';
import Grades from './Grades';
import PorPor5Generator from './PorPor5Generator';
import ReportIndicators from './ReportIndicators';
import ReportTermSummary from './ReportTermSummary';
import { FileText, Printer, FileSpreadsheet, LayoutList, CalendarDays } from 'lucide-react';

export default function ReportsContainer(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { tab } = useParams();
  const isKnownTab = !tab || tab === 'monthly' || tab === 'grades' || tab === 'porpor5' || tab === 'indicators' || tab === 'termsummary';
  
  let activeTab = 'monthly';
  if (tab === 'grades' || location.state?.activeTab === 'grades') activeTab = 'grades';
  else if (tab === 'porpor5' || location.state?.activeTab === 'porpor5') activeTab = 'porpor5';
  else if (tab === 'indicators' || location.state?.activeTab === 'indicators') activeTab = 'indicators';
  else if (tab === 'termsummary' || location.state?.activeTab === 'termsummary') activeTab = 'termsummary';

  const switchTab = (nextTab) => {
    navigate(`/reports/${nextTab}`, { replace: true });
  };

  if (!isKnownTab) {
    return <Navigate to="/reports/monthly" replace />;
  }

  return (
    <div className="animate-fade-in hairline-grid">
      <div className="tabs-container report-tabs no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button 
          className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => switchTab('monthly')}
        >
          <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} /> รายงานประจำเดือน
        </button>
        <button 
          className={`tab-btn ${activeTab === 'indicators' ? 'active' : ''}`}
          onClick={() => switchTab('indicators')}
        >
          <LayoutList size={16} style={{ display: 'inline', marginRight: '6px' }} /> สรุปตามตัวชี้วัด
        </button>
        <button 
          className={`tab-btn ${activeTab === 'termsummary' ? 'active' : ''}`}
          onClick={() => switchTab('termsummary')}
        >
          <CalendarDays size={16} style={{ display: 'inline', marginRight: '6px' }} /> สรุปรายเทอม
        </button>
        <button 
          className={`tab-btn ${activeTab === 'porpor5' ? 'active' : ''}`}
          onClick={() => switchTab('porpor5')}
        >
          <FileSpreadsheet size={16} style={{ display: 'inline', marginRight: '6px' }} /> ออก ปพ.5 (Excel)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => switchTab('grades')}
        >
          <Printer size={16} style={{ display: 'inline', marginRight: '6px' }} /> พิมพ์รูปเล่ม PitchClass
        </button>
      </div>

      <div className="report-stage">
        {activeTab === 'monthly' && <MonthlyReport {...props} />}
        {activeTab === 'indicators' && <ReportIndicators {...props} />}
        {activeTab === 'termsummary' && <ReportTermSummary {...props} />}
        {activeTab === 'grades' && <Grades {...props} />}
        {activeTab === 'porpor5' && <PorPor5Generator {...props} />}
      </div>
    </div>
  );
}
