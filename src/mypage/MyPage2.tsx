import { useEffect, useMemo, useState } from 'react';
import './mypage.css';
import AppHeader from '../components/AppHeader';
import { getUser, setUser, type User } from '../store/appAuth';
import {
  canManageVerification,
  canModerateReviews,
  canModifyOwnReview,
} from '../store/accessControl';
import { FREELANCERS } from '../store/appFreelancerStore';
import { getProjects, type Project } from '../store/appProjectStore';
import {
  clearReviewReport,
  deleteReview,
  getFreelancerReviewSummary,
  getReportedReviews,
  getReviewsByAuthor,
  getReviewsForFreelancer,
  getReviewTags,
  toggleReviewBlind,
  updateReview,
  type ReviewRecord,
} from '../store/appReviewStore';
import { createNotification } from '../store/notificationStore';
import VerifyTab, { type VerifyRequest, STATUS_LABEL } from './tabs/VerifyTab';
import ReviewsTab from './tabs/ReviewsTab';
import ReportsTab from './tabs/ReportsTab';

type VerifyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type UserTab = 'account' | 'reviews' | 'certify';
type AdminTab = 'dashboard' | 'freelancers' | 'projects' | 'verify' | 'reports';
type Tab = UserTab | AdminTab;

const INITIAL_VERIFY_REQUESTS: VerifyRequest[] = [
  {
    id: 1,
    freelancerId: 1,
    freelancerName: '김지수',
    freelancerEmail: 'free@stella.ai',
    skills: ['병원 동행', '행정 업무'],
    requestedAt: '2025.04.14',
    status: 'PENDING',
  },
  {
    id: 2,
    freelancerId: 3,
    freelancerName: '김철수',
    freelancerEmail: 'chulsoo@example.com',
    skills: ['병원 동행', '외출 보조'],
    requestedAt: '2025.04.12',
    status: 'PENDING',
  },
  {
    id: 3,
    freelancerId: 4,
    freelancerName: '최지수',
    freelancerEmail: 'jisu@example.com',
    skills: ['생활 지원', '외출 보조'],
    requestedAt: '2025.04.10',
    status: 'APPROVED',
  },
];

const REVIEW_TAGS = getReviewTags();

