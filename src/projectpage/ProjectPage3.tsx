import { useEffect, useState, type FormEvent } from 'react';
import './project.css';
import AppHeader from '../components/AppHeader';
import { getUser, type User } from '../store/appAuth';
import {
  canCancelProject,
  canCreateProject,
  canManageProjectStatus,
  canTransitionProjectTo,
  canWriteReview,
} from '../store/accessControl';
import {
  cancelProject,
  createProject,
  getProjects,
  updateProjectStatus,
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

type StatusFilter = 'ALL' | ProjectStatus;

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
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
    if (!user) {
      return;
    }

    const allProjects = getProjects();
    const visibleProjects = user.role === 'ROLE_ADMIN'
      ? allProjects
      : user.role === 'ROLE_FREELANCER'
        ? allProjects.filter((project) => project.freelancerEmail === user.email)
        : allProjects.filter((project) => project.requesterEmail === user.email);

    setProjects(visibleProjects);
  }, [user, showCreateModal, showReviewModal, selectedProject]);

  const filteredProjects = statusFilter === 'ALL'
    ? projects
    : projects.filter((project) => project.status === statusFilter);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !canCreateProject(user) || !form.title || !form.date || !form.time || !form.location) {
      return;
    }

    const nextProject = createProject({
      ...form,
      requesterName: user.name,
      requesterEmail: user.email,
    });

    setProjects((currentProjects) => [nextProject, ...currentProjects]);
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

  function handleCancel(projectId: number) {
    const targetProject = projects.find((project) => project.id === projectId);
    if (!targetProject || !canCancelProject(user, targetProject)) {
      window.location.href = '/error?code=403';
      return;
    }

    cancelProject(projectId);
    setProjects((currentProjects) => currentProjects.filter((project) => project.id !== projectId));
    setSelectedProject(null);
  }

  function handleStatusUpdate(project: Project, nextStatus: ProjectStatus) {
    if (!canManageProjectStatus(user, project) || !canTransitionProjectTo(project, nextStatus)) {
      window.location.href = '/error?code=403';
      return;
    }

    const updatedProject = updateProjectStatus(project.id, nextStatus);
    if (!updatedProject || !user) {
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.map((currentProject) => (
        currentProject.id === project.id ? updatedProject : currentProject
      )),
    );
    setSelectedProject(updatedProject);

    createNotification({
      userEmail: updatedProject.requesterEmail,
      type: 'PROJECT_STATUS',
      title: '프로젝트 상태가 변경되었습니다',
      message: `"${updatedProject.title}" 프로젝트가 ${PROJECT_STATUS_LABEL[nextStatus]} 단계로 변경되었습니다.`,
      link: '/project',
    });

    if (updatedProject.freelancerEmail) {
      createNotification({
        userEmail: updatedProject.freelancerEmail,
        type: 'FREELANCER_STATUS',
        title: '담당 프로젝트 상태가 변경되었습니다',
        message: `"${updatedProject.title}" 프로젝트가 ${PROJECT_STATUS_LABEL[nextStatus]} 단계로 업데이트되었습니다.`,
        link: '/project',
      });
    }
  }

  function openReviewModal(project: Project) {
    if (!user || !canWriteReview(user, project)) {
      window.location.href = '/error?code=403';
      return;
    }

    const existingReview = getReviewByProject(project.id, user.email);
    setSelectedProject(project);
    setSelectedReview(existingReview);
    setReviewForm(existingReview
      ? { rating: existingReview.rating, tags: existingReview.tags, content: existingReview.content }
      : EMPTY_REVIEW_FORM);
    setShowReviewModal(true);
  }

  function handleReviewTagToggle(tag: string) {
    setReviewForm((currentReviewForm) => ({
      ...currentReviewForm,
      tags: currentReviewForm.tags.includes(tag)
        ? currentReviewForm.tags.filter((currentTag) => currentTag !== tag)
        : [...currentReviewForm.tags, tag],
    }));
  }

  function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !selectedProject.freelancerId || !selectedProject.freelancerName) {
      return;
    }

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
        link: `/freelancers/${selectedProject.freelancerId}`,
      });
    }

    setShowReviewModal(false);
    setSelectedReview(null);
    setReviewForm(EMPTY_REVIEW_FORM);
  }

  if (!user) {
    return null;
  }

  const canCreate = canCreateProject(user);

  return (
    <div className="project-page">
      <AppHeader activePage="project" />

      <main className="project-content">
        <div className="project-header">
          <div>
            <h1 className="project-title">내 프로젝트</h1>
            <p className="project-subtitle">요청한 서비스의 진행 상태를 확인하고, 완료 후 리뷰를 남길 수 있습니다.</p>
          </div>
          {canCreate && (
            <button type="button" className="btn-create" onClick={() => setShowCreateModal(true)}>
              + 새 프로젝트
            </button>
          )}
        </div>

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
                  : projects.filter((project) => project.status === filter).length}
              </span>
            </button>
          ))}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="project-empty">
            <p>해당 상태의 프로젝트가 없습니다.</p>
          </div>
        ) : (
          <ul className="project-list">
            {filteredProjects.map((project) => (
              <li
                key={project.id}
                className="project-card"
                onClick={() => setSelectedProject(project)}
              >
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
                  <div className="project-card-freelancer">담당 프리랜서: {project.freelancerName}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
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
                <li><span>담당 프리랜서</span><span>{selectedProject.freelancerName}</span></li>
              )}
            </ul>

            <div className="modal-desc">
              <p className="modal-desc-label">요청 사항</p>
              <p className="modal-desc-text">{selectedProject.description}</p>
            </div>

            <div className="progress-track">
              {PROJECT_STATUSES.map((status, index) => {
                const currentIndex = PROJECT_STATUSES.indexOf(selectedProject.status as Exclude<ProjectStatus, 'CANCELLED'>);
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
                <button
                  type="button"
                  className="btn-action btn-review"
                  onClick={() => handleStatusUpdate(selectedProject, 'IN_PROGRESS')}
                >
                  진행 시작
                </button>
              )}
              {selectedProject.status === 'IN_PROGRESS' && canManageProjectStatus(user, selectedProject) && (
                <button
                  type="button"
                  className="btn-action btn-review"
                  onClick={() => handleStatusUpdate(selectedProject, 'COMPLETED')}
                >
                  완료 처리
                </button>
              )}
              {selectedProject.status === 'COMPLETED' && canWriteReview(user, selectedProject) && (
                <button type="button" className="btn-action btn-review" onClick={() => openReviewModal(selectedProject)}>
                  {getReviewByProject(selectedProject.id, user.email) ? '리뷰 보기' : '리뷰 작성'}
                </button>
              )}
              {selectedProject.status === 'REQUESTED' && canCancelProject(user, selectedProject) && (
                <button
                  type="button"
                  className="btn-action btn-cancel"
                  onClick={() => handleCancel(selectedProject.id)}
                >
                  프로젝트 취소
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowCreateModal(false)}>닫기</button>
            <h2 className="modal-title">새 프로젝트</h2>

            <form className="create-form" onSubmit={handleCreate}>
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  placeholder="프로젝트 제목을 입력하세요."
                  value={form.title}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, title: event.target.value }))}
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
                      onClick={() => setForm((currentForm) => ({ ...currentForm, type }))}
                    >
                      {PROJECT_TYPE_LABEL[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>날짜</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((currentForm) => ({ ...currentForm, date: event.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>시간</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(event) => setForm((currentForm) => ({ ...currentForm, time: event.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>위치</label>
                <input
                  type="text"
                  placeholder="주소를 입력하세요."
                  value={form.location}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, location: event.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>요청 사항</label>
                <textarea
                  placeholder="필요한 도움을 자세히 입력하세요."
                  value={form.description}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, description: event.target.value }))}
                  rows={4}
                />
              </div>

              <button type="submit" className="btn-create form-submit">프로젝트 등록</button>
            </form>
          </div>
        </div>
      )}

      {showReviewModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal review-modal" onClick={(event) => event.stopPropagation()}>
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
                      onClick={() => setReviewForm((currentReviewForm) => ({ ...currentReviewForm, rating: score }))}
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
                <textarea
                  placeholder="완료된 프로젝트 경험을 남겨주세요."
                  value={reviewForm.content}
                  onChange={(event) => setReviewForm((currentReviewForm) => ({ ...currentReviewForm, content: event.target.value }))}
                  rows={5}
                  required
                />
              </div>

              {selectedReview && (
                <p className="review-helper-text">이미 같은 프로젝트에 작성한 리뷰가 있어 수정 모드로 열렸습니다.</p>
              )}

              <button type="submit" className="btn-create form-submit">{selectedReview ? '리뷰 수정' : '리뷰 등록'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
