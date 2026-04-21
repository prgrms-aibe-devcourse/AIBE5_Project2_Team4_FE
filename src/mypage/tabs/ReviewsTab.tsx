import type { ReviewSummaryResponse, ReviewTagCodeResponse } from '../../api/reviews';
import { formatDateTime } from '../../lib/referenceData';

interface Props {
  reviews: ReviewSummaryResponse[];
  editingReviewId: number | null;
  editRating: number;
  editTagCodes: string[];
  editContent: string;
  reviewTags: ReviewTagCodeResponse[];
  canEdit: boolean;
  setEditingReviewId: (id: number | null) => void;
  setEditRating: (rating: number) => void;
  setEditContent: (content: string) => void;
  handleEditTagToggle: (tagCode: string) => void;
  handleReviewUpdate: (reviewId: number) => void;
  handleReviewDelete: (reviewId: number) => void;
  startEditReview: (review: ReviewSummaryResponse) => void;
}

export default function ReviewsTab({
  reviews,
  editingReviewId,
  editRating,
  editTagCodes,
  editContent,
  reviewTags,
  canEdit,
  setEditingReviewId,
  setEditRating,
  setEditContent,
  handleEditTagToggle,
  handleReviewUpdate,
  handleReviewDelete,
  startEditReview,
}: Props) {
  return (
    <div className="tab-content">
      {reviews.length === 0 ? (
        <p className="empty-msg">작성한 리뷰가 없습니다.</p>
      ) : (
        <ul className="review-list">
          {reviews.map((review) => (
            <li key={review.reviewId} className="review-item">
              <div className="review-header">
                <div>
                  <span className="review-service">{review.freelancerName || review.projectTitle}</span>
                  <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                </div>
                <span className="review-date">{formatDateTime(review.createdAt)}</span>
              </div>
              <div className="review-tag-row">
                {review.tagCodes.map((tagCode) => <span key={tagCode} className="skill-tag">{tagCode}</span>)}
              </div>
              {canEdit && editingReviewId === review.reviewId ? (
                <div className="review-editor">
                  <div className="review-rating-row">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        className={`review-rating-btn${editRating === score ? ' selected' : ''}`}
                        onClick={() => setEditRating(score)}
                      >
                        {score}점
                      </button>
                    ))}
                  </div>
                  <div className="type-selector">
                    {reviewTags.map((tag) => (
                      <button
                        key={tag.code}
                        type="button"
                        className={`type-btn${editTagCodes.includes(tag.code) ? ' selected' : ''}`}
                        onClick={() => handleEditTagToggle(tag.code)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="bio-textarea"
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                    rows={4}
                  />
                  <div className="bio-actions">
                    <button className="btn-edit" onClick={() => handleReviewUpdate(review.reviewId)}>저장</button>
                    <button className="btn-cancel" onClick={() => setEditingReviewId(null)}>취소</button>
                  </div>
                </div>
              ) : (
                <p className="review-content">{review.blindedYn ? '블라인드 처리된 리뷰입니다.' : review.content}</p>
              )}
              <div className="review-actions-row">
                {canEdit && (
                  <>
                    <button className="btn-edit" onClick={() => startEditReview(review)}>수정</button>
                    <button className="btn-cancel" onClick={() => handleReviewDelete(review.reviewId)}>삭제</button>
                  </>
                )}
                <span className="review-state-text">
                  {review.blindedYn ? '블라인드' : review.reported ? '신고 접수됨' : '정상 노출'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
