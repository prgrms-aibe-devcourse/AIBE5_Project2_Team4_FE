import type { FormEvent } from 'react';

export interface ProjectFormValues {
  title: string;
  projectTypeCode: string;
  serviceRegionCode: string;
  requestedStartAt: string;
  requestedEndAt: string;
  serviceAddress: string;
  serviceDetailAddress: string;
  requestDetail: string;
}

interface Option {
  code: string;
  name: string;
}

interface Props {
  mode: 'create' | 'edit';
  form: ProjectFormValues;
  projectTypeOptions: Option[];
  regionOptions: Option[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof ProjectFormValues, value: string) => void;
}

export default function ProjectFormModal({
  mode,
  form,
  projectTypeOptions,
  regionOptions,
  onClose,
  onSubmit,
  onFieldChange,
}: Props) {
  const isEdit = mode === 'edit';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>닫기</button>
        <h2 className="modal-title">{isEdit ? '프로젝트 수정' : '새 프로젝트'}</h2>

        <form className="create-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              placeholder="프로젝트 제목을 입력해 주세요"
              value={form.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>서비스 유형</label>
            <div className="role-select-wrapper">
              <select
                value={form.projectTypeCode}
                onChange={(event) => onFieldChange('projectTypeCode', event.target.value)}
                required
              >
                <option value="">선택해 주세요</option>
                {projectTypeOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>활동 지역</label>
            <div className="role-select-wrapper">
              <select
                value={form.serviceRegionCode}
                onChange={(event) => onFieldChange('serviceRegionCode', event.target.value)}
                required
              >
                <option value="">선택해 주세요</option>
                {regionOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>시작 시각</label>
              <input
                type="datetime-local"
                value={form.requestedStartAt}
                onChange={(event) => onFieldChange('requestedStartAt', event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>종료 시각</label>
              <input
                type="datetime-local"
                value={form.requestedEndAt}
                onChange={(event) => onFieldChange('requestedEndAt', event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>주소</label>
            <input
              type="text"
              placeholder="기본 주소를 입력해 주세요"
              value={form.serviceAddress}
              onChange={(event) => onFieldChange('serviceAddress', event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>상세 주소</label>
            <input
              type="text"
              placeholder="상세 위치를 입력해 주세요"
              value={form.serviceDetailAddress}
              onChange={(event) => onFieldChange('serviceDetailAddress', event.target.value)}
            />
          </div>

          <div className="form-group">
            <label>요청 상세</label>
            <textarea
              placeholder="필요한 도움을 자세히 입력해 주세요"
              value={form.requestDetail}
              onChange={(event) => onFieldChange('requestDetail', event.target.value)}
              rows={5}
              required
            />
          </div>

          <button type="submit" className="btn-create form-submit">
            {isEdit ? '수정 저장' : '프로젝트 등록'}
          </button>
        </form>
      </div>
    </div>
  );
}
