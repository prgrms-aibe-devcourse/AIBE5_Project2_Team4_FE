import type { ReviewRecord } from '../../store/appReviewStore';

interface Props {
  reviews: ReviewRecord[];
  isFreelancer: boolean;
  editingReviewId: number | null;
  editRating: number;
  editTags: string[];
  editContent: string;
  reviewTags: string[];
  setEditingReviewId: (id: number | null) => void;
  setEditRating: (r: number) => void;
  setEditContent: (c: string) => void;
  handleEditTagToggle: (tag: string) => void;
  handleReviewUpdate: (id: number) => void;
  handleReviewDelete: (id: number) => void;
  startEditReview: (review: ReviewRecord) => void;
}

export default function ReviewsTab({
  reviews,
  isFreelancer,
  editingReviewId,
  editRating,
  editTags,
  editContent,
  reviewTags,
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
            <li key={review.id} className="review-item">
              <div className="review-header">
                <div>
                  <span className="review-service">{review.freelancerName}</span>
                  <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                </div>
                <span className="review-date">{review.date}</span>
              </div>
              <div className="review-tag-row">
                {review.tags.map((tag) => <span key={tag} className="skill-tag">{tag}</span>)}
              </div>
              {!isFreelancer && editingReviewId === review.id ? (
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
                        key={tag}
                        type="button"
                        className={`type-btn${editTags.includes(tag) ? ' selected' : ''}`}
                        onClick={() => handleEditTagToggle(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="bio-textarea"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                  />
                  <div className="bio-actions">
                    <button className="btn-edit" onClick={() => handleReviewUpdate(review.id)}>저장</button>
                    <button className="btn-cancel" onClick={() => setEditingReviewId(null)}>취소</button>
                  </div>
                </div>
              ) : (
                <p className="review-content">{review.content}</p>
              )}
              <div className="review-actions-row">
                {!isFreelancer && (
                  <>
                    <button className="btn-edit" onClick={() => startEditReview(review)}>수정</button>
                    <button className="btn-cancel" onClick={() => handleReviewDelete(review.id)}>삭제</button>
                  </>
                )}
                <span className="review-state-text">
                  {review.blinded ? '블라인드됨' : review.reported ? '신고 접수됨' : '정상 노출'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
