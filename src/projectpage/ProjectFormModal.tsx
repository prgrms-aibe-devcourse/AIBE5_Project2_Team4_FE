import { useState } from 'react';
import type { FormEvent } from 'react';
import { sortSido } from '../lib/referenceData';

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
  parentRegionCode?: string | null;
  regionLevel?: number | null;
}

interface Props {
  mode: 'create' | 'edit';
  form: ProjectFormValues;
  projectTypeOptions: Option[];
  regionOptions: Option[];
  error?: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof ProjectFormValues, value: string) => void;
}

function getNowMin(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function ProjectFormModal({
  mode,
  form,
  projectTypeOptions,
  regionOptions,
  error,
  onClose,
  onSubmit,
  onFieldChange,
}: Props) {
  const isEdit = mode === 'edit';
  const [nowMin] = useState(getNowMin);

  const sidoOnly = regionOptions.filter((r) => r.regionLevel === 1);
  const topRegions = sortSido(sidoOnly.length > 0 ? sidoOnly : regionOptions.filter((r) => !r.parentRegionCode));
  const allSubRegions = regionOptions.filter((r) => r.regionLevel === 2 || (r.regionLevel == null && !!r.parentRegionCode));

  const selectedTopCode = (() => {
    if (!form.serviceRegionCode) return '';
    const selected = regionOptions.find((r) => r.code === form.serviceRegionCode);
    if (!selected) return '';
    return selected.parentRegionCode ?? selected.code;
  })();

  const [openParent, setOpenParent] = useState<string>(selectedTopCode);

  const subRegions = allSubRegions.filter((r) => r.parentRegionCode === openParent);

  function handleTopRegionClick(code: string) {
    const children = allSubRegions.filter((r) => r.parentRegionCode === code);
    if (openParent === code) {
      setOpenParent('');
      if (form.serviceRegionCode !== code) {
        onFieldChange('serviceRegionCode', '');
      }
    } else {
      setOpenParent(code);
      if (children.length === 0) {
        onFieldChange('serviceRegionCode', code);
      } else {
        onFieldChange('serviceRegionCode', '');
      }
    }
  }

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
            <select
              value={form.projectTypeCode}
              onChange={(e) => onFieldChange('projectTypeCode', e.target.value)}
              required
            >
              <option value="">서비스 유형을 선택해 주세요</option>
              {projectTypeOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>활동 지역</label>
            <div className="type-selector">
              {topRegions.map((region) => (
                <button
                  key={region.code}
                  type="button"
                  className={`type-btn${openParent === region.code ? ' selected' : ''}`}
                  onClick={() => handleTopRegionClick(region.code)}
                >
                  {region.name}
                </button>
              ))}
            </div>

            {openParent && subRegions.length > 0 && (
              <div className="type-selector region-sub-selector">
                <button
                  type="button"
                  className={`type-btn type-btn--sub${form.serviceRegionCode === openParent ? ' selected' : ''}`}
                  onClick={() => onFieldChange('serviceRegionCode', openParent)}
                >
                  전체
                </button>
                {subRegions.map((sub) => (
                  <button
                    key={sub.code}
                    type="button"
                    className={`type-btn type-btn--sub${form.serviceRegionCode === sub.code ? ' selected' : ''}`}
                    onClick={() => onFieldChange('serviceRegionCode', sub.code)}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>시작 시각</label>
              <input
                type="datetime-local"
                value={form.requestedStartAt}
                min={nowMin}
                onChange={(event) => onFieldChange('requestedStartAt', event.target.value)}
                onBlur={(event) => {
                  if (event.target.value && event.target.value < nowMin) {
                    onFieldChange('requestedStartAt', nowMin);
                  }
                }}
                required
              />
            </div>
            <div className="form-group">
              <label>종료 시각</label>
              <input
                type="datetime-local"
                value={form.requestedEndAt}
                min={form.requestedStartAt || nowMin}
                onChange={(event) => onFieldChange('requestedEndAt', event.target.value)}
                onBlur={(event) => {
                  const minEnd = form.requestedStartAt || nowMin;
                  if (event.target.value && event.target.value < minEnd) {
                    onFieldChange('requestedEndAt', minEnd);
                  }
                }}
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

          {error && (
            <p style={{ color: '#e07070', fontSize: '0.875rem', margin: '0.25rem 0' }}>{error}</p>
          )}
          <button type="submit" className="btn-create form-submit">
            {isEdit ? '수정 저장' : '프로젝트 등록'}
          </button>
        </form>
      </div>
    </div>
  );
}
