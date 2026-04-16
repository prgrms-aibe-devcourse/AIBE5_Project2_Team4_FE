import { useEffect, useMemo, useState, type FormEvent } from 'react';
import './mypage.css';
import AppHeader from '../components/AppHeader';
import { getUser, setUser, type User } from '../store/appAuth';
import {
  canCancelProject,
  canCreateProject,
  canManageVerification,
  canModerateReviews,
  canModifyOwnReview,
  canWriteReview,
} from '../store/accessControl';
import { FREELANCERS } from '../store/appFreelancerStore';
import { assignProjectFreelancer, cancelProject, createProject, getProjects, updateProjectStatus, type Project, type ProjectStatus, type ProjectType } from '../store/appProjectStore';
import { getProposals, updateProposalStatus, withdrawProposal, type Proposal } from '../store/appProposalStore';
import {
  clearReviewReport,
  createReview,
  deleteReview,
  getFreelancerReviewSummary,
  getReviewByProject,
  getReviewsForFreelancer,
  getReportedReviews,
  getReviewsByAuthor,
  getReviewTags,
  toggleReviewBlind,
  updateReview,
  type ReviewRecord,
} from '../store/appReviewStore';
import { createNotification } from '../store/notificationStore';

const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  HOSPITAL: '병원 동행', GOVERNMENT: '관공서 업무',
  OUTING: '외출 보조', DAILY: '생활동행', OTHER: '기타',
};
const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  REQUESTED: '신청됨', ACCEPTED: '수락됨',
  IN_PROGRESS: '진행중', COMPLETED: '완료', CANCELLED: '취소됨',
};
const PROJECT_STATUSES: ProjectStatus[] = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

const EMPTY_REVIEW_FORM = { rating: 5, tags: [] as string[], content: '' };
const PROJECT_TYPES: ProjectType[] = ['HOSPITAL', 'GOVERNMENT', 'OUTING', 'DAILY', 'OTHER'];
const EMPTY_PROJECT_FORM = { title: '', type: 'HOSPITAL' as ProjectType, date: '', time: '', location: '', description: '' };

type VerifyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type UserTab = 'account' | 'reviews' | 'proposals' | 'projects' | 'certify';
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [selectedReview, setSelectedReview] = useState<ReviewRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM);

  function resolveRequestedTab(nextUser: User | null): Tab {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    if (!nextUser || !requestedTab) {
      return nextUser?.role === 'ROLE_ADMIN' ? 'dashboard' : 'account';
    }

    const userTabs: UserTab[] = ['account', 'reviews', 'proposals', 'certify'];
    const adminTabs: AdminTab[] = ['dashboard', 'freelancers', 'projects', 'verify', 'reports'];
    const allowedTabs = nextUser.role === 'ROLE_ADMIN'
      ? adminTabs
      : nextUser.role === 'ROLE_FREELANCER'
        ? userTabs
        : ['account', 'reviews', 'proposals', 'projects'];

    return allowedTabs.includes(requestedTab as Tab)
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
    setActiveTab(resolveRequestedTab(nextUser));
  }, []);

  useEffect(() => {
    const syncRequestedTab = () => {
      const nextUser = getUser();
      if (!nextUser) {
        return;
      }

      setActiveTab(resolveRequestedTab(nextUser));
    };

    window.addEventListener('popstate', syncRequestedTab);
    return () => window.removeEventListener('popstate', syncRequestedTab);
  }, []);

  function refreshPageData(nextUser = user) {
    if (!nextUser) {
      return;
    }

    const matchedFreelancer = FREELANCERS.find((freelancer) => freelancer.accountEmail === nextUser.email);
    setProjects(getProjects());
    setReportedReviews(getReportedReviews());
    setReviews(
      nextUser.role === 'ROLE_FREELANCER' && matchedFreelancer
        ? getReviewsForFreelancer(matchedFreelancer.id)
        : getReviewsByAuthor(nextUser.email),
    );

    const allProposals = getProposals();
    if (nextUser.role === 'ROLE_FREELANCER') {
      setProposals(allProposals.filter((proposal) => (
        (proposal.freelancerEmail && proposal.freelancerEmail === nextUser.email)
        || proposal.freelancerName === nextUser.name
      )));
    } else if (nextUser.role === 'ROLE_USER') {
      setProposals(allProposals.filter((proposal) => proposal.userEmail === nextUser.email));
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

  function handleProjectCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !canCreateProject(user) || !projectForm.title || !projectForm.date || !projectForm.time || !projectForm.location) return;
    const newProject = createProject({ ...projectForm, requesterName: user.name, requesterEmail: user.email });
    createNotification({
      userEmail: user.email,
      type: 'PROJECT_STATUS',
      title: '프로젝트가 등록되었습니다',
      message: `"${newProject.title}" 프로젝트 요청이 등록되었습니다.`,
      link: '/project',
    });
    setShowCreateModal(false);
    setProjectForm(EMPTY_PROJECT_FORM);
    refreshPageData(user);
  }

  function handleProjectCancel(projectId: number) {
    const target = projects.find(p => p.id === projectId);
    if (!target || !canCancelProject(user, target)) return;
    cancelProject(projectId);
    setSelectedProject(null);
    refreshPageData(user);
  }

  function openProjectReviewModal(project: Project) {
    if (!user || !canWriteReview(user, project)) return;
    const existing = getReviewByProject(project.id, user.email);
    setSelectedReview(existing);
    setReviewForm(existing
      ? { rating: existing.rating, tags: existing.tags, content: existing.content }
      : EMPTY_REVIEW_FORM);
    setShowReviewModal(true);
  }

  function handleProjectReviewTagToggle(tag: string) {
    setReviewForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  }

  function handleProjectReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !selectedProject.freelancerId || !selectedProject.freelancerName || !user) return;
    if (selectedReview) {
      updateReview(selectedReview.id, { rating: reviewForm.rating, tags: reviewForm.tags, content: reviewForm.content });
    } else {
      createReview({
        projectId: selectedProject.id,
        freelancerId: selectedProject.freelancerId,
        freelancerName: selectedProject.freelancerName,
        authorName: user.name,
        authorEmail: user.email,
        rating: reviewForm.rating,
        tags: reviewForm.tags,
        content: reviewForm.content,
      });
      if (selectedProject.freelancerEmail) {
        createNotification({
          userEmail: selectedProject.freelancerEmail,
          type: 'FREELANCER_STATUS',
          title: '새 리뷰가 등록되었습니다',
          message: `"${selectedProject.title}" 프로젝트에 대한 리뷰가 등록되었습니다.`,
          link: '/mypage?tab=reviews',
        });
      }
    }
    setShowReviewModal(false);
    setSelectedReview(null);
    setReviewForm(EMPTY_REVIEW_FORM);
    refreshPageData(user);
  }

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
          message: `${proposal.freelancerName} 도우미가 "${proposal.projectTitle}" 제안을 수락했습니다.`,
          link: '/project',
        });
      }
    }

    refreshPageData(user);
  }

  function handleProposalWithdraw(proposalId: number) {
    withdrawProposal(proposalId);
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
              {!isFreelancer && (
                <>
                  <button className={`tab-btn${activeTab === 'proposals' ? ' active' : ''}`} onClick={() => setActiveTab('proposals')}>보낸 제안</button>
                  <button className={`tab-btn${activeTab === 'projects' ? ' active' : ''}`} onClick={() => setActiveTab('projects')}>프로젝트 관리</button>
                </>
              )}
              {isFreelancer && (
                <button className={`tab-btn${activeTab === 'certify' ? ' active' : ''}`} onClick={() => setActiveTab('certify')}>인증 요청</button>
              )}
            </>
          )}
          {isAdmin && (
            <>
              <button className={`tab-btn${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => setActiveTab('dashboard')}>대시보드</button>
              <button className={`tab-btn${activeTab === 'freelancers' ? ' active' : ''}`} onClick={() => setActiveTab('freelancers')}>도우미 관리</button>
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
                    {!isFreelancer && editingReviewId === review.id ? (
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

        {activeTab === 'proposals' && !isAdmin && (
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
                      {isFreelancer ? (
                        proposal.status === 'PENDING' ? (
                          <>
                            <button className="proposal-btn proposal-btn--accept" onClick={() => handleProposalAction(proposal, 'ACCEPTED')}>수락</button>
                            <button className="proposal-btn proposal-btn--reject" onClick={() => handleProposalAction(proposal, 'REJECTED')}>거절</button>
                          </>
                        ) : (
                          <span className={`proposal-status proposal-status--${proposal.status.toLowerCase()}`}>
                            {proposal.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                          </span>
                        )
                      ) : (
                        proposal.status === 'PENDING' ? (
                          <button className="proposal-btn proposal-btn--reject" onClick={() => handleProposalWithdraw(proposal.id)}>제안 철회</button>
                        ) : (
                          <span className={`proposal-status proposal-status--${proposal.status.toLowerCase()}`}>
                            {proposal.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                          </span>
                        )
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'projects' && !isAdmin && !isFreelancer && (
          <div className="tab-content">
            <div className="project-tab-header">
              {canCreateProject(user) && (
                <button type="button" className="mp-btn-action mp-btn-review" onClick={() => setShowCreateModal(true)}>
                  + 새 프로젝트
                </button>
              )}
            </div>
            {projects.filter(p => p.requesterEmail === user.email).length === 0 ? (
              <p className="empty-msg">신청한 프로젝트가 없습니다.</p>
            ) : (
              <ul className="project-card-list">
                {projects.filter(p => p.requesterEmail === user.email).map((project) => (
                  <li key={project.id} className="project-card mypage-project-card" onClick={() => setSelectedProject(project)}>
                    <div className="project-card-top">
                      <span className="project-type-badge">{PROJECT_TYPE_LABEL[project.type as ProjectType] ?? project.type}</span>
                      <span className={`project-status-badge project-status-badge--${project.status.toLowerCase()}`}>
                        {PROJECT_STATUS_LABEL[project.status as ProjectStatus] ?? project.status}
                      </span>
                    </div>
                    <p className="project-card-title">{project.title}</p>
                    <div className="project-card-meta">
                      <span>📅 {project.date} {project.time}</span>
                      <span>📍 {project.location}</span>
                    </div>
                    <div className="project-card-footer">
                      <span className="project-card-freelancer">
                        {project.freelancerName ? `👤 ${project.freelancerName}` : '담당자 미배정'}
                      </span>
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
              <span className="metric-label">도우미</span>
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

      {selectedProject && !showReviewModal && (
        <div className="mp-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <button type="button" className="mp-modal-close" onClick={() => setSelectedProject(null)}>닫기</button>

            <div className="mp-modal-head">
              <div className="mp-modal-badges">
                <span className="project-type-badge">{PROJECT_TYPE_LABEL[selectedProject.type as ProjectType] ?? selectedProject.type}</span>
                <span className={`project-status-badge project-status-badge--${selectedProject.status.toLowerCase()}`}>
                  {PROJECT_STATUS_LABEL[selectedProject.status as ProjectStatus] ?? selectedProject.status}
                </span>
              </div>
              <h2 className="mp-modal-title">{selectedProject.title}</h2>
            </div>

            <ul className="mp-modal-info">
              <li><span>날짜</span><span>{selectedProject.date}</span></li>
              <li><span>시간</span><span>{selectedProject.time}</span></li>
              <li><span>위치</span><span>{selectedProject.location}</span></li>
              <li><span>등록일</span><span>{selectedProject.createdAt}</span></li>
              {selectedProject.freelancerName && (
                <li><span>담당 도우미</span><span>{selectedProject.freelancerName}</span></li>
              )}
            </ul>

            {selectedProject.description && (
              <div>
                <p className="mp-modal-desc-label">요청 사항</p>
                <p className="mp-modal-desc-text">{selectedProject.description}</p>
              </div>
            )}

            <div className="mp-progress-track">
              {PROJECT_STATUSES.map((status, index) => {
                const currentIndex = PROJECT_STATUSES.indexOf(selectedProject.status as Exclude<ProjectStatus, 'CANCELLED'>);
                return (
                  <div key={status} className="mp-progress-step">
                    <div className={`mp-progress-dot${index <= currentIndex ? ' reached' : ''}`} />
                    <span className={`mp-progress-label${index === currentIndex ? ' current' : ''}`}>
                      {PROJECT_STATUS_LABEL[status]}
                    </span>
                    {index < PROJECT_STATUSES.length - 1 && (
                      <div className={`mp-progress-line${index < currentIndex ? ' reached' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mp-modal-actions">
              {selectedProject.status === 'COMPLETED' && canWriteReview(user, selectedProject) && (
                <button type="button" className="mp-btn-action mp-btn-review" onClick={() => openProjectReviewModal(selectedProject)}>
                  {getReviewByProject(selectedProject.id, user.email) ? '리뷰 수정' : '리뷰 작성'}
                </button>
              )}
              {selectedProject.status === 'REQUESTED' && canCancelProject(user, selectedProject) && (
                <button type="button" className="mp-btn-action mp-btn-cancel" onClick={() => handleProjectCancel(selectedProject.id)}>
                  프로젝트 취소
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="mp-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <button type="button" className="mp-modal-close" onClick={() => setShowCreateModal(false)}>닫기</button>
            <h2 className="mp-modal-title">새 프로젝트</h2>
            <form className="mp-form" onSubmit={handleProjectCreate}>
              <div className="mp-form-group">
                <label>제목</label>
                <input className="mp-form-input" type="text" placeholder="프로젝트 제목을 입력하세요." required
                  value={projectForm.title}
                  onChange={e => setProjectForm(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="mp-form-group">
                <label>유형</label>
                <div className="mp-type-grid">
                  {([
                    { type: 'HOSPITAL',   icon: '🏥', label: '병원 동행' },
                    { type: 'GOVERNMENT', icon: '🏛️', label: '관공서 업무' },
                    { type: 'OUTING',     icon: '🚶', label: '외출 보조' },
                    { type: 'DAILY',      icon: '🏠', label: '생활동행' },
                    { type: 'OTHER',      icon: '✦',  label: '기타' },
                  ] as { type: ProjectType; icon: string; label: string }[]).map(({ type, icon, label }) => (
                    <button key={type} type="button"
                      className={`mp-type-card${projectForm.type === type ? ' selected' : ''}`}
                      onClick={() => setProjectForm(prev => ({ ...prev, type }))}>
                      <span className="mp-type-icon">{icon}</span>
                      <span className="mp-type-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mp-form-row">
                <div className="mp-form-group">
                  <label>날짜</label>
                  <input className="mp-form-input" type="date" required
                    value={projectForm.date}
                    onChange={e => setProjectForm(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div className="mp-form-group">
                  <label>시간</label>
                  <input className="mp-form-input" type="time" required
                    value={projectForm.time}
                    onChange={e => setProjectForm(prev => ({ ...prev, time: e.target.value }))} />
                </div>
              </div>
              <div className="mp-form-group">
                <label>위치</label>
                <input className="mp-form-input" type="text" placeholder="주소를 입력하세요." required
                  value={projectForm.location}
                  onChange={e => setProjectForm(prev => ({ ...prev, location: e.target.value }))} />
              </div>
              <div className="mp-form-group">
                <label>요청 사항</label>
                <textarea className="bio-textarea" rows={4} placeholder="필요한 도움을 자세히 입력하세요."
                  value={projectForm.description}
                  onChange={e => setProjectForm(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <button type="submit" className="mp-btn-action mp-btn-review">프로젝트 등록</button>
            </form>
          </div>
        </div>
      )}

      {showReviewModal && selectedProject && (
        <div className="mp-modal-overlay" onClick={() => { setShowReviewModal(false); }}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <button type="button" className="mp-modal-close" onClick={() => setShowReviewModal(false)}>닫기</button>
            <h2 className="mp-modal-title">{selectedProject.title} 리뷰</h2>

            <form className="mp-form" onSubmit={handleProjectReviewSubmit}>
              <div className="mp-form-group">
                <label>별점</label>
                <div className="review-rating-row">
                  {[1, 2, 3, 4, 5].map(score => (
                    <button key={score} type="button"
                      className={`review-rating-btn${reviewForm.rating === score ? ' selected' : ''}`}
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: score }))}>
                      {score}점
                    </button>
                  ))}
                </div>
              </div>
              <div className="mp-form-group">
                <label>태그</label>
                <div className="type-selector">
                  {REVIEW_TAGS.map(tag => (
                    <button key={tag} type="button"
                      className={`type-btn${reviewForm.tags.includes(tag) ? ' selected' : ''}`}
                      onClick={() => handleProjectReviewTagToggle(tag)}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mp-form-group">
                <label>리뷰 내용</label>
                <textarea className="bio-textarea" rows={4} required
                  placeholder="완료된 프로젝트 경험을 남겨주세요."
                  value={reviewForm.content}
                  onChange={e => setReviewForm(prev => ({ ...prev, content: e.target.value }))} />
              </div>
              {selectedReview && <p className="mp-review-helper">이미 작성한 리뷰가 있어 수정 모드로 열렸습니다.</p>}
              <button type="submit" className="mp-btn-action mp-btn-review">
                {selectedReview ? '리뷰 수정' : '리뷰 등록'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