export default function MyPage2() {
  const [user, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [bio, setBio] = useState('');
  const [editingAccount, setEditingAccount] = useState(false);
  const [editName, setEditName] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | undefined>(undefined);
  const [verifyRequests, setVerifyRequests] = useState<VerifyRequest[]>(INITIAL_VERIFY_REQUESTS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [reportedReviews, setReportedReviews] = useState<ReviewRecord[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editContent, setEditContent] = useState('');
  const [verifyDetailId, setVerifyDetailId] = useState<number | null>(null);
  const [verifyFilter, setVerifyFilter] = useState<'ALL' | VerifyStatus>('ALL');

  function resolveRequestedTab(nextUser: User | null): Tab {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    if (!nextUser || !requestedTab) {
      return nextUser?.role === 'ROLE_ADMIN' ? 'dashboard' : 'account';
    }

    const userTabs: UserTab[] = nextUser.role === 'ROLE_FREELANCER'
      ? ['account', 'reviews', 'certify']
      : ['account', 'reviews'];
    const adminTabs: AdminTab[] = ['dashboard', 'freelancers', 'projects', 'verify', 'reports'];
    const allowedTabs = nextUser.role === 'ROLE_ADMIN' ? adminTabs : userTabs;

    return (allowedTabs as Tab[]).includes(requestedTab as Tab)
      ? (requestedTab as Tab)
      : nextUser.role === 'ROLE_ADMIN'
        ? 'dashboard'
        : 'account';
  }

  useEffect(() => {
    const nextUser = getUser();
    if (!nextUser) {
      window.location.href = '/login';
      return;
    }

    setCurrentUser(nextUser);
    setBio(nextUser.bio ?? '');
    setEditName(nextUser.name);
    setActiveTab(resolveRequestedTab(nextUser));
  }, []);

  useEffect(() => {
    const syncRequestedTab = () => {
      const nextUser = getUser();
      if (!nextUser) return;
      setActiveTab(resolveRequestedTab(nextUser));
    };

    window.addEventListener('popstate', syncRequestedTab);
    return () => window.removeEventListener('popstate', syncRequestedTab);
  }, []);

  function refreshPageData(nextUser = user) {
    if (!nextUser) return;

    const matchedFreelancer = FREELANCERS.find((f) => f.accountEmail === nextUser.email);
    setProjects(getProjects());
    setReportedReviews(getReportedReviews());
    setReviews(
      nextUser.role === 'ROLE_FREELANCER' && matchedFreelancer
        ? getReviewsForFreelancer(matchedFreelancer.id)
        : getReviewsByAuthor(nextUser.email),
    );
  }

  useEffect(() => {
    refreshPageData();
  }, [user]);

  const freelancerSummaries = useMemo(() => (
    FREELANCERS.map((freelancer) => {
      const summary = getFreelancerReviewSummary(freelancer.id);
      return {
        ...freelancer,
        reviewCount: summary.reviewCount,
        rating: summary.reviewCount > 0 ? summary.averageRating : freelancer.rating,
      };
    })
  ), [reportedReviews, reviews]);

  if (!user) return null;

  const isAdmin = user.role === 'ROLE_ADMIN';
  const isFreelancer = user.role === 'ROLE_FREELANCER';
  const adminMetrics = {
    freelancerCount: freelancerSummaries.length,
    activeProjects: projects.filter((p) => p.status !== 'COMPLETED').length,
    pendingVerify: verifyRequests.filter((r) => r.status === 'PENDING').length,
    reportedReviewCount: reportedReviews.length,
  };

  const filteredVerifyRequests = verifyFilter === 'ALL'
    ? verifyRequests
    : verifyRequests.filter((r) => r.status === verifyFilter);

  function handleAccountSave() {
    if (!user || !editName.trim()) return;
    const updatedUser = { ...user, name: editName.trim(), bio };
    setUser(updatedUser);
    setCurrentUser(updatedUser);
    setEditingAccount(false);
  }

  function handleAccountCancel() {
    setEditName(user?.name ?? '');
    setBio(user?.bio ?? '');
    setEditingAccount(false);
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleAvatarSave() {
    if (!user) return;
    const updatedUser = { ...user, avatar: pendingAvatar };
    setUser(updatedUser);
    setCurrentUser(updatedUser);
    setShowAvatarModal(false);
  }

  function openAvatarModal() {
    setPendingAvatar(user?.avatar);
    setShowAvatarModal(true);
  }

  function handleVerify(requestId: number, action: 'APPROVED' | 'REJECTED') {
    if (!canManageVerification(user)) {
      window.location.href = '/error?code=403';
      return;
    }

    const nextRequests = verifyRequests.map((r) => r.id === requestId ? { ...r, status: action } : r);
    setVerifyRequests(nextRequests);

    const target = nextRequests.find((r) => r.id === requestId);
    if (target) {
      createNotification({
        userEmail: target.freelancerEmail,
        type: 'FREELANCER_STATUS',
        title: action === 'APPROVED' ? '검증 요청이 승인되었습니다' : '검증 요청이 반려되었습니다',
        message: `${target.freelancerName}님의 검증 요청 처리 결과가 반영되었습니다.`,
        link: '/mypage?tab=certify',
      });
    }
  }

  function startEditReview(review: ReviewRecord) {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditTags(review.tags);
    setEditContent(review.content);
  }

  function handleEditTagToggle(tag: string) {
    setEditTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function handleReviewUpdate(reviewId: number) {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target || !canModifyOwnReview(user, target)) {
      window.location.href = '/error?code=403';
      return;
    }
    updateReview(reviewId, { rating: editRating, tags: editTags, content: editContent });
    setEditingReviewId(null);
    refreshPageData(user);
  }

  function handleReviewDelete(reviewId: number) {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target || !canModifyOwnReview(user, target)) {
      window.location.href = '/error?code=403';
      return;
    }
    deleteReview(reviewId);
    setEditingReviewId(null);
    refreshPageData(user);
  }

  function handleBlindToggle(reviewId: number) {
    if (!canModerateReviews(user)) {
      window.location.href = '/error?code=403';
      return;
    }
    toggleReviewBlind(reviewId);
    refreshPageData(user);
  }

  function handleReportClear(reviewId: number) {
    if (!canModerateReviews(user)) {
      window.location.href = '/error?code=403';
      return;
    }
    clearReviewReport(reviewId);
    refreshPageData(user);
  }

  return (
    <div className="mypage">
      <AppHeader activePage="mypage" />

      <main className="mypage-content">
        <div className="profile-section">
          <button type="button" className="avatar-wrap" onClick={openAvatarModal} aria-label="프로필 사진 변경">
            {user.avatar
              ? <img src={user.avatar} alt="profile" className="avatar-img" />
              : <span className="avatar-initial">{user.name[0].toUpperCase()}</span>
            }
            <div className="avatar-overlay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>사진 변경</span>
            </div>
          </button>
          <div className="profile-info">
            <h1 className="username">{user.name}</h1>
            <p className="email">{user.email}</p>
            <div className="profile-badges">
              <span className={`role-badge role-badge--${user.role.toLowerCase().replace('role_', '')}`}>
                {user.role}
              </span>
              {isFreelancer && user.verified && (
                <span className="verified-badge">✦ 검증됨</span>
              )}
            </div>
          </div>
        </div>

        <div className="tab-bar">
          {!isAdmin && (
            <>
              <button className={`tab-btn${activeTab === 'account' ? ' active' : ''}`} onClick={() => setActiveTab('account')}>계정 정보</button>
              <button className={`tab-btn${activeTab === 'reviews' ? ' active' : ''}`} onClick={() => setActiveTab('reviews')}>리뷰 내역</button>
              {isFreelancer && (
                <button className={`tab-btn${activeTab === 'certify' ? ' active' : ''}`} onClick={() => setActiveTab('certify')}>인증 요청</button>
              )}
            </>
          )}
          {isAdmin && (
            <>
              <button className={`tab-btn${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => setActiveTab('dashboard')}>대시보드</button>
              <button className={`tab-btn${activeTab === 'freelancers' ? ' active' : ''}`} onClick={() => setActiveTab('freelancers')}>헬퍼 관리</button>
              <button className={`tab-btn${activeTab === 'projects' ? ' active' : ''}`} onClick={() => setActiveTab('projects')}>프로젝트 관리</button>
              <button className={`tab-btn${activeTab === 'verify' ? ' active' : ''}`} onClick={() => setActiveTab('verify')}>검증 처리</button>
              <button className={`tab-btn${activeTab === 'reports' ? ' active' : ''}`} onClick={() => setActiveTab('reports')}>리뷰/신고 처리</button>
            </>
          )}
        </div>

        {activeTab === 'account' && !isAdmin && (
          <div className="account-card">
            <div className="account-card-head">
              <h2>계정 정보</h2>
              {!editingAccount && (
                <button className="btn-edit" onClick={() => { setEditName(user.name); setBio(user.bio ?? ''); setEditingAccount(true); }}>
                  수정하기
                </button>
              )}
            </div>

            {editingAccount ? (
              <div className="account-edit-form">
                <div className="account-field">
                  <label>이름</label>
                  <input
                    className="account-input"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div className="account-field account-field--readonly">
                  <label>이메일</label>
                  <span>{user.email}</span>
                </div>
                <div className="account-field account-field--readonly">
                  <label>역할</label>
                  <span>{user.role}</span>
                </div>
                <div className="account-field">
                  <label>자기소개</label>
                  <textarea
                    className="account-textarea"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="자기소개를 작성해 주세요."
                  />
                </div>
                <div className="account-edit-actions">
                  <button className="btn-edit" onClick={handleAccountSave}>저장</button>
                  <button className="btn-cancel" onClick={handleAccountCancel}>취소</button>
                </div>
              </div>
            ) : (
              <ul className="account-info-list">
                <li><span>이름</span><span>{user.name}</span></li>
                <li><span>이메일</span><span>{user.email}</span></li>
                <li><span>역할</span><span>{user.role}</span></li>
                <li><span>가입일</span><span>2025.01.01</span></li>
                <li className="account-bio-row">
                  <span>자기소개</span>
                  <span>{user.bio || '—'}</span>
                </li>
              </ul>
            )}
          </div>
        )}

        {activeTab === 'reviews' && !isAdmin && (
          <ReviewsTab
            reviews={reviews}
            isFreelancer={isFreelancer}
            editingReviewId={editingReviewId}
            editRating={editRating}
            editTags={editTags}
            editContent={editContent}
            reviewTags={REVIEW_TAGS}
            setEditingReviewId={setEditingReviewId}
            setEditRating={setEditRating}
            setEditContent={setEditContent}
            handleEditTagToggle={handleEditTagToggle}
            handleReviewUpdate={handleReviewUpdate}
            handleReviewDelete={handleReviewDelete}
            startEditReview={startEditReview}
          />
        )}

        {activeTab === 'certify' && isFreelancer && (
          <div className="tab-content">
            <ul className="verify-list">
              {verifyRequests
                .filter((r) => r.freelancerEmail === user.email)
                .map((request) => (
                  <li key={request.id} className="verify-item">
                    <div className="verify-info">
                      <div className="verify-name">{request.freelancerName}</div>
                      <div className="verify-skills">
                        {request.skills.map((skill) => <span key={skill} className="skill-tag">{skill}</span>)}
                      </div>
                    </div>
                    <div className="verify-right">
                      <span className="verify-date">{request.requestedAt}</span>
                      <span className={`verify-status verify-status--${request.status.toLowerCase()}`}>
                        {STATUS_LABEL[request.status]}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {activeTab === 'dashboard' && isAdmin && (
          <div className="admin-grid">
            <div className="metric-card">
              <span className="metric-label">헬퍼</span>
              <strong className="metric-value">{adminMetrics.freelancerCount}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">진행 프로젝트</span>
              <strong className="metric-value">{adminMetrics.activeProjects}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">대기 검증</span>
              <strong className="metric-value">{adminMetrics.pendingVerify}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">신고 리뷰</span>
              <strong className="metric-value">{adminMetrics.reportedReviewCount}</strong>
            </div>
          </div>
        )}

        {activeTab === 'freelancers' && isAdmin && (
          <div className="tab-content">
            <ul className="admin-list">
              {freelancerSummaries.map((freelancer) => (
                <li key={freelancer.id} className="admin-item">
                  <div>
                    <strong>{freelancer.name}</strong>
                    <p className="admin-subtext">{freelancer.skills.join(' · ')}</p>
                  </div>
                  <div className="admin-item-right">
                    <span className="skill-tag">{freelancer.verified ? '검증 완료' : '미검증'}</span>
                    <span className="admin-subtext">평점 {freelancer.rating.toFixed(1)} / 리뷰 {freelancer.reviewCount}개</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'projects' && isAdmin && (
          <div className="tab-content">
            <ul className="admin-list">
              {projects.map((project) => (
                <li key={project.id} className="admin-item">
                  <div>
                    <strong>{project.title}</strong>
                    <p className="admin-subtext">{project.requesterName} · {project.location}</p>
                  </div>
                  <div className="admin-item-right">
                    <span className="skill-tag">{project.status}</span>
                    <span className="admin-subtext">{project.freelancerName ?? '담당자 미배정'}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'verify' && isAdmin && (
          <VerifyTab
            verifyRequests={verifyRequests}
            verifyFilter={verifyFilter}
            setVerifyFilter={setVerifyFilter}
            filteredVerifyRequests={filteredVerifyRequests}
            verifyDetailId={verifyDetailId}
            setVerifyDetailId={setVerifyDetailId}
            handleVerify={handleVerify}
          />
        )}

        {activeTab === 'reports' && isAdmin && (
          <ReportsTab
            reportedReviews={reportedReviews}
            handleBlindToggle={handleBlindToggle}
            handleReportClear={handleReportClear}
          />
        )}
      </main>

      {showAvatarModal && (
        <div className="avatar-modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-modal-head">
              <h2>프로필 사진</h2>
              <button type="button" className="avatar-modal-close" onClick={() => setShowAvatarModal(false)}>✕</button>
            </div>

            <div className="avatar-modal-preview">
              {pendingAvatar
                ? <img src={pendingAvatar} alt="preview" className="avatar-modal-img" />
                : <span className="avatar-modal-initial">{user.name[0].toUpperCase()}</span>
              }
            </div>

            <div className="avatar-modal-actions">
              <label className="avatar-modal-upload">
                사진 업로드
                <input type="file" accept="image/*" hidden onChange={handleAvatarFileChange} />
              </label>
              {pendingAvatar && (
                <button type="button" className="avatar-modal-remove" onClick={() => setPendingAvatar(undefined)}>
                  사진 삭제
                </button>
              )}
            </div>

            <div className="avatar-modal-footer">
              <button type="button" className="avatar-modal-cancel" onClick={() => setShowAvatarModal(false)}>취소</button>
              <button type="button" className="avatar-modal-save" onClick={handleAvatarSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
