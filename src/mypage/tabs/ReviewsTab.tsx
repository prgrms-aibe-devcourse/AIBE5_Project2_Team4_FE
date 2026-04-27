import { useState } from 'react';
import type { ReviewSummaryResponse, ReviewTagCodeResponse } from '../../api/reviews';
import { formatDateTime } from '../../lib/referenceData';

type ReviewListDirection = 'sent' | 'received';

interface Props {
  reviews: ReviewSummaryResponse[];
  receivedReviews: ReviewSummaryResponse[];
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

function getCounterpartName(review: ReviewSummaryResponse, direction: ReviewListDirection) {
  if (direction === 'received') {
    return review.reviewerName || review.projectTitle;
  }

  return review.revieweeName || review.freelancerName || review.projectTitle;
}

function ReviewCard({
  review,
  direction,
  editable,
  editingReviewId,
  editRating,
  editTagCodes,
  editContent,
  reviewTags,
  setEditingReviewId,
  setEditRating,
  setEditContent,
  handleEditTagToggle,
  handleReviewUpdate,
  handleReviewDelete,
  startEditReview,
}: {
  review: ReviewSummaryResponse;
  direction: ReviewListDirection;
  editable: boolean;
} & Omit<Props, 'reviews' | 'receivedReviews' | 'canEdit'>) {
  return (
    <li className="review-item">
      <div className="review-header">
        <div>
          <span className="review-service">
            {getCounterpartName(review, direction)}
          </span>
          {review.reviewDirection && (
            <span className="review-direction-badge">
              {review.reviewDirection === 'USER_TO_FREELANCER' ? '보호자 → 메이트' : '메이트 → 보호자'}
            </span>
          )}
          <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
        </div>
        <span className="review-date">{formatDateTime(review.createdAt)}</span>
      </div>
      <div className="review-tag-row">
        {review.tagCodes.map((tagCode) => <span key={tagCode} className="skill-tag">{tagCode}</span>)}
      </div>
      {editable && editingReviewId === review.reviewId ? (
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
        {editable && (
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
  );
}

export default function ReviewsTab({
  reviews,
  receivedReviews,
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
  const hasReceived = receivedReviews.length > 0;
  const [direction, setDirection] = useState<ReviewListDirection>('sent');

  const sharedCardProps = {
    editingReviewId,
    editRating,
    editTagCodes,
    editContent,
    reviewTags,
    setEditingReviewId,
    setEditRating,
    setEditContent,
    handleEditTagToggle,
    handleReviewUpdate,
    handleReviewDelete,
    startEditReview,
  };

  const activeList = direction === 'sent' ? reviews : receivedReviews;

  return (
    <div className="tab-content">
      <div className="review-direction-tabs">
        <button
          type="button"
          className={`review-dir-tab${direction === 'sent' ? ' active' : ''}`}
          onClick={() => setDirection('sent')}
        >
          보낸 리뷰 <span className="review-dir-count">{reviews.length}</span>
        </button>
        <button
          type="button"
          className={`review-dir-tab${direction === 'received' ? ' active' : ''}`}
          onClick={() => setDirection('received')}
        >
          받은 리뷰 <span className="review-dir-count">{receivedReviews.length}</span>
        </button>
      </div>

      {activeList.length === 0 ? (
        <p className="empty-msg">
          {direction === 'sent' ? '작성한 리뷰가 없습니다.' : '받은 리뷰가 없습니다.'}
          {direction === 'received' && !hasReceived && receivedReviews.length === 0 && reviews.length === 0 && null}
        </p>
      ) : (
        <ul className="review-list">
          {activeList.map((review) => (
            <ReviewCard
              key={review.reviewId}
              review={review}
              direction={direction}
              editable={direction === 'sent' && canEdit}
              {...sharedCardProps}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
