import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import './project.css';
import AppHeader from '../components/AppHeader';
import { getUser, type User } from '../store/appAuth';
import {
  cancelProject,
  completeProject,
  createProject,
  getAllProjects,
  getMyProjects,
  getProject,
  startProject,
  updateProject,
  type ProjectCreateRequest,
  type ProjectDetailResponse,
  type ProjectStatus,
  type ProjectSummaryResponse,
} from '../api/projects';
import {
  acceptProposal,
  getMyFreelancerProposal,
  getMyFreelancerProposals,
  getProjectProposals,
  rejectProposal,
  type ProposalStatus,
  type ProjectProposalSummaryResponse,
  type ProposalDetailResponse,
  type ProposalSummaryResponse,
} from '../api/proposals';
import {
  createProjectReview,
  createRequesterReview,
  getMyReviews,
  getReviewTagCodes,
  updateMyReview,
  type ReviewDetailResponse,
  type ReviewSummaryResponse,
} from '../api/reviews';
import { getProjectTypeCodes, getRegionCodes } from '../api/codes';
import { getErrorMessage } from '../lib/errors';
import { formatDateTime, labelOf } from '../lib/referenceData';
import { proposalStatusLabel } from '../lib/koreanLabels';
import ProjectFormModal, { type ProjectFormValues } from './ProjectFormModal';
import ProposalTab from './ProposalTab';
import ReviewModal from './ReviewModal';

type StatusFilter = 'ALL' | ProjectStatus;

const PROJECT_STATUSES: ProjectStatus[] = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const ALL_PROJECTS_PAGE_SIZE = 9;
const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  REQUESTED: '요청',
  ACCEPTED: '수락',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  PENDING: '대기 중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  EXPIRED: '만료됨',
  CANCELLED: '취소됨',
};

const STATUS_COLOR: Record<ProjectStatus, string> = {
  REQUESTED: 'status--request',
  ACCEPTED: 'status--accept',
  IN_PROGRESS: 'status--progress',
  COMPLETED: 'status--done',
  CANCELLED: 'status--done',
};

const EMPTY_FORM: ProjectFormValues = {
  title: '',
  projectTypeCode: '',
  serviceRegionCode: '',
  requestedStartAt: '',
  requestedEndAt: '',
  serviceAddress: '',
  serviceDetailAddress: '',
  requestDetail: '',
};

const EMPTY_REVIEW_FORM = {
  rating: 5,
  tagCodes: [] as string[],
  content: '',
};

function toOptionMap(items: Array<{ code: string; name: string }>): Map<string, string> {
  return new Map(items.map((item) => [item.code, item.name]));
}

function toProjectForm(project: ProjectDetailResponse): ProjectFormValues {
  return {
    title: project.title,
    projectTypeCode: project.projectTypeCode,
    serviceRegionCode: project.serviceRegionCode,
    requestedStartAt: project.requestedStartAt.slice(0, 16),
    requestedEndAt: project.requestedEndAt.slice(0, 16),
    serviceAddress: project.serviceAddress,
    serviceDetailAddress: project.serviceDetailAddress ?? '',
    requestDetail: project.requestDetail,
  };
}

function toProjectRequest(form: ProjectFormValues): ProjectCreateRequest {
  return {
    title: form.title.trim(),
    projectTypeCode: form.projectTypeCode,
    serviceRegionCode: form.serviceRegionCode,
    requestedStartAt: form.requestedStartAt,
    requestedEndAt: form.requestedEndAt,
    serviceAddress: form.serviceAddress.trim(),
    serviceDetailAddress: form.serviceDetailAddress.trim() || undefined,
    requestDetail: form.requestDetail.trim(),
  };
}

function mergeProposalDetail(
  proposal: ProposalSummaryResponse,
  detail: ProposalDetailResponse,
): ProposalSummaryResponse {
  if (proposal.proposalId !== detail.proposalId) {
    return proposal;
  }

  return {
    ...proposal,
    proposalStatus: detail.proposalStatus,
    projectStatus: detail.projectStatus,
    respondedAt: detail.respondedAt,
    updatedAt: detail.updatedAt,
  };
}

