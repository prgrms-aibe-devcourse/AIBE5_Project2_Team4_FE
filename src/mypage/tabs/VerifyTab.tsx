import { FREELANCERS } from '../../store/appFreelancerStore';

type VerifyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VerifyRequest {
  id: number;
  freelancerId: number;
  freelancerName: string;
  freelancerEmail: string;
  skills: string[];
  requestedAt: string;
  status: VerifyStatus;
}

export const STATUS_LABEL: Record<VerifyStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

interface Props {
  verifyRequests: VerifyRequest[];
  verifyFilter: 'ALL' | VerifyStatus;
  setVerifyFilter: (f: 'ALL' | VerifyStatus) => void;
  filteredVerifyRequests: VerifyRequest[];
  verifyDetailId: number | null;
  setVerifyDetailId: (id: number | null) => void;
  handleVerify: (requestId: number, action: 'APPROVED' | 'REJECTED') => void;
}

export default function VerifyTab({
  verifyRequests,
  verifyFilter,
  setVerifyFilter,
  filteredVerifyRequests,
  verifyDetailId,
  setVerifyDetailId,
  handleVerify,
}: Props) {
  const verifyDetail = verifyDetailId !== null
    ? verifyRequests.find((r) => r.id === verifyDetailId) ?? null
    : null;
  const verifyDetailFreelancer = verifyDetail
    ? FREELANCERS.find((f) => f.id === verifyDetail.freelancerId) ?? null
    : null;

  return (
    <>
      <div className="tab-content">
        <div className="verify-toolbar">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn filter-btn--${f.toLowerCase()}${verifyFilter === f ? ' active' : ''}`}
              onClick={() => setVerifyFilter(f)}
            >
              {f === 'ALL'
                ? `전체 ${verifyRequests.length}`
                : `${STATUS_LABEL[f]} ${verifyRequests.filter((r) => r.status === f).length}`}
            </button>
          ))}
        </div>
        <ul className="verify-list">
          {filteredVerifyRequests.map((request) => {
            const fl = FREELANCERS.find((f) => f.id === request.freelancerId);
            return (
              <li key={request.id} className="verify-item">
                <div className="verify-item-left">
                  <div className="verify-avatar">
                    {fl?.photo
                      ? <img src={fl.photo} alt={fl.name} className="verify-avatar-img" />
                      : <span className="verify-avatar-initial">{request.freelancerName[0]}</span>
                    }
                  </div>
                  <div className="verify-info">
                    <div className="verify-name">{request.freelancerName}</div>
                    <div className="verify-email">{request.freelancerEmail}</div>
                    <div className="verify-skills">
                      {request.skills.map((skill) => <span key={skill} className="skill-tag">{skill}</span>)}
                    </div>
                  </div>
                </div>
                <div className="verify-right">
                  <span className="verify-date">{request.requestedAt}</span>
                  <button className="verify-btn verify-btn--detail" onClick={() => setVerifyDetailId(request.id)}>
                    상세보기
                  </button>
                  {request.status === 'PENDING' ? (
                    <div className="verify-actions">
                      <button className="verify-btn verify-btn--approve" onClick={() => handleVerify(request.id, 'APPROVED')}>승인</button>
                      <button className="verify-btn verify-btn--reject" onClick={() => handleVerify(request.id, 'REJECTED')}>반려</button>
                    </div>
                  ) : (
                    <span className={`verify-status verify-status--${request.status.toLowerCase()}`}>
                      {STATUS_LABEL[request.status]}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
          {filteredVerifyRequests.length === 0 && (
            <p className="empty-msg">해당 상태의 요청이 없습니다.</p>
          )}
        </ul>
      </div>

      {verifyDetail && verifyDetailFreelancer && (
        <div className="vd-overlay" onClick={() => setVerifyDetailId(null)}>
          <div className="vd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vd-modal-head">
              <h2>헬퍼 상세 정보</h2>
              <button type="button" className="avatar-modal-close" onClick={() => setVerifyDetailId(null)}>✕</button>
            </div>

            <div className="vd-profile">
              <div className="vd-avatar">
                {verifyDetailFreelancer.photo
                  ? <img src={verifyDetailFreelancer.photo} alt={verifyDetailFreelancer.name} className="vd-avatar-img" />
                  : <span className="vd-avatar-initial">{verifyDetailFreelancer.name[0]}</span>
                }
              </div>
              <div className="vd-profile-info">
                <div className="vd-name">{verifyDetailFreelancer.name}</div>
                <div className="vd-email">{verifyDetail.freelancerEmail}</div>
                <div className="vd-stats">
                  <span>★ {verifyDetailFreelancer.rating.toFixed(1)}</span>
                  <span>리뷰 {verifyDetailFreelancer.reviewCount}개</span>
                  <span>프로젝트 {verifyDetailFreelancer.projectCount}건</span>
                </div>
              </div>
            </div>

            {verifyDetailFreelancer.bio && (
              <div className="vd-section">
                <div className="vd-section-label">자기소개</div>
                <p className="vd-bio">{verifyDetailFreelancer.bio}</p>
              </div>
            )}

            <div className="vd-section">
              <div className="vd-section-label">제공 서비스</div>
              <div className="vd-tags">
                {verifyDetailFreelancer.skills.map((s) => <span key={s} className="skill-tag">{s}</span>)}
              </div>
            </div>

            <div className="vd-section">
              <div className="vd-section-label">활동 정보</div>
              <ul className="vd-info-list">
                <li><span>가능 시간</span><span>{verifyDetailFreelancer.availableHours}</span></li>
                <li><span>활동 지역</span><span>{verifyDetailFreelancer.availableRegions.join(', ')}</span></li>
              </ul>
            </div>

            <div className="vd-section">
              <div className="vd-section-label">포트폴리오</div>
              {verifyDetailFreelancer.portfolio
                ? (
                  <div className="vd-portfolio">
                    <span className="vd-portfolio-icon">📎</span>
                    <span className="vd-portfolio-name">{verifyDetailFreelancer.portfolio}</span>
                  </div>
                )
                : <span className="vd-empty">첨부된 포트폴리오가 없습니다.</span>
              }
            </div>

            <div className="vd-section">
              <div className="vd-section-label">검증 요청 정보</div>
              <ul className="vd-info-list">
                <li><span>요청일</span><span>{verifyDetail.requestedAt}</span></li>
                <li>
                  <span>현재 상태</span>
                  <span className={`verify-status verify-status--${verifyDetail.status.toLowerCase()}`}>
                    {STATUS_LABEL[verifyDetail.status]}
                  </span>
                </li>
              </ul>
            </div>

            {verifyDetail.status === 'PENDING' && (
              <div className="vd-actions">
                <button
                  className="verify-btn verify-btn--approve"
                  onClick={() => { handleVerify(verifyDetail.id, 'APPROVED'); setVerifyDetailId(null); }}
                >
                  승인
                </button>
                <button
                  className="verify-btn verify-btn--reject"
                  onClick={() => { handleVerify(verifyDetail.id, 'REJECTED'); setVerifyDetailId(null); }}
                >
                  반려
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
