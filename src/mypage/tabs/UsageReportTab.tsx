import type {
  AdminDashboardResponse,
  AdminFreelancerListItemResponse,
  AdminProjectSummaryResponse,
  AdminReportListItemResponse,
  AdminReviewListItemResponse,
} from '../../api/admin';
import { formatDateTime } from '../../lib/referenceData';

interface Props {
  dashboard: AdminDashboardResponse | null;
  freelancers: AdminFreelancerListItemResponse[];
  projects: AdminProjectSummaryResponse[];
  reviews: AdminReviewListItemResponse[];
  reports: AdminReportListItemResponse[];
}

function BarRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="report-bar-row">
      <span className="report-bar-label">{label}</span>
      <div className="report-bar-track">
        <div className="report-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="report-bar-count">{count} <span className="report-bar-pct">({pct}%)</span></span>
    </div>
  );
}

export default function UsageReportTab({ dashboard, freelancers, projects, reviews, reports }: Props) {
  const totalProjects = projects.length;
  const totalFreelancers = freelancers.length;
  const totalReviews = reviews.length;
  const totalReports = reports.length;
  const verifiedFreelancers = freelancers.filter((freelancer) => freelancer.verifiedYn).length;
  const blindedReviews = reviews.filter((review) => review.blindedYn).length;
  const requestedProjects = projects.filter((project) => project.status === 'REQUESTED').length;
  const acceptedProjects = projects.filter((project) => project.status === 'ACCEPTED').length;
  const inProgressProjects = projects.filter((project) => project.status === 'IN_PROGRESS').length;
  const completedProjects = projects.filter((project) => project.status === 'COMPLETED').length;
  const cancelledProjects = projects.filter((project) => project.status === 'CANCELLED').length;
  const pendingReports = reports.filter((report) => report.status === 'PENDING').length;

  return (
    <div className="tab-content usage-report">
      <h2 className="report-section-title">운영 요약</h2>
      <div className="admin-grid report-summary-grid">
        <div className="metric-card">
          <span className="metric-label">총 사용자</span>
          <strong className="metric-value">{dashboard?.totalUsers ?? '-'}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">프리랜서</span>
          <strong className="metric-value">{totalFreelancers}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">검증 완료</span>
          <strong className="metric-value">{verifiedFreelancers}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">프로젝트</span>
          <strong className="metric-value">{totalProjects}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">리뷰</span>
          <strong className="metric-value">{totalReviews}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">신고</span>
          <strong className="metric-value">{totalReports}</strong>
        </div>
      </div>

      <h2 className="report-section-title">프로젝트 상태 분포</h2>
      <div className="report-bars-card">
        <BarRow label="요청" count={requestedProjects} total={totalProjects} color="#6c8ebf" />
        <BarRow label="수락" count={acceptedProjects} total={totalProjects} color="#82b366" />
        <BarRow label="진행중" count={inProgressProjects} total={totalProjects} color="#d6b656" />
        <BarRow label="완료" count={completedProjects} total={totalProjects} color="var(--green-accent)" />
        <BarRow label="취소" count={cancelledProjects} total={totalProjects} color="#666" />
      </div>

      <h2 className="report-section-title">검증/신고 현황</h2>
      <div className="report-bars-card">
        <BarRow label="검증 완료 프리랜서" count={verifiedFreelancers} total={Math.max(totalFreelancers, 1)} color="var(--green-accent)" />
        <BarRow label="블라인드 리뷰" count={blindedReviews} total={Math.max(totalReviews, 1)} color="#c0392b" />
        <BarRow label="미처리 신고" count={pendingReports} total={Math.max(totalReports, 1)} color="#d6b656" />
      </div>

      {dashboard && (
        <>
          <h2 className="report-section-title">최근 인증 요청</h2>
          <div className="admin-list">
            {dashboard.recentPendingVerifications.map((item) => (
              <div key={item.verificationId} className="admin-item">
                <div>
                  <strong>{item.applicantName}</strong>
                  <p className="admin-subtext">{item.verificationType}</p>
                </div>
                <span className="admin-subtext">{formatDateTime(item.requestedAt)}</span>
              </div>
            ))}
          </div>

          <h2 className="report-section-title">최근 신고</h2>
          <div className="admin-list">
            {dashboard.recentReports.map((item) => (
              <div key={item.reportId} className="admin-item">
                <div>
                  <strong>{item.reasonType}</strong>
                  <p className="admin-subtext">신고자 {item.reporterName}</p>
                </div>
                <span className="admin-subtext">{formatDateTime(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
