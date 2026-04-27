import type { Dispatch, SetStateAction } from 'react';
import ActivityRegionSelector from './ActivityRegionSelector';
import type { CodeLookupResponse } from '../../api/codes';
import type { UserMyPageResponse } from '../../api/users';
import type { User } from '../../store/appAuth';
import { toggleSelection, type FreelancerFormState, type ProfileFormState } from '../myPageShared';

interface AccountTabContentProps {
  user: User;
  summary: UserMyPageResponse | null;
  saving: boolean;

  profileForm: ProfileFormState;
  setProfileForm: Dispatch<SetStateAction<ProfileFormState>>;
  onSaveAccount(): void;

  isFreelancer: boolean;

  showMateApplyForm: boolean;
  setShowMateApplyForm: Dispatch<SetStateAction<boolean>>;
  applyForm: FreelancerFormState;
  setApplyForm: Dispatch<SetStateAction<FreelancerFormState>>;
  applyFiles: File[];
  onApplyFileAdd(files: File[]): void;
  onApplyFileRemove(index: number): void;
  onApplyAsFreelancer(): void;

  showFreelancerProfileForm: boolean;
  setShowFreelancerProfileForm: Dispatch<SetStateAction<boolean>>;
  freelancerForm: FreelancerFormState;
  setFreelancerForm: Dispatch<SetStateAction<FreelancerFormState>>;
  onSaveFreelancerProfile(): void;

  regionOptions: CodeLookupResponse[];
  regionMap: Map<string, string>;
  timeSlotOptions: CodeLookupResponse[];
  projectTypeOptions: CodeLookupResponse[];
}

