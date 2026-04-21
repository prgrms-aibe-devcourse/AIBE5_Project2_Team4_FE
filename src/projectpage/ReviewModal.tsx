import type { FormEvent } from 'react';
import type { ReviewDetailResponse } from '../api/reviews';

interface ReviewForm {
  rating: number;
  tagCodes: string[];
  content: string;
}

interface ReviewTagOption {
  code: string;
  name: string;
}

interface Props {
  projectTitle: string;
  selectedReview: ReviewDetailResponse | null;
  reviewForm: ReviewForm;
  reviewTags: ReviewTagOption[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRatingChange: (rating: number) => void;
  onTagToggle: (tagCode: string) => void;
  onContentChange: (content: string) => void;
}

export default function ReviewModal({
  projectTitle,
  selectedReview,
  reviewForm,
  reviewTags,
  onClose,
  onSubmit,
  onRatingChange,
  onTagToggle,
  onContentChange,
}: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal review-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>닫기</button>
        <h2 className="modal-title">{projectTitle} 리뷰</h2>

        <form className="create-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label>별점</label>
            <div className="review-rating-row">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  className={`review-rating-btn${reviewForm.rating === score ? ' selected' : ''}`}
                  onClick={() => onRatingChange(score)}
                >
                  {score}점
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>태그</label>
            <div className="type-selector">
              {reviewTags.map((tag) => (
                <button
                  key={tag.code}
                  type="button"
                  className={`type-btn${reviewForm.tagCodes.includes(tag.code) ? ' selected' : ''}`}
                  onClick={() => onTagToggle(tag.code)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>리뷰 내용</label>
            <textarea
              placeholder="완료된 프로젝트 경험을 남겨 주세요"
              value={reviewForm.content}
              onChange={(event) => onContentChange(event.target.value)}
              rows={5}
              required
            />
          </div>

          {selectedReview && (
            <p className="review-helper-text">기존 리뷰를 수정하는 중입니다.</p>
          )}

          <button type="submit" className="btn-create form-submit">
            {selectedReview ? '리뷰 수정' : '리뷰 등록'}
          </button>
        </form>
      </div>
    </div>
  );
}
