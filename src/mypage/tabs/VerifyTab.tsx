import type {
  AdminVerificationDetailResponse,
  AdminVerificationListItemResponse,
} from '../../api/admin';
import { resolveApiAssetUrl } from '../../api/client';
import { formatDateTime } from '../../lib/referenceData';
import { STATUS_LABEL, type VerifyStatus } from './verifyTabShared';

interface Props {
  verifications: AdminVerificationListItemResponse[];
  verifyFilter: VerifyStatus;
  setVerifyFilter: (filter: VerifyStatus) => void;
  selectedVerification: AdminVerificationDetailResponse | null;
  onSelectVerification: (verificationId: number) => void;
  onApproveVerification: (verificationId: number) => void;
  onRejectVerification: (verificationId: number) => void;
}

export default function VerifyTab({
  verifications,
  verifyFilter,
  setVerifyFilter,
  selectedVerification,
  onSelectVerification,
  onApproveVerification,
  onRejectVerification,
}: Props) {
  const filtered = verifyFilter === 'ALL'
    ? verifications
    : verifications.filter((verification) => verification.status === verifyFilter);

  return (
    <>
      <div className="tab-content">
        <div className="verify-toolbar">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as VerifyStatus[]).map((filter) => (
            <button
              key={filter}
              className={`filter-btn filter-btn--${filter.toLowerCase()}${verifyFilter === filter ? ' active' : ''}`}
              onClick={() => setVerifyFilter(filter)}
            >
              {filter === 'ALL'
                ? `전체 ${verifications.length}`
                : `${STATUS_LABEL[filter]} ${verifications.filter((verification) => verification.status === filter).length}`}
            </button>
          ))}
        </div>

        <ul className="verify-list">
          {filtered.map((verification) => (
            <li key={verification.verificationId} className="verify-item">
              <div className="verify-item-left">
                <div className="verify-avatar">
                  <span className="verify-avatar-initial">{verification.applicantName[0]}</span>
                </div>
                <div className="verify-info">
                  <div className="verify-name">{verification.applicantName}</div>
                  <div className="verify-email">{verification.applicantEmail}</div>
                  <div className="verify-skills">
                    <span className="skill-tag">{verification.verificationType}</span>
                    {verification.hasFiles && <span className="skill-tag">첨부파일 있음</span>}
                  </div>
                </div>
              </div>

              <div className="verify-right">
                <span className="verify-date">{formatDateTime(verification.requestedAt)}</span>
                <button className="verify-btn verify-btn--detail" onClick={() => onSelectVerification(verification.verificationId)}>
                  상세보기
                </button>
                {verification.status === 'PENDING' ? (
                  <div className="verify-actions">
                    <button className="verify-btn verify-btn--approve" onClick={() => onApproveVerification(verification.verificationId)}>승인</button>
                    <button className="verify-btn verify-btn--reject" onClick={() => onRejectVerification(verification.verificationId)}>반려</button>
                  </div>
                ) : (
                  <span className={`verify-status verify-status--${verification.status.toLowerCase()}`}>
                    {STATUS_LABEL[verification.status]}
                  </span>
                )}
              </div>
            </li>
          ))}
          {filtered.length === 0 && <p className="empty-msg">해당 상태의 인증 요청이 없습니다.</p>}
        </ul>
      </div>

      {selectedVerification && (
        <div className="vd-overlay" onClick={() => onSelectVerification(selectedVerification.verificationId)}>
          <div className="vd-modal" onClick={(event) => event.stopPropagation()}>
            <div className="vd-modal-head">
              <h2>인증 요청 상세</h2>
              <button type="button" className="avatar-modal-close" onClick={() => onSelectVerification(selectedVerification.verificationId)}>×</button>
            </div>

            <div className="vd-profile">
              <div className="vd-avatar">
                <span className="vd-avatar-initial">{selectedVerification.freelancer.name[0]}</span>
              </div>
              <div className="vd-profile-info">
                <div className="vd-name">{selectedVerification.freelancer.name}</div>
                <div className="vd-email">{selectedVerification.freelancer.email}</div>
                <div className="vd-stats">
                  <span>{selectedVerification.verificationType}</span>
                  <span>{selectedVerification.freelancer.verifiedYn ? '기존 인증자' : '신규 인증 요청'}</span>
                </div>
              </div>
            </div>

            {selectedVerification.description && (
              <div className="vd-section">
                <div className="vd-section-label">요청 메시지</div>
                <p className="vd-bio">{selectedVerification.description}</p>
              </div>
            )}

            <div className="vd-section">
              <div className="vd-section-label">첨부 파일</div>
              {selectedVerification.files.length === 0 ? (
                <span className="vd-empty">첨부 파일이 없습니다.</span>
              ) : (
                <ul className="verify-list">
                  {selectedVerification.files.map((file) => (
                    <li key={file.verificationFileId} className="verify-item">
                      <div className="verify-info">
                        <div className="verify-name">{file.originalName}</div>
                        <div className="verify-email">{formatDateTime(file.uploadedAt)}</div>
                      </div>
                      <div className="verify-actions">
                        <a
                          className="verify-btn verify-btn--detail"
                          href={resolveApiAssetUrl(file.viewUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          보기
                        </a>
                        <a className="verify-btn verify-btn--approve" href={resolveApiAssetUrl(file.downloadUrl)}>다운로드</a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="vd-section">
              <div className="vd-section-label">처리 정보</div>
              <ul className="vd-info-list">
                <li><span>요청일</span><span>{formatDateTime(selectedVerification.requestedAt)}</span></li>
                <li><span>상태</span><span>{selectedVerification.status}</span></li>
                <li><span>검토자</span><span>{selectedVerification.reviewedBy?.name || '-'}</span></li>
                <li><span>검토일</span><span>{formatDateTime(selectedVerification.reviewedAt)}</span></li>
                <li><span>반려 사유</span><span>{selectedVerification.rejectReason || '-'}</span></li>
              </ul>
            </div>

            {selectedVerification.status === 'PENDING' && (
              <div className="vd-actions">
                <button className="verify-btn verify-btn--approve" onClick={() => onApproveVerification(selectedVerification.verificationId)}>승인</button>
                <button className="verify-btn verify-btn--reject" onClick={() => onRejectVerification(selectedVerification.verificationId)}>반려</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
