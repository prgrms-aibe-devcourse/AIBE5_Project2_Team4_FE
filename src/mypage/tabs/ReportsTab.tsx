import type {
  AdminReportDetailResponse,
  AdminReportListItemResponse,
  AdminReviewListItemResponse,
} from '../../api/admin';
import type { ReportSummaryResponse } from '../../api/reports';
import { formatDateTime } from '../../lib/referenceData';
import { reportReasonLabel, reportStatusLabel } from '../../lib/koreanLabels';

type Props =
  | {
      mode: 'user';
      reports: ReportSummaryResponse[];
    }
  | {
      mode: 'admin';
      reviews: AdminReviewListItemResponse[];
      reports: AdminReportListItemResponse[];
      selectedReport: AdminReportDetailResponse | null;
      onBlindToggle: (reviewId: number, blindedYn: boolean) => void;
      onSelectReport: (reportId: number) => void;
      onCloseReport: () => void;
      onResolveReport: (reportId: number) => void;
      onRejectReport: (reportId: number) => void;
    };

export default function ReportsTab(props: Props) {
  if (props.mode === 'user') {
    return (
      <div className="tab-content">
        {props.reports.length === 0 ? (
          <p className="empty-msg">신고 내역이 없습니다.</p>
        ) : (
          <ul className="review-list">
            {props.reports.map((report) => (
              <li key={report.reportId} className="review-item">
                <div className="review-header">
                  <div>
                    <span className="review-service">{report.review.projectTitle}</span>
                    <div className="review-stars">{'★'.repeat(report.review.rating)}{'☆'.repeat(5 - report.review.rating)}</div>
                  </div>
                  <span className="review-date">{formatDateTime(report.createdAt)}</span>
                </div>
                <p className="review-content">{report.review.contentSummary || '상세 내용은 관리자 검토 중입니다.'}</p>
                <p className="admin-subtext">사유: {reportReasonLabel(report.reasonType)}{report.reasonDetailSummary ? ` / ${report.reasonDetailSummary}` : ''}</p>
                <div className="review-actions-row">
                  <span className="review-state-text">처리 상태: {reportStatusLabel(report.status)}</span>
                  {report.handledAt && <span className="review-state-text">처리 일시: {formatDateTime(report.handledAt)}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="report-admin-grid">
        <section className="report-admin-section">
          <h3 className="report-section-title">리뷰 노출 관리</h3>
          {props.reviews.length === 0 ? (
            <p className="empty-msg">관리 대상 리뷰가 없습니다.</p>
          ) : (
            <ul className="review-list">
              {props.reviews.map((review) => (
                <li key={review.reviewId} className="review-item">
                  <div className="review-header">
                    <div>
                      <span className="review-service">{review.projectTitle}</span>
                      <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                    </div>
                    <span className="review-date">{formatDateTime(review.createdAt)}</span>
                  </div>
                  <p className="admin-subtext">
                    작성자 {review.writer.name} / 대상 {review.targetFreelancer.name}
                  </p>
                  <div className="review-actions-row">
                    <span className="review-state-text">{review.blindedYn ? '블라인드됨' : '노출 중'}</span>
                    <button
                      className="btn-edit"
                      onClick={() => props.onBlindToggle(review.reviewId, review.blindedYn)}
                    >
                      {review.blindedYn ? '블라인드 해제' : '블라인드'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="report-admin-section">
          <h3 className="report-section-title">신고 처리</h3>
          {props.reports.length === 0 ? (
            <p className="empty-msg">처리할 신고가 없습니다.</p>
          ) : (
            <ul className="review-list">
              {props.reports.map((report) => (
                <li key={report.reportId} className="review-item">
                  <div className="review-header">
                    <div>
                      <span className="review-service">{reportReasonLabel(report.reasonType)}</span>
                      <div className="admin-subtext">신고자 {report.reporter.name}</div>
                    </div>
                    <span className="review-date">{formatDateTime(report.createdAt)}</span>
                  </div>
                  <div className="review-actions-row">
                    <span className="review-state-text">상태: {reportStatusLabel(report.status)}</span>
                    <button className="btn-edit" onClick={() => props.onSelectReport(report.reportId)}>상세</button>
                    <button className="btn-edit" onClick={() => props.onResolveReport(report.reportId)}>승인</button>
                    <button className="btn-cancel" onClick={() => props.onRejectReport(report.reportId)}>반려</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

        </section>
      </div>

      {props.selectedReport && (
        <div className="mp-modal-overlay" onClick={props.onCloseReport}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="mp-modal-close" onClick={props.onCloseReport}>✕</button>
            <div className="mp-modal-head">
              <h2 className="mp-modal-title">신고 #{props.selectedReport.reportId} 상세</h2>
              <p className="admin-subtext">사유: {reportReasonLabel(props.selectedReport.reasonType)}</p>
            </div>
            {props.selectedReport.reasonDetail && (
              <p className="review-content">{props.selectedReport.reasonDetail}</p>
            )}
            <ul className="mp-modal-info">
              <li><span>상태</span><span>{reportStatusLabel(props.selectedReport.status)}</span></li>
              <li><span>신고자</span><span>{props.selectedReport.reporter.name}</span></li>
              <li><span>대상 리뷰</span><span>{props.selectedReport.review.projectTitle}</span></li>
              <li><span>블라인드</span><span>{props.selectedReport.review.blindedYn ? '예' : '아니오'}</span></li>
              <li><span>작성자</span><span>{props.selectedReport.review.writer.name}</span></li>
              <li><span>대상 프리랜서</span><span>{props.selectedReport.review.targetFreelancer.name}</span></li>
            </ul>
            {props.selectedReport.status === 'PENDING' && (
              <div className="mp-modal-actions">
                <button
                  className="btn-edit"
                  style={{ flex: 1 }}
                  onClick={() => props.onResolveReport(props.selectedReport!.reportId)}
                >
                  승인
                </button>
                <button
                  className="btn-cancel"
                  style={{ flex: 1 }}
                  onClick={() => props.onRejectReport(props.selectedReport!.reportId)}
                >
                  반려
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
