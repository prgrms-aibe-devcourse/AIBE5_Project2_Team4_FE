import { useState, useEffect } from 'react';
import './project.css';
import Header from '../components/Header';
import { getUser } from '../store/auth';

// FR-PROJECT-03: 프로젝트 유형 enum
type ProjectType = '병원' | '관공서' | '외출' | '생활동행' | '기타';
const PROJECT_TYPES: ProjectType[] = ['병원', '관공서', '외출', '생활동행', '기타'];

// FR-PROJECT-07: 프로젝트 상태
type ProjectStatus = '요청' | '수락' | '진행 중' | '완료';
const PROJECT_STATUSES: ProjectStatus[] = ['요청', '수락', '진행 중', '완료'];

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
}

// TODO: replace with GET /api/projects/me
const MOCK_PROJECTS: Project[] = [
  { id: 1, title: '정기 병원 방문 동행',  type: '병원',    date: '2025.04.20', time: '10:00', location: '서울 강남구 삼성동', description: '어머니 정기 검진 동행 요청입니다.',    status: '수락',   createdAt: '2025.04.15', freelancerName: '박민준' },
  { id: 2, title: '주민센터 서류 발급',    type: '관공서',  date: '2025.04.22', time: '14:00', location: '서울 마포구 합정동', description: '주민등록등본 발급 업무 보조 요청입니다.', status: '요청',   createdAt: '2025.04.16' },
  { id: 3, title: '마트 장보기 동행',      type: '생활동행', date: '2025.04.18', time: '11:00', location: '서울 서초구 방배동', description: '주 1회 마트 장보기 동행 부탁드립니다.',  status: '진행 중', createdAt: '2025.04.10', freelancerName: '이영희' },
  { id: 4, title: '공원 산책 동행',        type: '외출',    date: '2025.04.10', time: '09:00', location: '서울 용산구 한강로', description: '주 2회 한강공원 산책 동행입니다.',       status: '완료',   createdAt: '2025.04.01', freelancerName: '김철수' },
];

type StatusFilter = '전체' | ProjectStatus;

const STATUS_COLOR: Record<ProjectStatus, string> = {
  '요청':   'status--request',
  '수락':   'status--accept',
  '진행 중': 'status--progress',
  '완료':   'status--done',
};

const EMPTY_FORM = { title: '', type: '병원' as ProjectType, date: '', time: '', location: '', description: '' };

