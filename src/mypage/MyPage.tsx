import { useState, useEffect } from 'react';
import './mypage.css';
import AppHeader from '../components/AppHeader';
import { getUser, type User } from '../store/appAuth';
import { getProposals, updateProposalStatus, type Proposal } from '../store/appProposalStore';
import { createNotification } from '../store/notificationStore';

interface UsageHistory {
  id: number;
  date: string;
  type: string;
  topic: string;
  duration: string;
}

interface Review {
  id: number;
  date: string;
  service: string;
  rating: number;
  content: string;
}

type VerifyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface VerifyRequest {
  id: number;
  freelancerName: string;
  freelancerEmail: string;
  skills: string[];
  requestedAt: string;
  status: VerifyStatus;
}

// TODO: replace with GET /api/users/me/history
const MOCK_HISTORY: UsageHistory[] = [
  { id: 1, date: '2025.04.15', type: 'AI 대화',  topic: '여행 계획 도움 요청', duration: '12분' },
  { id: 2, date: '2025.04.13', type: 'AI 대화',  topic: '요리 레시피 추천',    duration: '8분'  },
  { id: 3, date: '2025.04.10', type: '일정 관리', topic: '주간 일정 정리',      duration: '5분'  },
  { id: 4, date: '2025.04.07', type: 'AI 대화',  topic: '영어 공부 도움',      duration: '20분' },
  { id: 5, date: '2025.04.03', type: '맞춤 추천', topic: '영화 추천',           duration: '6분'  },
];

// TODO: replace with GET /api/users/me/reviews
const MOCK_REVIEWS: Review[] = [
  { id: 1, date: '2025.04.14', service: 'AI 대화',  rating: 5, content: '정말 자연스럽게 대화할 수 있어서 좋았어요. 원하는 정보를 빠르게 얻었습니다.' },
  { id: 2, date: '2025.04.09', service: '맞춤 추천', rating: 4, content: '추천이 꽤 정확했지만 더 다양한 옵션이 있으면 좋겠어요.' },
  { id: 3, date: '2025.03.28', service: '일정 관리', rating: 5, content: '일정을 체계적으로 정리해줘서 한 주가 훨씬 편해졌어요!' },
];

// TODO: replace with GET /api/admin/verify-requests
const MOCK_VERIFY_REQUESTS: VerifyRequest[] = [
  { id: 1, freelancerName: '김철수', freelancerEmail: 'chulsoo@example.com', skills: ['React', 'TypeScript'], requestedAt: '2025.04.14', status: 'PENDING'  },
  { id: 2, freelancerName: '이영희', freelancerEmail: 'younghee@example.com', skills: ['UI/UX', 'Figma'],     requestedAt: '2025.04.12', status: 'PENDING'  },
  { id: 3, freelancerName: '박민준', freelancerEmail: 'minjun@example.com',   skills: ['Node.js', 'AWS'],      requestedAt: '2025.04.10', status: 'APPROVED' },
  { id: 4, freelancerName: '최수아', freelancerEmail: 'sua@example.com',      skills: ['Python', 'ML'],        requestedAt: '2025.04.08', status: 'REJECTED' },
  { id: 5, freelancerName: '정우진', freelancerEmail: 'woojin@example.com',   skills: ['iOS', 'Swift'],        requestedAt: '2025.04.06', status: 'PENDING'  },
];

type Tab = 'account' | 'history' | 'reviews' | 'verify' | 'certify' | 'proposals';

type CertifyType = '자격증' | '경력' | '요양보호사';
const CERTIFY_TYPES: CertifyType[] = ['자격증', '경력', '요양보호사'];
type StatusFilter = 'ALL' | VerifyStatus;

