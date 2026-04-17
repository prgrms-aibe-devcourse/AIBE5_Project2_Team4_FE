import type { ReviewRecord } from '../../store/appReviewStore';

interface Props {
  reportedReviews: ReviewRecord[];
  handleBlindToggle: (id: number) => void;
  handleReportClear: (id: number) => void;
}

export default function ReportsTab({ reportedReviews, handleBlindToggle, handleReportClear }: Props) {
  return (
    <div className="tab-content">
      {reportedReviews.length === 0 ? (
        <p className="empty-msg">신고된 리뷰가 없습니다.</p>
      ) : (
        <ul className="review-list">
          {reportedReviews.map((review) => (
            <li key={review.id} className="review-item">
              <div className="review-header">
                <div>
                  <span className="review-service">{review.freelancerName}</span>
                  <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                </div>
                <span className="review-date">{review.date}</span>
              </div>
              <p className="review-content">{review.content}</p>
              <p className="admin-subtext">신고 사유: {review.reportReason}</p>
              <div className="review-actions-row">
                <button className="btn-edit" onClick={() => handleBlindToggle(review.id)}>
                  {review.blinded ? '블라인드 해제' : '블라인드'}
                </button>
                <button className="btn-cancel" onClick={() => handleReportClear(review.id)}>신고 해제</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
