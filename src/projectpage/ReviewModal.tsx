import type { FormEvent } from 'react';
import type { Project } from '../store/appProjectStore';
import type { ReviewRecord } from '../store/appReviewStore';

interface ReviewForm {
  rating: number;
  tags: string[];
  content: string;
}

interface Props {
  project: Project;
  selectedReview: ReviewRecord | null;
  reviewForm: ReviewForm;
  reviewTags: string[];
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onRatingChange: (rating: number) => void;
  onTagToggle: (tag: string) => void;
  onContentChange: (content: string) => void;
}

export default function ReviewModal({
  project,
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
      <div className="modal review-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>닫기</button>
        <h2 className="modal-title">{project.title} 리뷰</h2>

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
                  key={tag}
                  type="button"
                  className={`type-btn${reviewForm.tags.includes(tag) ? ' selected' : ''}`}
                  onClick={() => onTagToggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>리뷰 내용</label>
            <textarea
              placeholder="완료된 프로젝트 경험을 남겨주세요."
              value={reviewForm.content}
              onChange={(e) => onContentChange(e.target.value)}
              rows={5}
              required
            />
          </div>

          {selectedReview && (
            <p className="review-helper-text">이미 같은 프로젝트에 작성한 리뷰가 있어 수정 모드로 열렸습니다.</p>
          )}

          <button type="submit" className="btn-create form-submit">
            {selectedReview ? '리뷰 수정' : '리뷰 등록'}
          </button>
        </form>
      </div>
    </div>
  );
}