const STATUS_LABEL: Record<VerifyStatus, string> = {
  PENDING:  '대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [history, setHistory] = useState<UsageHistory[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verifyRequests, setVerifyRequests] = useState<VerifyRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [portfolioFile, setPortfolioFile] = useState<string | null>(null);
  const [portfolioStatus, setPortfolioStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [basicVerifyStatus, setBasicVerifyStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');
  const [certifyTypes, setCertifyTypes] = useState<CertifyType[]>([]);
  const [certifyFiles, setCertifyFiles] = useState<string[]>([]);
  const [certifySubmitted, setCertifySubmitted] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      window.location.href = '/login';
      return;
    }
    setUser(u);
    if (u.bio) setBio(u.bio);
    if (u.portfolio) setPortfolioFile(u.portfolio);
    if (u.portfolioStatus) setPortfolioStatus(u.portfolioStatus);
    setBasicVerifyStatus(u.basicVerifyStatus ?? 'NONE');
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      // TODO: fetch('/api/users/me/history').then(r => r.json()).then(setHistory);
      setHistory(MOCK_HISTORY);
    } else if (activeTab === 'reviews') {
      // TODO: fetch('/api/users/me/reviews').then(r => r.json()).then(setReviews);
      setReviews(MOCK_REVIEWS);
    } else if (activeTab === 'verify') {
      // TODO: fetch('/api/admin/verify-requests').then(r => r.json()).then(setVerifyRequests);
      setVerifyRequests(MOCK_VERIFY_REQUESTS);
    } else if (activeTab === 'proposals') {
      // TODO: fetch('/api/freelancer/proposals').then(r => r.json()).then(setProposals);
      const all = getProposals();
      setProposals(all.filter((proposal) => {
        if (user?.email && proposal.freelancerEmail) {
          return proposal.freelancerEmail === user.email;
        }

        return proposal.freelancerName === user?.name;
      }));
    }
  }, [activeTab]);

  // FR-VERIFY-05: 승인/반려 처리
  const handleVerify = (id: number, action: 'APPROVED' | 'REJECTED') => {
    // TODO: PATCH /api/admin/verify-requests/:id { status: action }
    setVerifyRequests(prev =>
      prev.map(req => req.id === id ? { ...req, status: action } : req)
    );
  };

  const handleBioSave = () => {
    // TODO: PATCH /api/users/me { bio }
    const updated = { ...user!, bio };
    setUser(updated);
    setEditingBio(false);
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: POST /api/users/me/portfolio (FormData)
    const updated = { ...user!, portfolio: file.name, portfolioStatus: 'PENDING' as const };
    setUser(updated);
    setPortfolioFile(file.name);
    setPortfolioStatus('PENDING');
  };

  // FR-MATCH-05: 제안 수락/거절
  const handleProposalAction = (id: number, action: 'ACCEPTED' | 'REJECTED') => {
    // TODO: PATCH /api/proposals/:id { status: action }
    //       ACCEPTED 시 서버에서 project.status → '수락' 으로 전이
    const updatedProposal = updateProposalStatus(id, action);

    if (action === 'ACCEPTED' && updatedProposal?.userEmail) {
      createNotification({
        userEmail: updatedProposal.userEmail,
        type: 'PROPOSAL_ACCEPTED',
        title: '제안이 수락되었습니다',
        message: `${updatedProposal.freelancerName} 프리랜서가 "${updatedProposal.projectTitle}" 제안을 수락했습니다.`,
        link: '/project',
      });
    }
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: action } : p));
  };

  // FR-VERIFY-01: 기본 인증 신청
  const handleBasicVerify = () => {
    // TODO: POST /api/users/me/verify/basic
    const updated = { ...user!, basicVerifyStatus: 'PENDING' as const };
    setUser(updated);
    setBasicVerifyStatus('PENDING');
  };

  // FR-VERIFY-02/03: 추가 검증 신청 + 증빙 업로드
  const handleCertifyTypeToggle = (type: CertifyType) => {
    setCertifyTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleCertifyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).map(f => f.name);
    setCertifyFiles(prev => [...prev, ...files]);
  };

  const handleCertifySubmit = () => {
    if (certifyTypes.length === 0) return;
    // TODO: POST /api/users/me/verify/certify { types: certifyTypes, files: certifyFiles }
    setCertifySubmitted(true);
  };

  const filteredRequests = statusFilter === 'ALL'
    ? verifyRequests
    : verifyRequests.filter(r => r.status === statusFilter);

  if (!user) return null;

  const isAdmin      = user.role === 'ROLE_ADMIN';
  const isFreelancer = user.role === 'ROLE_FREELANCER';

  return (
    <div className="mypage">
      <AppHeader activePage="mypage" />

      <main className="mypage-content">
        <div className="profile-section">
          <div className="avatar">
            <span>{user.name[0].toUpperCase()}</span>
          </div>
          <div className="profile-info">
            <h1 className="username">{user.name}</h1>
            <p className="email">{user.email}</p>
            <div className="profile-badges">
              <span className={`role-badge role-badge--${user.role.toLowerCase().replace('role_', '')}`}>
                {user.role}
              </span>
              {/* FR-VERIFY-06: 승인된 프리랜서 검증 배지 */}
              {user.role === 'ROLE_FREELANCER' && user.verified && (
                <span className="verified-badge">✦ 검증됨</span>
              )}
            </div>
          </div>
        </div>

        <div className="tab-bar">
          <button className={`tab-btn${activeTab === 'account' ? ' active' : ''}`} onClick={() => setActiveTab('account')}>계정 정보</button>
          {!isAdmin && (
            <>
              <button className={`tab-btn${activeTab === 'history' ? ' active' : ''}`} onClick={() => setActiveTab('history')}>이용 이력</button>
              <button className={`tab-btn${activeTab === 'reviews' ? ' active' : ''}`} onClick={() => setActiveTab('reviews')}>리뷰 내역</button>
              {isFreelancer && (
                <>
                  <button className={`tab-btn${activeTab === 'proposals' ? ' active' : ''}`} onClick={() => setActiveTab('proposals')}>받은 제안</button>
                  <button className={`tab-btn${activeTab === 'certify' ? ' active' : ''}`} onClick={() => setActiveTab('certify')}>인증 신청</button>
                </>
              )}
            </>
          )}
          {isAdmin && (
            <button className={`tab-btn${activeTab === 'verify' ? ' active' : ''}`} onClick={() => setActiveTab('verify')}>검증 관리</button>
          )}
        </div>

        {activeTab === 'account' && (
          <div className="cards-grid">
            <div className="card">
              <h2>계정 정보</h2>
              <ul>
                <li><span>이름</span><span>{user.name}</span></li>
                <li><span>이메일</span><span>{user.email}</span></li>
                <li><span>역할</span><span>{user.role}</span></li>
                <li><span>가입일</span><span>2025.01.01</span></li>
                {isFreelancer && (
                  <li>
                    <span>관리자 인증</span>
                    {user.verified
                      ? <span className="fl-verified">✦ 인증 완료</span>
                      : <span className="fl-unverified">미인증</span>
                    }
                  </li>
                )}
              </ul>
              <button className="btn-edit">수정하기</button>
            </div>

            {isFreelancer && (
              <>
                <div className="card">
                  <h2>포트폴리오</h2>
                  <div className="portfolio-area">
                    {portfolioFile ? (
                      <div className="portfolio-file">
                        <span className="portfolio-icon">📄</span>
                        <span className="portfolio-name">{portfolioFile}</span>
                      </div>
                    ) : (
                      <p className="portfolio-empty">업로드된 포트폴리오가 없습니다.</p>
                    )}
                  </div>
                  {portfolioFile && portfolioStatus && (
                    <div className={`portfolio-status portfolio-status--${portfolioStatus.toLowerCase()}`}>
                      {{
                        PENDING:  '⏳ 검토 중',
                        APPROVED: '✦ 인증 완료',
                        REJECTED: '✕ 반려됨',
                      }[portfolioStatus]}
                    </div>
                  )}
                  <label className="btn-edit portfolio-upload-label">
                    {portfolioFile ? '다시 업로드' : '업로드'}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.zip"
                      className="portfolio-file-input"
                      onChange={handlePortfolioChange}
                    />
                  </label>
                </div>

                <div className="card">
                  <h2>자기소개</h2>
                  {editingBio ? (
                    <textarea
                      className="bio-textarea"
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="자신을 소개해 주세요."
                      rows={4}
                    />
                  ) : (
                    <p className="bio-text">{bio || '자기소개를 작성해 주세요.'}</p>
                  )}
                  {editingBio ? (
                    <div className="bio-actions">
                      <button className="btn-edit" onClick={handleBioSave}>저장</button>
                      <button className="btn-cancel" onClick={() => setEditingBio(false)}>취소</button>
                    </div>
                  ) : (
                    <button className="btn-edit" onClick={() => setEditingBio(true)}>수정하기</button>
                  )}
                </div>
              </>
            )}

            {!isFreelancer && (
              <div className="card">
                <h2>이용 내역 요약</h2>
                <ul>
                  <li><span>이번 달 사용</span><span>12회</span></li>
                  <li><span>총 사용</span><span>48회</span></li>
                  <li><span>현재 플랜</span><span>Basic</span></li>
                </ul>
                <button className="btn-edit">플랜 변경</button>
              </div>
            )}

            <div className="card">
              <h2>보안</h2>
              <ul>
                <li><span>비밀번호</span><span>최근 변경: 30일 전</span></li>
                <li><span>2단계 인증</span><span>미설정</span></li>
              </ul>
              <button className="btn-edit">보안 설정</button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            {history.length === 0 ? (
              <p className="empty-msg">이용 이력이 없습니다.</p>
            ) : (
              <ul className="history-list">
                {history.map(item => (
                  <li key={item.id} className="history-item">
                    <div className="history-meta">
                      <span className="history-type">{item.type}</span>
                      <span className="history-date">{item.date}</span>
                    </div>
                    <p className="history-topic">{item.topic}</p>
                    <span className="history-duration">{item.duration}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="tab-content">
            {reviews.length === 0 ? (
              <p className="empty-msg">작성한 리뷰가 없습니다.</p>
            ) : (
              <ul className="review-list">
                {reviews.map(review => (
                  <li key={review.id} className="review-item">
                    <div className="review-header">
                      <div>
                        <span className="review-service">{review.service}</span>
                        <div className="review-stars">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                      </div>
                      <span className="review-date">{review.date}</span>
                    </div>
                    <p className="review-content">{review.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* FR-VERIFY-04/05: 어드민 검증 관리 탭 */}
        {activeTab === 'verify' && isAdmin && (
          <div className="tab-content">
            <div className="verify-toolbar">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map(f => (
                <button
                  key={f}
                  className={`filter-btn filter-btn--${f.toLowerCase()}${statusFilter === f ? ' active' : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f === 'ALL' ? '전체' : STATUS_LABEL[f as VerifyStatus]}
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <p className="empty-msg">해당 상태의 검증 요청이 없습니다.</p>
            ) : (
              <ul className="verify-list">
                {filteredRequests.map(req => (
                  <li key={req.id} className="verify-item">
                    <div className="verify-info">
                      <div className="verify-name">{req.freelancerName}</div>
                      <div className="verify-email">{req.freelancerEmail}</div>
                      <div className="verify-skills">
                        {req.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                      </div>
                    </div>
                    <div className="verify-right">
                      <span className="verify-date">{req.requestedAt}</span>
                      {req.status === 'PENDING' ? (
                        <div className="verify-actions">
                          <button className="verify-btn verify-btn--approve" onClick={() => handleVerify(req.id, 'APPROVED')}>승인</button>
                          <button className="verify-btn verify-btn--reject"  onClick={() => handleVerify(req.id, 'REJECTED')}>반려</button>
                        </div>
                      ) : (
                        <span className={`verify-status verify-status--${req.status.toLowerCase()}`}>
                          {STATUS_LABEL[req.status]}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* FR-MATCH-04/05: 프리랜서 받은 제안 탭 */}
        {activeTab === 'proposals' && isFreelancer && (
          <div className="tab-content">
            {proposals.length === 0 ? (
              <p className="empty-msg">받은 제안이 없습니다.</p>
            ) : (
              <ul className="proposal-list">
                {proposals.map(p => (
                  <li key={p.id} className="proposal-item">
                    <div className="proposal-info">
                      <div className="proposal-meta">
                        <span className="proposal-type">{p.projectType}</span>
                        <span className="proposal-date">{p.date} {p.time}</span>
                      </div>
                      <p className="proposal-title">{p.projectTitle}</p>
                      <p className="proposal-location">📍 {p.location}</p>
                      <p className="proposal-desc">{p.description}</p>
                      <p className="proposal-from">보낸 사람: {p.userName}</p>
                    </div>
                    <div className="proposal-actions">
                      {p.status === 'PENDING' ? (
                        <>
                          <button className="proposal-btn proposal-btn--accept" onClick={() => handleProposalAction(p.id, 'ACCEPTED')}>수락</button>
                          <button className="proposal-btn proposal-btn--reject" onClick={() => handleProposalAction(p.id, 'REJECTED')}>거절</button>
                        </>
                      ) : (
                        <span className={`proposal-status proposal-status--${p.status.toLowerCase()}`}>
                          {p.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* FR-VERIFY-01/02/03: 프리랜서 인증 신청 탭 */}
        {activeTab === 'certify' && isFreelancer && (
          <div className="tab-content certify-content">

            {/* FR-VERIFY-01: 기본 인증 */}
            <div className="certify-card">
              <div className="certify-card-header">
                <div>
                  <h3 className="certify-card-title">기본 인증</h3>
                  <p className="certify-card-desc">계정 및 신원 확인 수준의 기본 인증입니다.</p>
                </div>
                <span className={`certify-status certify-status--${basicVerifyStatus.toLowerCase()}`}>
                  {{ NONE: '미신청', PENDING: '검토 중', APPROVED: '인증 완료', REJECTED: '반려됨' }[basicVerifyStatus]}
                </span>
              </div>
              {basicVerifyStatus === 'NONE' && (
                <button className="certify-submit-btn" onClick={handleBasicVerify}>기본 인증 신청</button>
              )}
              {basicVerifyStatus === 'REJECTED' && (
                <button className="certify-submit-btn" onClick={handleBasicVerify}>재신청</button>
              )}
            </div>

            {/* FR-VERIFY-02/03: 추가 검증 신청 + 증빙 업로드 */}
            <div className="certify-card">
              <div className="certify-card-header">
                <div>
                  <h3 className="certify-card-title">추가 검증 신청</h3>
                  <p className="certify-card-desc">자격, 경력, 요양보호사 여부 등을 검증받을 수 있습니다.</p>
                </div>
                {certifySubmitted && (
                  <span className="certify-status certify-status--pending">검토 중</span>
                )}
              </div>

              {certifySubmitted ? (
                <p className="certify-submitted-msg">검증 신청이 완료되었습니다. 관리자 검토 후 결과가 반영됩니다.</p>
              ) : (
                <>
                  <div className="certify-types">
                    <p className="certify-label">검증 유형 선택</p>
                    <div className="certify-type-list">
                      {CERTIFY_TYPES.map(type => (
                        <button
                          key={type}
                          className={`certify-type-btn${certifyTypes.includes(type) ? ' selected' : ''}`}
                          onClick={() => handleCertifyTypeToggle(type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FR-VERIFY-03: 증빙 파일 업로드 */}
                  <div className="certify-files">
                    <p className="certify-label">증빙 자료 업로드</p>
                    {certifyFiles.length > 0 && (
                      <ul className="certify-file-list">
                        {certifyFiles.map((f, i) => (
                          <li key={i} className="certify-file-item">
                            <span>📄</span>
                            <span>{f}</span>
                            <button
                              className="certify-file-remove"
                              onClick={() => setCertifyFiles(prev => prev.filter((_, idx) => idx !== i))}
                            >✕</button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <label className="certify-upload-label">
                      + 파일 추가
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="portfolio-file-input"
                        onChange={handleCertifyFileChange}
                      />
                    </label>
                  </div>

                  <button
                    className="certify-submit-btn"
                    disabled={certifyTypes.length === 0}
                    onClick={handleCertifySubmit}
                  >
                    검증 신청
                  </button>
                </>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
