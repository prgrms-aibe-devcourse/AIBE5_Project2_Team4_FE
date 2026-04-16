import { useEffect, useState, type FormEvent } from 'react';
import './project.css';
import AppHeader from '../components/AppHeader';
import { getUser, type User } from '../store/appAuth';
import {
  canCancelProject,
  canCreateProject,
  canEditProject,
  canManageProjectStatus,
  canTransitionProjectTo,
  canWriteReview,
} from '../store/accessControl';
import {
  cancelProject,
  createProject,
  getProjects,
  updateProject,
  updateProjectStatus,
  type EditableProjectFields,
  type Project,
  type ProjectStatus,
  type ProjectType,
} from '../store/appProjectStore';
import {
  createReview,
  getReviewByProject,
  getReviewTags,
  updateReview,
  type ReviewRecord,
} from '../store/appReviewStore';
import { createNotification } from '../store/notificationStore';
import {
  getProposals,
  updateProposalStatus,
  withdrawProposal,
  type Proposal,
} from '../store/appProposalStore';

type StatusFilter = 'ALL' | ProjectStatus;
type PageTab = 'projects' | 'proposals';

const PROJECT_TYPES: ProjectType[] = ['HOSPITAL', 'GOVERNMENT', 'OUTING', 'DAILY', 'OTHER'];
const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  HOSPITAL: '병원',
  GOVERNMENT: '관공서',
  OUTING: '외출',
  DAILY: '생활 지원',
  OTHER: '기타',
};

const PROJECT_STATUSES: ProjectStatus[] = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  REQUESTED: '요청',
  ACCEPTED: '수락',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

const STATUS_COLOR: Record<ProjectStatus, string> = {
  REQUESTED: 'status--request',
  ACCEPTED: 'status--accept',
  IN_PROGRESS: 'status--progress',
  COMPLETED: 'status--done',
  CANCELLED: 'status--done',
};

const PROPOSAL_STATUS_LABEL: Record<Proposal['status'], string> = {
  PENDING: '대기 중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
};

const PROPOSAL_STATUS_COLOR: Record<Proposal['status'], string> = {
  PENDING: 'status--request',
  ACCEPTED: 'status--accept',
  REJECTED: 'status--done',
};

const EMPTY_FORM = {
  title: '',
  type: 'HOSPITAL' as ProjectType,
  date: '',
  time: '',
  location: '',
  description: '',
};

const EMPTY_REVIEW_FORM = {
  rating: 5,
  tags: [] as string[],
  content: '',
};

