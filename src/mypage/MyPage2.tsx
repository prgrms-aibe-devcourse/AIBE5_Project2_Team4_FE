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
import { assignProjectFreelancer, getProjects, type Project } from '../store/appProjectStore';
import { getProposals, updateProposalStatus, type Proposal } from '../store/appProposalStore';
import {
  clearReviewReport,
  deleteReview,
  getFreelancerReviewSummary,
  getReportedReviews,
  getReviewsByAuthor,
  getReviewTags,
  toggleReviewBlind,
  updateReview,
  type ReviewRecord,
} from '../store/appReviewStore';
import { createNotification } from '../store/notificationStore';

type VerifyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type UserTab = 'account' | 'reviews' | 'proposals' | 'certify';
type AdminTab = 'dashboard' | 'freelancers' | 'projects' | 'verify' | 'reports';
type Tab = UserTab | AdminTab;

interface VerifyRequest {
  id: number;
  freelancerId: number;
  freelancerName: string;
  freelancerEmail: string;
  skills: string[];
  requestedAt: string;
  status: VerifyStatus;
}

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

const STATUS_LABEL: Record<VerifyStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

const REVIEW_TAGS = getReviewTags();

export default function MyPage2() {
  const [user, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [verifyRequests, setVerifyRequests] = useState<VerifyRequest[]>(INITIAL_VERIFY_REQUESTS);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [reportedReviews, setReportedReviews] = useState<ReviewRecord[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const nextUser = getUser();
    if (!nextUser) {
      window.location.href = '/login';
      return;
    }

    setCurrentUser(nextUser);
    setBio(nextUser.bio ?? '');
    setActiveTab(nextUser.role === 'ROLE_ADMIN' ? 'dashboard' : 'account');
  }, []);

  function refreshPageData(nextUser = user) {
    if (!nextUser) {
      return;
    }

    setProjects(getProjects());
    setReportedReviews(getReportedReviews());
    setReviews(getReviewsByAuthor(nextUser.email));

    if (nextUser.role === 'ROLE_FREELANCER') {
      const allProposals = getProposals();
      setProposals(allProposals.filter((proposal) => (
        (proposal.freelancerEmail && proposal.freelancerEmail === nextUser.email)
        || proposal.freelancerName === nextUser.name
      )));
    } else {
      setProposals([]);
    }
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

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'ROLE_ADMIN';
  const isFreelancer = user.role === 'ROLE_FREELANCER';
  const adminMetrics = {
    freelancerCount: freelancerSummaries.length,
    activeProjects: projects.filter((project) => project.status !== 'COMPLETED').length,
    pendingVerify: verifyRequests.filter((request) => request.status === 'PENDING').length,
    reportedReviewCount: reportedReviews.length,
  };

  function handleBioSave() {
    if (!user) {
      return;
    }

    const updatedUser = { ...user, bio };
    setUser(updatedUser);
    setCurrentUser(updatedUser);
    setEditingBio(false);
  }

  function handleProposalAction(proposal: Proposal, action: 'ACCEPTED' | 'REJECTED') {
    if (!isFreelancer || proposal.status !== 'PENDING') {
      window.location.href = '/error?code=403';
      return;
    }

    const updatedProposal = updateProposalStatus(proposal.id, action);
    if (action === 'ACCEPTED') {
      assignProjectFreelancer(proposal.projectId, {
        freelancerId: proposal.freelancerId,
        freelancerName: proposal.freelancerName,
        freelancerEmail: proposal.freelancerEmail,
      });

      if (updatedProposal?.userEmail) {
        createNotification({
          userEmail: updatedProposal.userEmail,
          type: 'PROPOSAL_ACCEPTED',
          title: '제안이 수락되었습니다',
          message: `${proposal.freelancerName} 프리랜서가 "${proposal.projectTitle}" 제안을 수락했습니다.`,
          link: '/project',
        });
      }
    }

    refreshPageData(user);
  }

  function handleVerify(requestId: number, action: 'APPROVED' | 'REJECTED') {
    if (!canManageVerification(user)) {
      window.location.href = '/error?code=403';
      return;
    }

    const nextRequests = verifyRequests.map((request) => (
      request.id === requestId ? { ...request, status: action } : request
    ));
    setVerifyRequests(nextRequests);

    const targetRequest = nextRequests.find((request) => request.id === requestId);
    if (targetRequest) {
      createNotification({
        userEmail: targetRequest.freelancerEmail,
        type: 'FREELANCER_STATUS',
        title: action === 'APPROVED' ? '검증 요청이 승인되었습니다' : '검증 요청이 반려되었습니다',
        message: `${targetRequest.freelancerName}님의 검증 요청 처리 결과가 반영되었습니다.`,
        link: '/mypage',
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
    setEditTags((currentTags) => (
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    ));
  }

  function handleReviewUpdate(reviewId: number) {
    const targetReview = reviews.find((review) => review.id === reviewId);
    if (!targetReview || !canModifyOwnReview(user, targetReview)) {
      window.location.href = '/error?code=403';
      return;
    }

    updateReview(reviewId, {
      rating: editRating,
      tags: editTags,
      content: editContent,
    });
    setEditingReviewId(null);
    refreshPageData(user);
  }

  function handleReviewDelete(reviewId: number) {
    const targetReview = reviews.find((review) => review.id === reviewId);
    if (!targetReview || !canModifyOwnReview(user, targetReview)) {
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
                <button className={`tab-btn${activeTab === 'proposals' ? ' active' : ''}`} onClick={() => setActiveTab('proposals')}>받은 제안</button>
              )}
              {isFreelancer && (
                <button className={`tab-btn${activeTab === 'certify' ? ' active' : ''}`} onClick={() => setActiveTab('certify')}>인증 요청</button>
              )}
            </>
          )}
          {isAdmin && (
            <>
              <button className={`tab-btn${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => setActiveTab('dashboard')}>대시보드</button>
              <button className={`tab-btn${activeTab === 'freelancers' ? ' active' : ''}`} onClick={() => setActiveTab('freelancers')}>프리랜서 관리</button>
              <button className={`tab-btn${activeTab === 'projects' ? ' active' : ''}`} onClick={() => setActiveTab('projects')}>프로젝트 관리</button>
              <button className={`tab-btn${activeTab === 'verify' ? ' active' : ''}`} onClick={() => setActiveTab('verify')}>검증 처리</button>
              <button className={`tab-btn${activeTab === 'reports' ? ' active' : ''}`} onClick={() => setActiveTab('reports')}>리뷰/신고 처리</button>
            </>
          )}
        </div>

        {activeTab === 'account' && !isAdmin && (
          <div className="cards-grid">
            <div className="card">
              <h2>계정 정보</h2>
              <ul>
                <li><span>이름</span><span>{user.name}</span></li>
                <li><span>이메일</span><span>{user.email}</span></li>
                <li><span>역할</span><span>{user.role}</span></li>
                <li><span>가입일</span><span>2025.01.01</span></li>
              </ul>
            </div>

            <div className="card">
              <h2>자기소개</h2>
              {editingBio ? (
                <textarea
                  className="bio-textarea"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
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
          </div>
        )}

        {activeTab === 'reviews' && !isAdmin && (
          <div className="tab-content">
            {reviews.length === 0 ? (
              <p className="empty-msg">작성한 리뷰가 없습니다.</p>
            ) : (
              <ul className="review-list">
                {reviews.map((review) => (
                  <li key={review.id} className="review-item">
                    <div className="review-header">
                      <div>
                        <span className="review-service">{review.freelancerName}</span>
                        <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                      </div>
                      <span className="review-date">{review.date}</span>
                    </div>
                    <div className="review-tag-row">
                      {review.tags.map((tag) => <span key={tag} className="skill-tag">{tag}</span>)}
                    </div>
                    {editingReviewId === review.id ? (
                      <div className="review-editor">
                        <div className="review-rating-row">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              type="button"
                              className={`review-rating-btn${editRating === score ? ' selected' : ''}`}
                              onClick={() => setEditRating(score)}
                            >
                              {score}점
                            </button>
                          ))}
                        </div>
                        <div className="type-selector">
                          {REVIEW_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              className={`type-btn${editTags.includes(tag) ? ' selected' : ''}`}
                              onClick={() => handleEditTagToggle(tag)}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="bio-textarea"
                          value={editContent}
                          onChange={(event) => setEditContent(event.target.value)}
                          rows={4}
                        />
                        <div className="bio-actions">
                          <button className="btn-edit" onClick={() => handleReviewUpdate(review.id)}>저장</button>
                          <button className="btn-cancel" onClick={() => setEditingReviewId(null)}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <p className="review-content">{review.content}</p>
                    )}
                    <div className="review-actions-row">
                      <button className="btn-edit" onClick={() => startEditReview(review)}>수정</button>
                      <button className="btn-cancel" onClick={() => handleReviewDelete(review.id)}>삭제</button>
                      <span className="review-state-text">
                        {review.blinded ? '블라인드됨' : review.reported ? '신고 접수됨' : '정상 노출'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'proposals' && isFreelancer && (
          <div className="tab-content">
            {proposals.length === 0 ? (
              <p className="empty-msg">받은 제안이 없습니다.</p>
            ) : (
              <ul className="proposal-list">
                {proposals.map((proposal) => (
                  <li key={proposal.id} className="proposal-item">
                    <div className="proposal-info">
                      <div className="proposal-meta">
                        <span className="proposal-type">{proposal.projectType}</span>
                        <span className="proposal-date">{proposal.date} {proposal.time}</span>
                      </div>
                      <p className="proposal-title">{proposal.projectTitle}</p>
                      <p className="proposal-location">📍 {proposal.location}</p>
                      <p className="proposal-desc">{proposal.description}</p>
                      <p className="proposal-from">보낸 사람: {proposal.userName}</p>
                    </div>
                    <div className="proposal-actions">
                      {proposal.status === 'PENDING' ? (
                        <>
                          <button className="proposal-btn proposal-btn--accept" onClick={() => handleProposalAction(proposal, 'ACCEPTED')}>수락</button>
                          <button className="proposal-btn proposal-btn--reject" onClick={() => handleProposalAction(proposal, 'REJECTED')}>거절</button>
                        </>
                      ) : (
                        <span className={`proposal-status proposal-status--${proposal.status.toLowerCase()}`}>
                          {proposal.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'certify' && isFreelancer && (
          <div className="tab-content">
            <ul className="verify-list">
              {verifyRequests
                .filter((request) => request.freelancerEmail === user.email)
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
              <span className="metric-label">프리랜서</span>
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
          <div className="tab-content">
            <ul className="verify-list">
              {verifyRequests.map((request) => (
                <li key={request.id} className="verify-item">
                  <div className="verify-info">
                    <div className="verify-name">{request.freelancerName}</div>
                    <div className="verify-email">{request.freelancerEmail}</div>
                    <div className="verify-skills">
                      {request.skills.map((skill) => <span key={skill} className="skill-tag">{skill}</span>)}
                    </div>
                  </div>
                  <div className="verify-right">
                    <span className="verify-date">{request.requestedAt}</span>
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
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'reports' && isAdmin && (
          <div className="tab-content">
            {reportedReviews.length === 0 ? (
              <p className="empty-msg">신고된 리뷰가 없습니다.</p>
            ) : (
              <ul className="review-list">
                {reportedReviews.map((review) => (
                  <li key={review.id} className="review-item">
                    <div className="review-header">
                      <div>
                        <span className="review-service">{review.freelancerName}</span>
                        <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                      </div>
                      <span className="review-date">{review.date}</span>
                    </div>
                    <p className="review-content">{review.content}</p>
                    <p className="admin-subtext">신고 사유: {review.reportReason}</p>
                    <div className="review-actions-row">
                      <button className="btn-edit" onClick={() => handleBlindToggle(review.id)}>
                        {review.blinded ? '블라인드 해제' : '블라인드'}
                      </button>
                      <button className="btn-cancel" onClick={() => handleReportClear(review.id)}>신고 해제</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