export default function AccountTabContent({
  user,
  summary,
  saving,
  profileForm,
  setProfileForm,
  onSaveAccount,
  isFreelancer,
  showMateApplyForm,
  setShowMateApplyForm,
  applyForm,
  setApplyForm,
  applyFiles,
  onApplyFileAdd,
  onApplyFileRemove,
  onApplyAsFreelancer,
  showFreelancerProfileForm,
  setShowFreelancerProfileForm,
  freelancerForm,
  setFreelancerForm,
  onSaveFreelancerProfile,
  regionOptions,
  regionMap,
  timeSlotOptions,
  projectTypeOptions,
}: AccountTabContentProps) {
  return (
    <div className="account-card">
      <div className="account-card-head">
        <h2>계정 정보</h2>
        <button className="btn-edit" onClick={() => onSaveAccount()} disabled={saving}>저장</button>
      </div>

      <div className="account-edit-form">
        <div className="account-field">
          <label>이름</label>
          <input className="account-input" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <div className="account-field account-field--readonly">
          <label>이메일</label>
          <span>{user.email}</span>
        </div>
        <div className="account-field">
          <label>전화번호</label>
          <input className="account-input" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
        </div>
        <div className="account-field">
          <label>소개</label>
          <textarea className="account-textarea" rows={4} value={profileForm.intro} onChange={(event) => setProfileForm((current) => ({ ...current, intro: event.target.value }))} />
        </div>
      </div>

      {summary && (
        <div className="admin-grid" style={{ marginTop: '1.5rem' }}>
          <div className="metric-card">
            <span className="metric-label">총 프로젝트</span>
            <strong className="metric-value">{summary.projectStats.totalProjects}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">완료 프로젝트</span>
            <strong className="metric-value">{summary.projectStats.completedProjects}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">작성 리뷰</span>
            <strong className="metric-value">{summary.reviewStats.writtenReviewCount}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">미읽음 알림</span>
            <strong className="metric-value">{summary.notificationSummary.unreadNotificationCount}</strong>
          </div>
        </div>
      )}

      {!isFreelancer && (
        <div className="account-card" style={{ marginTop: '1.5rem' }}>
          <div className="account-card-head">
            <h2>메이트 신청</h2>
            <button
              className={showMateApplyForm ? 'btn-cancel' : 'btn-edit'}
              onClick={() => setShowMateApplyForm((current) => !current)}
              disabled={saving}
            >
              {showMateApplyForm ? '접기' : '신청 폼 열기'}
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            메이트로 등록하면 돌봄 서비스를 제공하고 의뢰를 받을 수 있습니다. 아래 정보를 입력하고 신청하세요.
          </p>

          {showMateApplyForm && (
            <div className="account-edit-form">
              <div className="account-field">
                <label>경력 소개</label>
                <textarea
                  className="account-textarea"
                  rows={4}
                  placeholder="본인의 경력이나 돌봄 경험을 간략히 소개해 주세요"
                  value={applyForm.careerDescription}
                  onChange={(event) => setApplyForm((current) => ({ ...current, careerDescription: event.target.value }))}
                />
              </div>
              <div className="account-field">
                <label>프로필 공개 설정</label>
                <div className="mp-chip-group">
                  <button
                    type="button"
                    className={`mp-chip${applyForm.publicYn ? ' mp-chip--selected' : ''}`}
                    onClick={() => setApplyForm((current) => ({ ...current, publicYn: !current.publicYn }))}
                  >
                    {applyForm.publicYn ? '✓ 공개' : '비공개'}
                  </button>
                  <button
                    type="button"
                    className={`mp-chip${applyForm.caregiverYn ? ' mp-chip--selected' : ''}`}
                    onClick={() => setApplyForm((current) => ({ ...current, caregiverYn: !current.caregiverYn }))}
                  >
                    {applyForm.caregiverYn ? '✓ 요양보호사' : '일반 활동자'}
                  </button>
                </div>
              </div>
              <div className="account-field">
                <label>활동 지역 (최대 5개 선택)</label>
                <ActivityRegionSelector
                  mode="chip"
                  regionOptions={regionOptions}
                  regionMap={regionMap}
                  value={applyForm.activityRegionCodes}
                  onChange={(next) => setApplyForm((current) => ({ ...current, activityRegionCodes: next }))}
                />
              </div>
              <div className="account-field">
                <label>가능 시간대 (복수 선택)</label>
                <div className="mp-chip-group">
                  {timeSlotOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      className={`mp-chip${applyForm.availableTimeSlotCodes.includes(option.code) ? ' mp-chip--selected' : ''}`}
                      onClick={() => setApplyForm((current) => ({
                        ...current,
                        availableTimeSlotCodes: toggleSelection(current.availableTimeSlotCodes, option.code),
                      }))}
                    >
                      {applyForm.availableTimeSlotCodes.includes(option.code) ? `✓ ${option.name}` : option.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="account-field">
                <label>제공 서비스 유형 (복수 선택)</label>
                <div className="mp-chip-group">
                  {projectTypeOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      className={`mp-chip${applyForm.projectTypeCodes.includes(option.code) ? ' mp-chip--selected' : ''}`}
                      onClick={() => setApplyForm((current) => ({
                        ...current,
                        projectTypeCodes: toggleSelection(current.projectTypeCodes, option.code),
                      }))}
                    >
                      {applyForm.projectTypeCodes.includes(option.code) ? `✓ ${option.name}` : option.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="account-field">
                <label>포트폴리오 파일 (선택)</label>
                <label className="certify-upload-label">
                  + 파일 추가
                  <input
                    hidden
                    type="file"
                    multiple
                    onChange={(e) => {
                      onApplyFileAdd(Array.from(e.target.files ?? []));
                      e.target.value = '';
                    }}
                  />
                </label>
                {applyFiles.length > 0 && (
                  <ul className="certify-file-list" style={{ marginTop: '0.5rem' }}>
                    {applyFiles.map((file, index) => (
                      <li key={index} className="certify-file-item">
                        <span>📄</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <button
                          type="button"
                          className="certify-file-remove"
                          onClick={() => onApplyFileRemove(index)}
                          aria-label="삭제"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                className="certify-submit-btn"
                onClick={() => onApplyAsFreelancer()}
                disabled={saving}
              >
                {saving ? '처리 중...' : '메이트 신청하기'}
              </button>
            </div>
          )}
        </div>
      )}

      {isFreelancer && (
        <div className="account-card" style={{ marginTop: '1.5rem' }}>
          <div className="account-card-head">
            <h2>프리랜서 프로필</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {showFreelancerProfileForm && (
                <button className="btn-edit" onClick={() => onSaveFreelancerProfile()} disabled={saving}>저장</button>
              )}
              <button
                type="button"
                className={showFreelancerProfileForm ? 'btn-cancel' : 'btn-edit'}
                onClick={() => setShowFreelancerProfileForm((v) => !v)}
              >
                {showFreelancerProfileForm ? '접기' : '편집'}
              </button>
            </div>
          </div>

          {showFreelancerProfileForm && <div className="account-edit-form">
            <div className="account-field">
              <label>경력 설명</label>
              <textarea
                className="account-textarea"
                rows={4}
                value={freelancerForm.careerDescription}
                onChange={(event) => setFreelancerForm((current) => ({ ...current, careerDescription: event.target.value }))}
              />
            </div>
            <div className="account-field">
              <label>공개 설정</label>
              <div className="type-selector">
                <button type="button" className={`type-btn${freelancerForm.publicYn ? ' selected' : ''}`} onClick={() => setFreelancerForm((current) => ({ ...current, publicYn: !current.publicYn }))}>
                  {freelancerForm.publicYn ? '공개중' : '비공개'}
                </button>
                <button type="button" className={`type-btn${freelancerForm.caregiverYn ? ' selected' : ''}`} onClick={() => setFreelancerForm((current) => ({ ...current, caregiverYn: !current.caregiverYn }))}>
                  {freelancerForm.caregiverYn ? '요양보호사' : '일반 활동자'}
                </button>
              </div>
            </div>
            <div className="account-field">
              <label>활동 지역 (최대 5개 선택)</label>
              <ActivityRegionSelector
                mode="type"
                regionOptions={regionOptions}
                regionMap={regionMap}
                value={freelancerForm.activityRegionCodes}
                onChange={(next) => setFreelancerForm((current) => ({ ...current, activityRegionCodes: next }))}
              />
            </div>
            <div className="account-field">
              <label>가능 시간대</label>
              <div className="type-selector">
                {timeSlotOptions.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    className={`type-btn${freelancerForm.availableTimeSlotCodes.includes(option.code) ? ' selected' : ''}`}
                    onClick={() => setFreelancerForm((current) => ({
                      ...current,
                      availableTimeSlotCodes: toggleSelection(current.availableTimeSlotCodes, option.code),
                    }))}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="account-field">
              <label>서비스 유형</label>
              <div className="type-selector">
                {projectTypeOptions.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    className={`type-btn${freelancerForm.projectTypeCodes.includes(option.code) ? ' selected' : ''}`}
                    onClick={() => setFreelancerForm((current) => ({
                      ...current,
                      projectTypeCodes: toggleSelection(current.projectTypeCodes, option.code),
                    }))}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          </div>}
        </div>
      )}
    </div>
  );
}