export default function ProjectPage3() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [projects, setProjects] = useState<ProjectSummaryResponse[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectSummaryResponse[]>([]);
  const [allProjectsPage, setAllProjectsPage] = useState(0);
  const [allProjectsTotalPages, setAllProjectsTotalPages] = useState(0);
  const [allProjectsFilter, setAllProjectsFilter] = useState<StatusFilter>('ALL');
  const [allProjectsUnavailable, setAllProjectsUnavailable] = useState(false);
  const [allProjectsLoading, setAllProjectsLoading] = useState(false);
  const [freelancerProposals, setFreelancerProposals] = useState<ProposalSummaryResponse[]>([]);
  const [myReviews, setMyReviews] = useState<Record<number, ReviewSummaryResponse>>({});
  const [selectedProject, setSelectedProject] = useState<ProjectDetailResponse | null>(null);
  const [selectedProjectProposals, setSelectedProjectProposals] = useState<ProjectProposalSummaryResponse[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewDetailResponse | null>(null);
  const [selectedFreelancerProject, setSelectedFreelancerProject] = useState<ProposalDetailResponse | null>(null);
  const [freelancerProjectLoading, setFreelancerProjectLoading] = useState(false);
  const [freelancerProjectError, setFreelancerProjectError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingProjectId, setReviewingProjectId] = useState<number | null>(null);
  const [reviewingProjectTitle, setReviewingProjectTitle] = useState('');
  const [form, setForm] = useState<ProjectFormValues>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<ProjectFormValues>(EMPTY_FORM);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [projectTypeOptions, setProjectTypeOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [regionOptions, setRegionOptions] = useState<Array<{ code: string; name: string; parentRegionCode?: string | null; regionLevel?: number | null }>>([]);
  const [reviewTagOptions, setReviewTagOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [projectTypeMap, setProjectTypeMap] = useState<Map<string, string>>(new Map());
  const [regionMap, setRegionMap] = useState<Map<string, string>>(new Map());
  const [projectDetailLoading, setProjectDetailLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);

  const filteredProjects = useMemo(
    () => statusFilter === 'ALL' ? projects : projects.filter((project) => project.status === statusFilter),
    [projects, statusFilter],
  );

  const acceptedFreelancerProjects = useMemo(
    () => freelancerProposals.filter((proposal) => proposal.proposalStatus === 'ACCEPTED'),
    [freelancerProposals],
  );

  useEffect(() => {
    const nextUser = getUser();
    if (!nextUser) {
      window.location.href = '/login';
      return;
    }
    if (nextUser.role === 'ROLE_ADMIN') {
      window.location.href = '/mypage';
      return;
    }

    setUser(nextUser);
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const initialize = async () => {
      setLoading(true);
      setError('');

      try {
        const [projectTypes, regions, reviewTags] = await Promise.all([
          getProjectTypeCodes(),
          getRegionCodes(),
          getReviewTagCodes(),
        ]);

        setProjectTypeOptions(projectTypes.map(({ code, name }) => ({ code, name })));
        setRegionOptions(regions.map(({ code, name, parentRegionCode, regionLevel }) => ({ code, name, parentRegionCode, regionLevel })));
        setReviewTagOptions(reviewTags.map(({ code, name }) => ({ code, name })));
        setProjectTypeMap(toOptionMap(projectTypes));
        setRegionMap(toOptionMap(regions));

        if (user.role === 'ROLE_USER') {
          const [projectPage, myReviewPage] = await Promise.all([
            getMyProjects({ page: 0, size: 50 }),
            getMyReviews({ page: 0, size: 100 }),
          ]);

          setProjects(projectPage.content);
          setMyReviews(
            Object.fromEntries(
              myReviewPage.content.map((review) => [review.projectId, review]),
            ),
          );
        } else if (user.role === 'ROLE_FREELANCER') {
          const [proposalPage, myReviewPage] = await Promise.all([
            getMyFreelancerProposals({ page: 0, size: 50 }),
            getMyReviews({ page: 0, size: 100 }),
          ]);
          setFreelancerProposals(proposalPage.content);
          setMyReviews(
            Object.fromEntries(
              myReviewPage.content.map((review) => [review.projectId, review]),
            ),
          );

        }
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, '프로젝트 데이터를 불러오지 못했습니다.'));
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'ROLE_FREELANCER') {
      return;
    }

    const loadAllProjects = async () => {
      setAllProjectsLoading(true);
      setAllProjectsUnavailable(false);

      try {
        const response = await getAllProjects({
          page: allProjectsPage,
          size: ALL_PROJECTS_PAGE_SIZE,
          status: allProjectsFilter === 'ALL' ? undefined : allProjectsFilter,
        });
        setAllProjects(response.content);
        setAllProjectsTotalPages(response.totalPages);
        if (response.page !== allProjectsPage) {
          setAllProjectsPage(response.page);
        }
      } catch {
        setAllProjects([]);
        setAllProjectsTotalPages(0);
        setAllProjectsUnavailable(true);
      } finally {
        setAllProjectsLoading(false);
      }
    };

    void loadAllProjects();
  }, [allProjectsFilter, allProjectsPage, user]);

  async function refreshUserProjects() {
    const response = await getMyProjects({ page: 0, size: 50 });
    setProjects(response.content);
  }

  async function refreshFreelancerProposals() {
    const response = await getMyFreelancerProposals({ page: 0, size: 50 });
    setFreelancerProposals(response.content);
  }

  async function refreshMyReviews() {
    const response = await getMyReviews({ page: 0, size: 100 });
    setMyReviews(Object.fromEntries(response.content.map((review) => [review.projectId, review])));
  }

  const openProjectDetail = useCallback(async (projectId: number) => {
    setProjectDetailLoading(true);
    setError('');

    try {
      const detail = await getProject(projectId);
      setSelectedProject(detail);

      if (user?.role === 'ROLE_USER') {
        const proposals = await getProjectProposals(projectId, { page: 0, size: 20 });
        setSelectedProjectProposals(proposals.content);
      } else {
        setSelectedProjectProposals([]);
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프로젝트 상세를 불러오지 못했습니다.'));
    } finally {
      setProjectDetailLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (loading || user?.role !== 'ROLE_USER') {
      return;
    }

    const projectId = Number(new URLSearchParams(window.location.search).get('projectId'));
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return;
    }

    if (selectedProject?.projectId === projectId) {
      return;
    }

    void openProjectDetail(projectId);
  }, [loading, openProjectDetail, selectedProject?.projectId, user?.role]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMutationLoading(true);
    setCreateError('');

    try {
      await createProject(toProjectRequest(form));
      await refreshUserProjects();
      setForm(EMPTY_FORM);
      setShowCreateModal(false);
    } catch (caughtError) {
      setCreateError(getErrorMessage(caughtError, '프로젝트 생성에 실패했습니다.'));
    } finally {
      setMutationLoading(false);
    }
  }

  function handleEditOpen() {
    if (!selectedProject) {
      return;
    }

    setEditForm(toProjectForm(selectedProject));
    setShowEditModal(true);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }

    setMutationLoading(true);
    setEditError('');

    try {
      const updated = await updateProject(selectedProject.projectId, toProjectRequest(editForm));
      setSelectedProject(updated);
      await refreshUserProjects();
      setShowEditModal(false);
    } catch (caughtError) {
      setEditError(getErrorMessage(caughtError, '프로젝트 수정에 실패했습니다.'));
    } finally {
      setMutationLoading(false);
    }
  }

  async function handleCancelProject(projectId: number) {
    const reason = window.prompt('취소 사유를 입력해 주세요.');
    if (!reason?.trim()) {
      return;
    }

    setMutationLoading(true);
    setError('');

    try {
      await cancelProject(projectId, reason.trim());
      await refreshUserProjects();
      setSelectedProject(null);
      setSelectedProjectProposals([]);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프로젝트 취소에 실패했습니다.'));
    } finally {
      setMutationLoading(false);
    }
  }

  async function openReviewModal() {
    if (!selectedProject) {
      return;
    }

    const existingSummary = myReviews[selectedProject.projectId];
    let existingReview: ReviewDetailResponse | null = null;

    if (existingSummary) {
      existingReview = {
        ...existingSummary,
      };
    }

    setSelectedReview(existingReview);
    setReviewForm(existingReview
      ? { rating: existingReview.rating, tagCodes: existingReview.tagCodes, content: existingReview.content }
      : EMPTY_REVIEW_FORM);
    setShowReviewModal(true);
  }

  async function openFreelancerProjectDetail(proposalId: number) {
    setFreelancerProjectLoading(true);
    setFreelancerProjectError('');

    try {
      const detail = await getMyFreelancerProposal(proposalId);
      setSelectedFreelancerProject(detail);
    } catch (caughtError) {
      setFreelancerProjectError(getErrorMessage(caughtError, '프로젝트 상세를 불러오지 못했습니다.'));
    } finally {
      setFreelancerProjectLoading(false);
    }
  }

  function closeFreelancerProjectDetail() {
    setSelectedFreelancerProject(null);
    setFreelancerProjectError('');
  }

  function openFreelancerReviewModal(projectId: number, projectTitle: string) {
    const existingSummary = myReviews[projectId];
    const existingReview: ReviewDetailResponse | null = existingSummary ? { ...existingSummary } : null;
    setReviewingProjectId(projectId);
    setReviewingProjectTitle(projectTitle);
    setSelectedReview(existingReview);
    setReviewForm(existingReview
      ? { rating: existingReview.rating, tagCodes: existingReview.tagCodes, content: existingReview.content }
      : EMPTY_REVIEW_FORM);
    setShowReviewModal(true);
  }

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMutationLoading(true);
    setError('');

    try {
      if (selectedReview) {
        await updateMyReview(selectedReview.reviewId, reviewForm);
      } else if (user?.role === 'ROLE_FREELANCER' && reviewingProjectId != null) {
        await createRequesterReview(reviewingProjectId, reviewForm);
      } else if (selectedProject) {
        await createProjectReview(selectedProject.projectId, reviewForm);
      }

      await refreshMyReviews();
      setShowReviewModal(false);
      setSelectedReview(null);
      setReviewingProjectId(null);
      setReviewingProjectTitle('');
      setReviewForm(EMPTY_REVIEW_FORM);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '리뷰 저장에 실패했습니다.'));
    } finally {
      setMutationLoading(false);
    }
  }

  async function handleProposalAccept(proposalId: number) {
    setMutationLoading(true);
    setError('');

    try {
      const acceptedProposal = await acceptProposal(proposalId);
      setFreelancerProposals((currentProposals) => (
        currentProposals.map((proposal) => mergeProposalDetail(proposal, acceptedProposal))
      ));
      await refreshFreelancerProposals();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '제안 수락에 실패했습니다.'));
    } finally {
      setMutationLoading(false);
    }
  }

  async function handleProposalReject(proposalId: number) {
    setMutationLoading(true);
    setError('');

    try {
      const rejectedProposal = await rejectProposal(proposalId);
      setFreelancerProposals((currentProposals) => (
        currentProposals.map((proposal) => mergeProposalDetail(proposal, rejectedProposal))
      ));
      await refreshFreelancerProposals();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '제안 거절에 실패했습니다.'));
    } finally {
      setMutationLoading(false);
    }
  }

  async function transitionProposalProject(proposalId: number, nextStatus: 'start' | 'complete') {
    setMutationLoading(true);
    setError('');

    try {
      const proposal = await getMyFreelancerProposal(proposalId);
      if (nextStatus === 'start') {
        await startProject(proposal.projectId);
      } else {
        await completeProject(proposal.projectId);
      }
      await refreshFreelancerProposals();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프로젝트 상태 변경에 실패했습니다.'));
    } finally {
      setMutationLoading(false);
    }
  }

  if (!user) {
    return null;
  }

  const isUser = user.role === 'ROLE_USER';
  const isFreelancer = user.role === 'ROLE_FREELANCER';

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleAllProjectsFilterChange(nextFilter: StatusFilter) {
    setAllProjectsFilter(nextFilter);
    setAllProjectsPage(0);
  }

  function handleAllProjectsPageChange(nextPage: number) {
    if (nextPage < 0 || nextPage >= allProjectsTotalPages) {
      return;
    }
    setAllProjectsPage(nextPage);
  }

  return (
    <div className="project-page">
      <AppHeader activePage="project" />

      <main className="project-content">
        <div className="project-header">
          <div>
            <h1 className="project-title">프로젝트</h1>
            <p className="project-subtitle">
              {isUser && '내 프로젝트를 생성하고 진행 상태를 확인할 수 있습니다.'}
              {isFreelancer && '모든 프로젝트를 열람하고 받은 제안을 검토할 수 있습니다.'}
              {!isUser && !isFreelancer && '관리자 기능은 마이페이지의 관리자 탭에서 확인할 수 있습니다.'}
            </p>
          </div>
          {isUser && (
            <button type="button" className="btn-create" onClick={() => { setForm(EMPTY_FORM); setCreateError(''); setShowCreateModal(true); }}>
              + 새 프로젝트
            </button>
          )}
        </div>

        {error && <p className="login-error">{error}</p>}

        {loading ? (
          <div className="project-empty"><p>데이터를 불러오는 중입니다.</p></div>
        ) : isUser ? (
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
                      : projects.filter((project) => project.status === filter).length}
                  </span>
                </button>
              ))}
            </div>

            {filteredProjects.length === 0 ? (
              <div className="project-empty"><p>조건에 맞는 프로젝트가 없습니다.</p></div>
            ) : (
              <ul className="project-list">
                {filteredProjects.map((project) => (
                  <li
                    key={project.projectId}
                    className="project-card"
                    onClick={() => void openProjectDetail(project.projectId)}
                  >
                    <div className="project-card-top">
                      <span className="project-type-badge">{labelOf(projectTypeMap, project.projectTypeCode)}</span>
                      <span className={`project-status ${STATUS_COLOR[project.status]}`}>
                        {PROJECT_STATUS_LABEL[project.status]}
                      </span>
                    </div>
                    <h3 className="project-card-title">{project.title}</h3>
                    <div className="project-card-meta">
                      <span>일정 {formatDateTime(project.requestedStartAt)}</span>
                      <span>지역 {labelOf(regionMap, project.serviceRegionCode)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : isFreelancer ? (
          <>
            <nav className="project-nav" aria-label="프리랜서 프로젝트 내비게이션">
              <button type="button" className="project-nav-item" onClick={() => scrollToSection('freelancer-all-projects')}>
                전체 프로젝트
              </button>
              <button type="button" className="project-nav-item" onClick={() => scrollToSection('freelancer-active-projects')}>
                참여 프로젝트
              </button>
              <button type="button" className="project-nav-item" onClick={() => scrollToSection('freelancer-proposals')}>
                받은 제안
              </button>
            </nav>

            <section className="project-section" id="freelancer-all-projects">
              <div className="project-header">
                <div>
                  <h2 className="project-title" style={{ fontSize: '1.35rem' }}>전체 프로젝트</h2>
                  <p className="project-subtitle">모든 프로젝트를 열람할 수 있습니다.</p>
                </div>
              </div>

              <div className="filter-bar">
                {(['ALL', ...PROJECT_STATUSES] as StatusFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`filter-chip${allProjectsFilter === filter ? ' active' : ''}`}
                    onClick={() => handleAllProjectsFilterChange(filter)}
                  >
                    {filter === 'ALL' ? '전체' : PROJECT_STATUS_LABEL[filter]}
                  </button>
                ))}
              </div>

              {allProjectsUnavailable ? (
                <div className="project-empty"><p>전체 프로젝트 목록을 불러올 수 없습니다.</p></div>
              ) : allProjectsLoading ? (
                <div className="project-empty"><p>전체 프로젝트를 불러오는 중입니다.</p></div>
              ) : allProjects.length === 0 ? (
                <div className="project-empty"><p>조건에 맞는 프로젝트가 없습니다.</p></div>
              ) : (
                <>
                  <ul className="project-list">
                    {allProjects.map((project) => (
                    <li
                      key={project.projectId}
                      className="project-card"
                      onClick={() => void openProjectDetail(project.projectId)}
                    >
                      <div className="project-card-top">
                        <span className="project-type-badge">{labelOf(projectTypeMap, project.projectTypeCode)}</span>
                        <span className={`project-status ${STATUS_COLOR[project.status]}`}>
                          {PROJECT_STATUS_LABEL[project.status]}
                        </span>
                      </div>
                      <h3 className="project-card-title">{project.title}</h3>
                      <div className="project-card-meta">
                        <span>일정 {formatDateTime(project.requestedStartAt)}</span>
                        <span>지역 {labelOf(regionMap, project.serviceRegionCode)}</span>
                      </div>
                    </li>
                    ))}
                  </ul>

                  {allProjectsTotalPages > 1 && (
                    <div className="project-pagination" aria-label="전체 프로젝트 페이지 이동">
                      <button
                        type="button"
                        className="project-page-btn"
                        disabled={allProjectsPage === 0 || allProjectsLoading}
                        onClick={() => handleAllProjectsPageChange(allProjectsPage - 1)}
                      >
                        이전
                      </button>

                      {Array.from({ length: allProjectsTotalPages }, (_, pageIndex) => pageIndex).map((pageIndex) => (
                        <button
                          key={pageIndex}
                          type="button"
                          className={`project-page-btn${allProjectsPage === pageIndex ? ' active' : ''}`}
                          disabled={allProjectsLoading}
                          onClick={() => handleAllProjectsPageChange(pageIndex)}
                        >
                          {pageIndex + 1}
                        </button>
                      ))}

                      <button
                        type="button"
                        className="project-page-btn"
                        disabled={allProjectsPage >= allProjectsTotalPages - 1 || allProjectsLoading}
                        onClick={() => handleAllProjectsPageChange(allProjectsPage + 1)}
                      >
                        다음
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="project-section" id="freelancer-active-projects">
              <div className="project-header">
                <div>
                  <h2 className="project-title" style={{ fontSize: '1.35rem' }}>참여 프로젝트</h2>
                  <p className="project-subtitle">수락된 프로젝트를 먼저 확인할 수 있습니다.</p>
                </div>
              </div>

              {acceptedFreelancerProjects.length === 0 ? (
                <div className="project-empty"><p>수락된 프로젝트가 없습니다.</p></div>
              ) : (
                <ul className="proposal-list">
                  {acceptedFreelancerProjects.map((proposal) => (
                    <li key={proposal.proposalId} className="proposal-card">
                      <div className="proposal-card-top">
                        <div className="proposal-card-meta">
                          <span className="project-type-badge">참여중</span>
                          <span className={`project-status ${STATUS_COLOR[proposal.projectStatus]}`}>
                            {PROJECT_STATUS_LABEL[proposal.projectStatus]}
                          </span>
                        </div>
                        <span className="proposal-card-date">{formatDateTime(proposal.createdAt)}</span>
                      </div>
                      <h3 className="proposal-card-title">{proposal.projectTitle}</h3>
                      <div className="proposal-card-info">
                        <span>프로젝트 상태: {PROJECT_STATUS_LABEL[proposal.projectStatus]}</span>
                        <span>제안 상태: {PROPOSAL_STATUS_LABEL[proposal.proposalStatus]}</span>
                      </div>
                      <div className="proposal-card-actions">
                        <button
                          type="button"
                          className="proposal-btn proposal-btn--review"
                          disabled={freelancerProjectLoading}
                          onClick={() => void openFreelancerProjectDetail(proposal.proposalId)}
                        >
                          프로젝트 열람
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="project-section" id="freelancer-proposals">
            <ProposalTab
              proposals={freelancerProposals}
              loading={mutationLoading}
              reviewedProjectIds={new Set(Object.keys(myReviews).map(Number))}
              onAccept={(proposalId) => void handleProposalAccept(proposalId)}
              onReject={(proposalId) => void handleProposalReject(proposalId)}
              onStartProject={(proposalId) => void transitionProposalProject(proposalId, 'start')}
              onCompleteProject={(proposalId) => void transitionProposalProject(proposalId, 'complete')}
              onWriteReview={(projectId, projectTitle) => openFreelancerReviewModal(projectId, projectTitle)}
              onViewProject={(proposalId) => void openFreelancerProjectDetail(proposalId)}
            />
            </section>
          </>
        ) : (
          <div className="project-empty">
            <p>관리자 프로젝트 관리 화면은 마이페이지에서 확인해 주세요.</p>
            <a href="/mypage?tab=projects" className="btn-create">관리자 프로젝트 보기</a>
          </div>
        )}
      </main>

      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSelectedProject(null)}>닫기</button>

            {projectDetailLoading ? (
              <p>상세 정보를 불러오는 중입니다.</p>
            ) : (
              <>
                <div className="modal-head">
                  <div className="modal-badges">
                    <span className="project-type-badge">{labelOf(projectTypeMap, selectedProject.projectTypeCode)}</span>
                    <span className={`project-status ${STATUS_COLOR[selectedProject.status]}`}>
                      {PROJECT_STATUS_LABEL[selectedProject.status]}
                    </span>
                  </div>
                  <h2 className="modal-title">{selectedProject.title}</h2>
                </div>

                <ul className="modal-info">
                  <li><span>시작</span><span>{formatDateTime(selectedProject.requestedStartAt)}</span></li>
                  <li><span>종료</span><span>{formatDateTime(selectedProject.requestedEndAt)}</span></li>
                  <li><span>지역</span><span>{labelOf(regionMap, selectedProject.serviceRegionCode)}</span></li>
                  <li><span>주소</span><span>{selectedProject.serviceAddress}</span></li>
                  <li><span>상세 주소</span><span>{selectedProject.serviceDetailAddress || '-'}</span></li>
                  <li><span>생성일</span><span>{formatDateTime(selectedProject.createdAt)}</span></li>
                  {selectedProject.cancelledReason && (
                    <li><span>취소 사유</span><span>{selectedProject.cancelledReason}</span></li>
                  )}
                </ul>

                <div className="modal-desc">
                  <p className="modal-desc-label">요청 상세</p>
                  <p className="modal-desc-text">{selectedProject.requestDetail}</p>
                </div>

                {selectedProjectProposals.length > 0 && (
                  <div className="modal-desc">
                    <p className="modal-desc-label">보낸 제안</p>
                    <ul className="proposal-list">
                      {selectedProjectProposals.map((proposal) => (
                        <li key={proposal.proposalId} className="proposal-card">
                          <div className="proposal-card-top">
                            <div className="proposal-card-meta">
                              <span className="project-type-badge">{proposal.freelancer.name}</span>
                              <span className={`project-status ${STATUS_COLOR[selectedProject.status]}`}>
                                {proposalStatusLabel(proposal.status)}
                              </span>
                            </div>
                            <span className="proposal-card-date">{formatDateTime(proposal.createdAt)}</span>
                          </div>
                          {proposal.message && (
                            <p className="proposal-card-desc">{proposal.message}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="modal-actions">
                  {isUser && selectedProject.status === 'REQUESTED' && (
                    <>
                      <button
                        type="button"
                        className="btn-action btn-edit-project"
                        onClick={handleEditOpen}
                        disabled={mutationLoading}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-cancel"
                        onClick={() => void handleCancelProject(selectedProject.projectId)}
                        disabled={mutationLoading}
                      >
                        프로젝트 취소
                      </button>
                    </>
                  )}
                  {isUser && selectedProject.status === 'COMPLETED' && (
                    <button
                      type="button"
                      className="btn-action btn-review"
                      onClick={() => void openReviewModal()}
                    >
                      {myReviews[selectedProject.projectId] ? '리뷰 수정' : '리뷰 작성'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showEditModal && (
        <ProjectFormModal
          mode="edit"
          form={editForm}
          projectTypeOptions={projectTypeOptions}
          regionOptions={regionOptions}
          error={editError}
          onClose={() => { setShowEditModal(false); setEditError(''); }}
          onSubmit={handleEditSubmit}
          onFieldChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
        />
      )}

      {showCreateModal && (
        <ProjectFormModal
          mode="create"
          form={form}
          projectTypeOptions={projectTypeOptions}
          regionOptions={regionOptions}
          error={createError}
          onClose={() => { setShowCreateModal(false); setCreateError(''); }}
          onSubmit={handleCreate}
          onFieldChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
        />
      )}

      {showReviewModal && (selectedProject || reviewingProjectId != null) && (
        <ReviewModal
          projectTitle={selectedProject?.title ?? reviewingProjectTitle}
          selectedReview={selectedReview}
          reviewForm={reviewForm}
          reviewTags={reviewTagOptions}
          onClose={() => { setShowReviewModal(false); setReviewingProjectId(null); setReviewingProjectTitle(''); }}
          onSubmit={handleReviewSubmit}
          onRatingChange={(rating) => setReviewForm((prev) => ({ ...prev, rating }))}
          onTagToggle={(tagCode) => setReviewForm((prev) => ({
            ...prev,
            tagCodes: prev.tagCodes.includes(tagCode)
              ? prev.tagCodes.filter((value) => value !== tagCode)
              : [...prev.tagCodes, tagCode],
          }))}
          onContentChange={(content) => setReviewForm((prev) => ({ ...prev, content }))}
        />
      )}

      {selectedFreelancerProject && (
        <div className="modal-overlay" onClick={closeFreelancerProjectDetail}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeFreelancerProjectDetail}>닫기</button>

            {freelancerProjectLoading ? (
              <p>상세 정보를 불러오는 중입니다.</p>
            ) : (
              <>
                <div className="modal-head">
                  <div className="modal-badges">
                    <span className="project-type-badge">프리랜서 프로젝트</span>
                    <span className={`project-status ${STATUS_COLOR[selectedFreelancerProject.projectStatus]}`}>
                      {PROJECT_STATUS_LABEL[selectedFreelancerProject.projectStatus]}
                    </span>
                  </div>
                  <h2 className="modal-title">{selectedFreelancerProject.projectTitle}</h2>
                </div>

                <ul className="modal-info">
                  <li><span>제안 상태</span><span>{PROPOSAL_STATUS_LABEL[selectedFreelancerProject.proposalStatus]}</span></li>
                  <li><span>프로젝트 상태</span><span>{PROJECT_STATUS_LABEL[selectedFreelancerProject.projectStatus]}</span></li>
                  <li><span>시작</span><span>{formatDateTime(selectedFreelancerProject.requestedStartAt)}</span></li>
                  <li><span>종료</span><span>{formatDateTime(selectedFreelancerProject.requestedEndAt)}</span></li>
                  <li><span>지역</span><span>{labelOf(regionMap, selectedFreelancerProject.serviceRegionCode)}</span></li>
                  <li><span>주소</span><span>{selectedFreelancerProject.serviceAddress}</span></li>
                  <li><span>상세 주소</span><span>{selectedFreelancerProject.serviceDetailAddress || '-'}</span></li>
                  <li><span>수락 시각</span><span>{formatDateTime(selectedFreelancerProject.projectAcceptedAt)}</span></li>
                </ul>

                <div className="modal-desc">
                  <p className="modal-desc-label">요청 상세</p>
                  <p className="modal-desc-text">{selectedFreelancerProject.requestDetail}</p>
                </div>

                {selectedFreelancerProject.message && (
                  <div className="modal-desc">
                    <p className="modal-desc-label">내 제안 메모</p>
                    <p className="modal-desc-text">{selectedFreelancerProject.message}</p>
                  </div>
                )}
              </>
            )}

            {freelancerProjectError && <p className="login-error">{freelancerProjectError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