export default function ProjectPage3() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<PageTab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState<EditableProjectFields>(EMPTY_FORM);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [selectedReview, setSelectedReview] = useState<ReviewRecord | null>(null);

  const reviewTags = getReviewTags();

  useEffect(() => {
    const nextUser = getUser();
    if (!nextUser) {
      window.location.href = '/login';
      return;
    }

    setUser(nextUser);
  }, []);

  useEffect(() => {
    if (!user) return;

    const allProjects = getProjects();
    const visibleProjects = user.role === 'ROLE_ADMIN'
      ? allProjects
      : user.role === 'ROLE_FREELANCER'
        ? allProjects.filter((p) => p.freelancerEmail === user.email)
        : allProjects.filter((p) => p.requesterEmail === user.email);
    setProjects(visibleProjects);

    const allProposals = getProposals();
    const visibleProposals = user.role === 'ROLE_FREELANCER'
      ? allProposals.filter((p) => p.freelancerEmail === user.email)
      : allProposals.filter((p) => p.userEmail === user.email);
    setProposals(visibleProposals);
  }, [user, showCreateModal, showReviewModal, selectedProject]);

  const filteredProjects = statusFilter === 'ALL'
    ? projects
    : projects.filter((p) => p.status === statusFilter);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !canCreateProject(user) || !form.title || !form.date || !form.time || !form.location) return;

    const nextProject = createProject({
      ...form,
      requesterName: user.name,
      requesterEmail: user.email,
    });

    setProjects((prev) => [nextProject, ...prev]);
    setShowCreateModal(false);
    setForm(EMPTY_FORM);

    createNotification({
      userEmail: user.email,
      type: 'PROJECT_STATUS',
      title: '프로젝트가 등록되었습니다',
      message: `"${nextProject.title}" 프로젝트 요청이 등록되었습니다.`,
      link: '/project',
    });
  }

  function handleEditOpen(project: Project) {
    setEditForm({
      title: project.title,
      type: project.type,
      date: project.date,
      time: project.time,
      location: project.location,
      description: project.description,
    });
    setShowEditModal(true);
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !canEditProject(user, selectedProject)) {
      window.location.href = '/error?code=403';
      return;
    }
    const updated = updateProject(selectedProject.id, editForm);
    if (!updated) return;
    setProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    setSelectedProject(updated);
    setShowEditModal(false);
  }

  function handleCancel(projectId: number) {
    const target = projects.find((p) => p.id === projectId);
    if (!target || !canCancelProject(user, target)) {
      window.location.href = '/error?code=403';
      return;
    }
    cancelProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setSelectedProject(null);
  }

  function handleStatusUpdate(project: Project, nextStatus: ProjectStatus) {
    if (!canManageProjectStatus(user, project) || !canTransitionProjectTo(project, nextStatus)) {
      window.location.href = '/error?code=403';
      return;
    }
    const updated = updateProjectStatus(project.id, nextStatus);
    if (!updated || !user) return;

    setProjects((prev) => prev.map((p) => p.id === project.id ? updated : p));
    setSelectedProject(updated);

    createNotification({
      userEmail: updated.requesterEmail,
      type: 'PROJECT_STATUS',
      title: '프로젝트 상태가 변경되었습니다',
      message: `"${updated.title}" 프로젝트가 ${PROJECT_STATUS_LABEL[nextStatus]} 단계로 변경되었습니다.`,
      link: '/project',
    });

    if (updated.freelancerEmail) {
      createNotification({
        userEmail: updated.freelancerEmail,
        type: 'FREELANCER_STATUS',
        title: '담당 프로젝트 상태가 변경되었습니다',
        message: `"${updated.title}" 프로젝트가 ${PROJECT_STATUS_LABEL[nextStatus]} 단계로 업데이트되었습니다.`,
        link: '/project',
      });
    }
  }

  function openReviewModal(project: Project) {
    if (!user || !canWriteReview(user, project)) {
      window.location.href = '/error?code=403';
      return;
    }
    const existing = getReviewByProject(project.id, user.email);
    setSelectedProject(project);
    setSelectedReview(existing);
    setReviewForm(existing
      ? { rating: existing.rating, tags: existing.tags, content: existing.content }
      : EMPTY_REVIEW_FORM);
    setShowReviewModal(true);
  }

  function handleReviewTagToggle(tag: string) {
    setReviewForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  }

  function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !selectedProject.freelancerId || !selectedProject.freelancerName) return;
    if (!user || !canWriteReview(user, selectedProject)) {
      window.location.href = '/error?code=403';
      return;
    }

    if (selectedReview) {
      updateReview(selectedReview.id, {
        rating: reviewForm.rating,
        tags: reviewForm.tags,
        content: reviewForm.content,
      });
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
    }

    if (selectedProject.freelancerEmail) {
      createNotification({
        userEmail: selectedProject.freelancerEmail,
        type: 'FREELANCER_STATUS',
        title: '새 리뷰가 등록되었습니다',
        message: `"${selectedProject.title}" 프로젝트에 대한 리뷰가 등록되었습니다.`,
        link: '/mypage?tab=reviews',
      });
    }

    setShowReviewModal(false);
    setSelectedReview(null);
    setReviewForm(EMPTY_REVIEW_FORM);
  }

  function handleProposalAction(proposal: Proposal, status: 'ACCEPTED' | 'REJECTED') {
    updateProposalStatus(proposal.id, status);
    setProposals((prev) => prev.map((p) => p.id === proposal.id ? { ...p, status } : p));

    createNotification({
      userEmail: proposal.userEmail ?? '',
      type: 'PROJECT_STATUS',
      title: status === 'ACCEPTED' ? '제안이 수락되었습니다' : '제안이 거절되었습니다',
      message: `"${proposal.projectTitle}" 프로젝트의 제안이 ${status === 'ACCEPTED' ? '수락' : '거절'}되었습니다.`,
      link: '/project',
    });
  }

  function handleProposalWithdraw(proposalId: number) {
    withdrawProposal(proposalId);
    setProposals((prev) => prev.filter((p) => p.id !== proposalId));
  }

  if (!user) return null;

  const isFreelancer = user.role === 'ROLE_FREELANCER';
  const canCreate = canCreateProject(user);
  const proposalTabLabel = isFreelancer ? '받은 제안' : '보낸 제안';

  return (
    <div className="project-page">
      <AppHeader activePage="project" />

      <main className="project-content">
        <div className="project-header">
          <div>
            <h1 className="project-title">프로젝트</h1>
            <p className="project-subtitle">프로젝트 현황과 제안 내역을 한 곳에서 관리하세요.</p>
          </div>
          {canCreate && activeTab === 'projects' && (
            <button type="button" className="btn-create" onClick={() => setShowCreateModal(true)}>
              + 새 프로젝트
            </button>
          )}
        </div>

        {/* 탭 바 */}
        <div className="page-tab-bar">
          <button
            type="button"
            className={`page-tab${activeTab === 'projects' ? ' active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            {user.role === 'ROLE_ADMIN' ? '전체 프로젝트' : '프로젝트 관리'}
          </button>
          {user.role !== 'ROLE_ADMIN' && (
            <button
              type="button"
              className={`page-tab${activeTab === 'proposals' ? ' active' : ''}`}
              onClick={() => setActiveTab('proposals')}
            >
              {proposalTabLabel}
              {proposals.filter((p) => p.status === 'PENDING').length > 0 && (
                <span className="page-tab-badge">
                  {proposals.filter((p) => p.status === 'PENDING').length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* 프로젝트 탭 */}
        {activeTab === 'projects' && (
          <>
            <div className="filter-bar">
              {(['ALL', ...PROJECT_STATUSES] as StatusFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`filter-chip${statusFilter === filter ? ' active' : ''}`}
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter === 'ALL' ? '전체' : PROJECT_STATUS_LABEL[filter]}
                  <span className="filter-count">
                    {filter === 'ALL'
                      ? projects.length
                      : projects.filter((p) => p.status === filter).length}
                  </span>
                </button>
              ))}
            </div>

            {filteredProjects.length === 0 ? (
              <div className="project-empty"><p>해당 상태의 프로젝트가 없습니다.</p></div>
            ) : (
              <ul className="project-list">
                {filteredProjects.map((project) => (
                  <li key={project.id} className="project-card" onClick={() => setSelectedProject(project)}>
                    <div className="project-card-top">
                      <span className="project-type-badge">{PROJECT_TYPE_LABEL[project.type]}</span>
                      <span className={`project-status ${STATUS_COLOR[project.status]}`}>
                        {PROJECT_STATUS_LABEL[project.status]}
                      </span>
                    </div>
                    <h3 className="project-card-title">{project.title}</h3>
                    <div className="project-card-meta">
                      <span>일정 {project.date} {project.time}</span>
                      <span>위치 {project.location}</span>
                    </div>
                    {project.freelancerName && (
                      <div className="project-card-freelancer">담당 도우미: {project.freelancerName}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* 제안 탭 */}
        {activeTab === 'proposals' && (
          <>
            {proposals.length === 0 ? (
              <div className="project-empty">
                <p>{isFreelancer ? '받은 제안이 없습니다.' : '보낸 제안이 없습니다.'}</p>
              </div>
            ) : (
              <ul className="proposal-list">
                {proposals.map((proposal) => (
                  <li key={proposal.id} className="proposal-card">
                    <div className="proposal-card-top">
                      <div className="proposal-card-meta">
                        <span className="project-type-badge">{proposal.projectType}</span>
                        <span className={`project-status ${PROPOSAL_STATUS_COLOR[proposal.status]}`}>
                          {PROPOSAL_STATUS_LABEL[proposal.status]}
                        </span>
                      </div>
                      <span className="proposal-card-date">{proposal.sentAt}</span>
                    </div>

                    <h3 className="proposal-card-title">{proposal.projectTitle}</h3>

                    <div className="proposal-card-info">
                      {isFreelancer ? (
                        <>
                          <span>보낸 사람: {proposal.userName}</span>
                          <span>일정: {proposal.date} {proposal.time}</span>
                          <span>위치: {proposal.location}</span>
                        </>
                      ) : (
                        <>
                          <span>도우미: {proposal.freelancerName}</span>
                          <span>일정: {proposal.date} {proposal.time}</span>
                          <span>위치: {proposal.location}</span>
                        </>
                      )}
                    </div>

                    {proposal.description && (
                      <p className="proposal-card-desc">{proposal.description}</p>
                    )}

                    <div className="proposal-card-actions">
                      {isFreelancer ? (
                        proposal.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              className="proposal-btn proposal-btn--accept"
                              onClick={() => handleProposalAction(proposal, 'ACCEPTED')}
                            >
                              수락
                            </button>
                            <button
                              type="button"
                              className="proposal-btn proposal-btn--reject"
                              onClick={() => handleProposalAction(proposal, 'REJECTED')}
                            >
                              거절
                            </button>
                          </>
                        ) : (
                          <span className="proposal-status-text">
                            {proposal.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                          </span>
                        )
                      ) : (
                        proposal.status === 'PENDING' ? (
                          <button
                            type="button"
                            className="proposal-btn proposal-btn--reject"
                            onClick={() => handleProposalWithdraw(proposal.id)}
                          >
                            제안 철회
                          </button>
                        ) : (
                          <span className="proposal-status-text">
                            {proposal.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                          </span>
                        )
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {/* 프로젝트 상세 모달 */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSelectedProject(null)}>닫기</button>

            <div className="modal-head">
              <div className="modal-badges">
                <span className="project-type-badge">{PROJECT_TYPE_LABEL[selectedProject.type]}</span>
                <span className={`project-status ${STATUS_COLOR[selectedProject.status]}`}>
                  {PROJECT_STATUS_LABEL[selectedProject.status]}
                </span>
              </div>
              <h2 className="modal-title">{selectedProject.title}</h2>
            </div>

            <ul className="modal-info">
              <li><span>날짜</span><span>{selectedProject.date}</span></li>
              <li><span>시간</span><span>{selectedProject.time}</span></li>
              <li><span>위치</span><span>{selectedProject.location}</span></li>
              <li><span>등록일</span><span>{selectedProject.createdAt}</span></li>
              {selectedProject.freelancerName && (
                <li><span>담당 도우미</span><span>{selectedProject.freelancerName}</span></li>
              )}
            </ul>

            <div className="modal-desc">
              <p className="modal-desc-label">요청 사항</p>
              <p className="modal-desc-text">{selectedProject.description}</p>
            </div>

            <div className="progress-track">
              {PROJECT_STATUSES.map((status, index) => {
                const currentIndex = PROJECT_STATUSES.indexOf(
                  selectedProject.status as Exclude<ProjectStatus, 'CANCELLED'>,
                );
                return (
                  <div key={status} className="progress-step">
                    <div className={`progress-dot${index <= currentIndex ? ' reached' : ''}`} />
                    <span className={`progress-label${index === currentIndex ? ' current' : ''}`}>
                      {PROJECT_STATUS_LABEL[status]}
                    </span>
                    {index < PROJECT_STATUSES.length - 1 && (
                      <div className={`progress-line${index < currentIndex ? ' reached' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="modal-actions">
              {selectedProject.status === 'ACCEPTED' && canManageProjectStatus(user, selectedProject) && (
                <button type="button" className="btn-action btn-review"
                  onClick={() => handleStatusUpdate(selectedProject, 'IN_PROGRESS')}>
                  진행 시작
                </button>
              )}
              {selectedProject.status === 'IN_PROGRESS' && canManageProjectStatus(user, selectedProject) && (
                <button type="button" className="btn-action btn-review"
                  onClick={() => handleStatusUpdate(selectedProject, 'COMPLETED')}>
                  완료 처리
                </button>
              )}
              {selectedProject.status === 'COMPLETED' && canWriteReview(user, selectedProject) && (
                <button type="button" className="btn-action btn-review"
                  onClick={() => openReviewModal(selectedProject)}>
                  {getReviewByProject(selectedProject.id, user.email) ? '리뷰 보기' : '리뷰 작성'}
                </button>
              )}
              {selectedProject.status === 'REQUESTED' && canEditProject(user, selectedProject) && (
                <button type="button" className="btn-action btn-edit-project"
                  onClick={() => handleEditOpen(selectedProject)}>
                  수정
                </button>
              )}
              {selectedProject.status === 'REQUESTED' && canCancelProject(user, selectedProject) && (
                <button type="button" className="btn-action btn-cancel"
                  onClick={() => handleCancel(selectedProject.id)}>
                  프로젝트 취소
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 프로젝트 수정 모달 */}
      {showEditModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowEditModal(false)}>닫기</button>
            <h2 className="modal-title">프로젝트 수정</h2>

            <form className="create-form" onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  placeholder="프로젝트 제목을 입력하세요."
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
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
                      className={`type-btn${editForm.type === type ? ' selected' : ''}`}
                      onClick={() => setEditForm((prev) => ({ ...prev, type }))}
                    >
                      {PROJECT_TYPE_LABEL[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>날짜</label>
                  <input type="date" value={editForm.date}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>시간</label>
                  <input type="time" value={editForm.time}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, time: e.target.value }))} required />
                </div>
              </div>

              <div className="form-group">
                <label>위치</label>
                <input type="text" placeholder="주소를 입력하세요." value={editForm.location}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label>요청 사항</label>
                <textarea placeholder="필요한 도움을 자세히 입력하세요." value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} />
              </div>

              <button type="submit" className="btn-create form-submit">수정 저장</button>
            </form>
          </div>
        </div>
      )}

      {/* 프로젝트 생성 모달 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowCreateModal(false)}>닫기</button>
            <h2 className="modal-title">새 프로젝트</h2>

            <form className="create-form" onSubmit={handleCreate}>
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  placeholder="프로젝트 제목을 입력하세요."
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
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
                      onClick={() => setForm((prev) => ({ ...prev, type }))}
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
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>시간</label>
                  <input type="time" value={form.time}
                    onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))} required />
                </div>
              </div>

              <div className="form-group">
                <label>위치</label>
                <input type="text" placeholder="주소를 입력하세요." value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label>요청 사항</label>
                <textarea placeholder="필요한 도움을 자세히 입력하세요." value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} />
              </div>

              <button type="submit" className="btn-create form-submit">프로젝트 등록</button>
            </form>
          </div>
        </div>
      )}

      {/* 리뷰 모달 */}
      {showReviewModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal review-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowReviewModal(false)}>닫기</button>
            <h2 className="modal-title">{selectedProject.title} 리뷰</h2>

            <form className="create-form" onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>별점</label>
                <div className="review-rating-row">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      className={`review-rating-btn${reviewForm.rating === score ? ' selected' : ''}`}
                      onClick={() => setReviewForm((prev) => ({ ...prev, rating: score }))}
                    >
                      {score}점
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>태그</label>
                <div className="type-selector">
                  {reviewTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`type-btn${reviewForm.tags.includes(tag) ? ' selected' : ''}`}
                      onClick={() => handleReviewTagToggle(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>리뷰 내용</label>
                <textarea placeholder="완료된 프로젝트 경험을 남겨주세요." value={reviewForm.content}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, content: e.target.value }))}
                  rows={5} required />
              </div>

              {selectedReview && (
                <p className="review-helper-text">이미 같은 프로젝트에 작성한 리뷰가 있어 수정 모드로 열렸습니다.</p>
              )}

              <button type="submit" className="btn-create form-submit">
                {selectedReview ? '리뷰 수정' : '리뷰 등록'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
