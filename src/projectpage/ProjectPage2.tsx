import { useEffect, useState, type FormEvent } from 'react';
import './project.css';
import AppHeader from '../components/AppHeader';
import { getUser, type User } from '../store/appAuth';
import { createNotification } from '../store/notificationStore';

type ProjectType = 'HOSPITAL' | 'GOVERNMENT' | 'OUTING' | 'DAILY' | 'OTHER';
type ProjectStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
type StatusFilter = 'ALL' | ProjectStatus;

interface Project {
  id: number;
  title: string;
  type: ProjectType;
  date: string;
  time: string;
  location: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  freelancerName?: string;
  freelancerEmail?: string;
}

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
};

const STATUS_COLOR: Record<ProjectStatus, string> = {
  REQUESTED: 'status--request',
  ACCEPTED: 'status--accept',
  IN_PROGRESS: 'status--progress',
  COMPLETED: 'status--done',
};

const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    title: '정기 병원 방문 동행',
    type: 'HOSPITAL',
    date: '2025-04-20',
    time: '10:00',
    location: '서울 강남구 삼성동',
    description: '정기 검진을 위한 병원 방문 동행이 필요합니다.',
    status: 'ACCEPTED',
    createdAt: '2025.04.15',
    freelancerName: '김지수',
    freelancerEmail: 'free@stella.ai',
  },
  {
    id: 2,
    title: '주민센터 서류 발급',
    type: 'GOVERNMENT',
    date: '2025-04-22',
    time: '14:00',
    location: '서울 마포구 합정동',
    description: '주민등록등본과 기타 행정 서류 발급을 도와주세요.',
    status: 'REQUESTED',
    createdAt: '2025.04.16',
  },
  {
    id: 3,
    title: '마트 장보기 동행',
    type: 'DAILY',
    date: '2025-04-18',
    time: '11:00',
    location: '서울 서초구 반포동',
    description: '주 1회 장보기 동행이 필요합니다.',
    status: 'IN_PROGRESS',
    createdAt: '2025.04.10',
    freelancerName: '김지수',
    freelancerEmail: 'free@stella.ai',
  },
  {
    id: 4,
    title: '공원 산책 동행',
    type: 'OUTING',
    date: '2025-04-10',
    time: '09:00',
    location: '서울 용산구 한강로',
    description: '주 2회 산책 동행 요청입니다.',
    status: 'COMPLETED',
    createdAt: '2025.04.01',
    freelancerName: '김지수',
    freelancerEmail: 'free@stella.ai',
  },
];

const EMPTY_FORM = {
  title: '',
  type: 'HOSPITAL' as ProjectType,
  date: '',
  time: '',
  location: '',
  description: '',
};

export default function ProjectPage2() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const nextUser = getUser();
    if (!nextUser) {
      window.location.href = '/login';
      return;
    }

    setUser(nextUser);
    setProjects(MOCK_PROJECTS);
  }, []);

  const filteredProjects = statusFilter === 'ALL'
    ? projects
    : projects.filter((project) => project.status === statusFilter);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !form.title || !form.date || !form.time || !form.location) {
      return;
    }

    const nextProject: Project = {
      id: Date.now(),
      ...form,
      status: 'REQUESTED',
      createdAt: new Date().toLocaleDateString('ko-KR'),
    };

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

  function handleCancel(id: number) {
    setProjects((currentProjects) => currentProjects.filter((project) => project.id !== id));
    setSelectedProject(null);
  }

  function updateProjectStatus(project: Project, nextStatus: ProjectStatus) {
    if (!user) {
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.map((currentProject) =>
        currentProject.id === project.id ? { ...currentProject, status: nextStatus } : currentProject,
      ),
    );
    setSelectedProject({ ...project, status: nextStatus });

    createNotification({
      userEmail: user.email,
      type: 'PROJECT_STATUS',
      title: '프로젝트 상태가 변경되었습니다',
      message: `"${project.title}" 프로젝트가 ${PROJECT_STATUS_LABEL[nextStatus]} 단계로 변경되었습니다.`,
      link: '/project',
    });

    if (project.freelancerEmail) {
      createNotification({
        userEmail: project.freelancerEmail,
        type: 'FREELANCER_STATUS',
        title: '담당 프로젝트 상태가 변경되었습니다',
        message: `"${project.title}" 프로젝트가 ${PROJECT_STATUS_LABEL[nextStatus]} 단계로 업데이트되었습니다.`,
        link: '/project',
      });
    }
  }

  if (!user) {
    return null;
  }

  const canCreate = user.role === 'ROLE_USER';

  return (
    <div className="project-page">
      <AppHeader activePage="project" />

      <main className="project-content">
        <div className="project-header">
          <div>
            <h1 className="project-title">내 프로젝트</h1>
            <p className="project-subtitle">요청한 서비스의 진행 상태를 확인하고 관리하세요.</p>
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
                const currentIndex = PROJECT_STATUSES.indexOf(selectedProject.status);
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
              {selectedProject.status === 'ACCEPTED' && (
                <button
                  type="button"
                  className="btn-action btn-review"
                  onClick={() => updateProjectStatus(selectedProject, 'IN_PROGRESS')}
                >
                  진행 시작
                </button>
              )}
              {selectedProject.status === 'IN_PROGRESS' && (
                <button
                  type="button"
                  className="btn-action btn-review"
                  onClick={() => updateProjectStatus(selectedProject, 'COMPLETED')}
                >
                  완료 처리
                </button>
              )}
              {selectedProject.status === 'COMPLETED' && (
                <button type="button" className="btn-action btn-review">리뷰 작성</button>
              )}
              {selectedProject.status === 'REQUESTED' && (
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
    </div>
  );
}