export default function ProjectPage() {
  const [user, setUser]                   = useState(getUser());
  const [projects, setProjects]           = useState<Project[]>([]);
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>('전체');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm]                   = useState(EMPTY_FORM);

  useEffect(() => {
    const u = getUser();
    if (!u) { window.location.href = '/login'; return; }
    setUser(u);
    // TODO: fetch('/api/projects/me').then(r => r.json()).then(setProjects);
    setProjects(MOCK_PROJECTS);
  }, []);

  // FR-PROJECT-04: 상태별 필터
  const filtered = statusFilter === '전체'
    ? projects
    : projects.filter(p => p.status === statusFilter);

  // FR-PROJECT-01: 프로젝트 생성
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time || !form.location) return;
    const newProject: Project = {
      id: Date.now(),
      ...form,
      status: '요청',
      createdAt: new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').replace('.', ''),
    };
    // TODO: POST /api/projects { ...form }
    setProjects(prev => [newProject, ...prev]);
    setShowCreateModal(false);
    setForm(EMPTY_FORM);
  };

  // FR-PROJECT-09: 프로젝트 취소 (요청 상태에서만 가능)
  const handleCancel = (id: number) => {
    // TODO: PATCH /api/projects/:id/cancel
    setProjects(prev => prev.filter(p => p.id !== id));
    setSelectedProject(null);
  };

  if (!user) return null;

  const canCreate = user.role === 'ROLE_USER';

  return (
    <div className="project-page">
      <Header activePage="project" />

      <main className="project-content">
        <div className="project-header">
          <div>
            <h1 className="project-title">내 프로젝트</h1>
            <p className="project-subtitle">요청한 서비스의 현황을 확인하고 관리하세요.</p>
          </div>
          {/* FR-PROJECT-01: 일반 사용자만 생성 가능 */}
          {canCreate && (
            <button className="btn-create" onClick={() => setShowCreateModal(true)}>+ 새 프로젝트</button>
          )}
        </div>

        {/* FR-PROJECT-04: 상태별 필터 */}
        <div className="filter-bar">
          {(['전체', ...PROJECT_STATUSES] as StatusFilter[]).map(f => (
            <button
              key={f}
              className={`filter-chip${statusFilter === f ? ' active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f}
              <span className="filter-count">
                {f === '전체' ? projects.length : projects.filter(p => p.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* FR-PROJECT-04: 프로젝트 목록 */}
        {filtered.length === 0 ? (
          <div className="project-empty">
            <p>해당 상태의 프로젝트가 없습니다.</p>
          </div>
        ) : (
          <ul className="project-list">
            {filtered.map(project => (
              <li
                key={project.id}
                className="project-card"
                onClick={() => setSelectedProject(project)}
              >
                <div className="project-card-top">
                  <span className="project-type-badge">{project.type}</span>
                  <span className={`project-status ${STATUS_COLOR[project.status]}`}>{project.status}</span>
                </div>
                <h3 className="project-card-title">{project.title}</h3>
                <div className="project-card-meta">
                  <span>📅 {project.date} {project.time}</span>
                  <span>📍 {project.location}</span>
                </div>
                {project.freelancerName && (
                  <div className="project-card-freelancer">담당: {project.freelancerName}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* FR-PROJECT-05/06/07/08/09: 프로젝트 상세 모달 */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProject(null)}>✕</button>

            <div className="modal-head">
              <div className="modal-badges">
                <span className="project-type-badge">{selectedProject.type}</span>
                <span className={`project-status ${STATUS_COLOR[selectedProject.status]}`}>
                  {selectedProject.status}
                </span>
              </div>
              <h2 className="modal-title">{selectedProject.title}</h2>
            </div>

            {/* FR-PROJECT-05: 상세 정보 */}
            <ul className="modal-info">
              <li><span>날짜</span><span>{selectedProject.date}</span></li>
              <li><span>시간</span><span>{selectedProject.time}</span></li>
              <li><span>위치</span><span>{selectedProject.location}</span></li>
              <li><span>등록일</span><span>{selectedProject.createdAt}</span></li>
              {/* FR-PROJECT-06: 프리랜서 정보 */}
              {selectedProject.freelancerName && (
                <li><span>담당 프리랜서</span><span>{selectedProject.freelancerName}</span></li>
              )}
            </ul>

            <div className="modal-desc">
              <p className="modal-desc-label">요청 사항</p>
              <p className="modal-desc-text">{selectedProject.description}</p>
            </div>

            {/* FR-PROJECT-06: 진행 상태 표시 */}
            <div className="progress-track">
              {PROJECT_STATUSES.map((s, i) => {
                const currentIdx = PROJECT_STATUSES.indexOf(selectedProject.status);
                return (
                  <div key={s} className="progress-step">
                    <div className={`progress-dot${i <= currentIdx ? ' reached' : ''}`} />
                    <span className={`progress-label${i === currentIdx ? ' current' : ''}`}>{s}</span>
                    {i < PROJECT_STATUSES.length - 1 && (
                      <div className={`progress-line${i < currentIdx ? ' reached' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* FR-PROJECT-08/09: 상태별 액션 */}
            <div className="modal-actions">
              {selectedProject.status === '완료' && (
                <button className="btn-action btn-review">리뷰 작성</button>
              )}
              {selectedProject.status === '요청' && (
                <button
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

      {/* FR-PROJECT-01/02/03: 프로젝트 생성 모달 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            <h2 className="modal-title">새 프로젝트</h2>

            <form className="create-form" onSubmit={handleCreate}>
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  placeholder="프로젝트 제목을 입력하세요"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              {/* FR-PROJECT-03: 프로젝트 유형 */}
              <div className="form-group">
                <label>유형</label>
                <div className="type-selector">
                  {PROJECT_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`type-btn${form.type === t ? ' selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* FR-PROJECT-02: 날짜/시간/위치/요청사항 */}
              <div className="form-row">
                <div className="form-group">
                  <label>날짜</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>시간</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>위치</label>
                <input
                  type="text"
                  placeholder="주소를 입력하세요"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>요청 사항</label>
                <textarea
                  placeholder="요청 사항을 자세히 입력해 주세요."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
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
