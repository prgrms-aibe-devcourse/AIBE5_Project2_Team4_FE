import type { FormEvent } from 'react';
import type { EditableProjectFields, ProjectType } from '../store/appProjectStore';

const PROJECT_TYPES: ProjectType[] = ['HOSPITAL', 'GOVERNMENT', 'OUTING', 'DAILY', 'OTHER'];
const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  HOSPITAL: '병원',
  GOVERNMENT: '관공서',
  OUTING: '외출',
  DAILY: '생활 지원',
  OTHER: '기타',
};

interface Props {
  mode: 'create' | 'edit';
  form: EditableProjectFields;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof EditableProjectFields, value: string) => void;
}

export default function ProjectFormModal({ mode, form, onClose, onSubmit, onFieldChange }: Props) {
  const isEdit = mode === 'edit';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>닫기</button>
        <h2 className="modal-title">{isEdit ? '프로젝트 수정' : '새 프로젝트'}</h2>

        <form className="create-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              placeholder="프로젝트 제목을 입력하세요."
              value={form.title}
              onChange={(e) => onFieldChange('title', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>유형</label>
            <div className="type-selector">
              {PROJECT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`type-btn${form.type === type ? ' selected' : ''}`}
                  onClick={() => onFieldChange('type', type)}
                >
                  {PROJECT_TYPE_LABEL[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>날짜</label>
              <input type="date" value={form.date}
                onChange={(e) => onFieldChange('date', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>시간</label>
              <input type="time" value={form.time}
                onChange={(e) => onFieldChange('time', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label>위치</label>
            <input type="text" placeholder="주소를 입력하세요." value={form.location}
              onChange={(e) => onFieldChange('location', e.target.value)} required />
          </div>

          <div className="form-group">
            <label>요청 사항</label>
            <textarea placeholder="필요한 도움을 자세히 입력하세요." value={form.description}
              onChange={(e) => onFieldChange('description', e.target.value)} rows={4} />
          </div>

          <button type="submit" className="btn-create form-submit">
            {isEdit ? '수정 저장' : '프로젝트 등록'}
          </button>
        </form>
      </div>
    </div>
  );
}
