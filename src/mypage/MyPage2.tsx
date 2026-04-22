import { useEffect, useState } from 'react';
import './mypage.css';
import AppHeader from '../components/AppHeader';
import { bootstrapSession, getUser, setUser, type User } from '../store/appAuth';
import { canManageVerification, canModerateReviews, canModifyOwnReview } from '../store/accessControl';
import { resolveApiAssetUrl } from '../api/client';
import {
  approveAdminVerification,
  blindAdminReview,
  cancelAdminProject,
  getAdminDashboard,
  getAdminFreelancer,
  getAdminFreelancers,
  getAdminProject,
  getAdminProjects,
  getAdminReport,
  getAdminReports,
  getAdminReviews,
  getAdminVerification,
  getAdminVerifications,
  rejectAdminReport,
  rejectAdminVerification,
  resolveAdminReport,
  unblindAdminReview,
  updateAdminFreelancerActive,
  updateAdminFreelancerVisibility,
  type AdminDashboardResponse,
  type AdminFreelancerDetailResponse,
  type AdminFreelancerListItemResponse,
  type AdminProjectDetailResponse,
  type AdminProjectSummaryResponse,
  type AdminReportDetailResponse,
  type AdminReportListItemResponse,
  type AdminReviewListItemResponse,
  type AdminVerificationDetailResponse,
  type AdminVerificationListItemResponse,
} from '../api/admin';
import { getAvailableTimeSlotCodes, getProjectTypeCodes, getRegionCodes, type CodeLookupResponse } from '../api/codes';
import {
  createMyFreelancerProfile,
  deleteMyFreelancerFile,
  getMyFreelancerFiles,
  getMyFreelancerProfile,
  updateMyFreelancerProfile,
  uploadMyFreelancerFile,
  type FreelancerDetailResponse,
  type FreelancerFileResponse,
  type FreelancerProfileUpsertRequest,
} from '../api/freelancers';
import { getMyReports, type ReportSummaryResponse } from '../api/reports';
import {
  deleteMyReview,
  getMyReviews,
  getReviewTagCodes,
  updateMyReview,
  type ReviewSummaryResponse,
  type ReviewTagCodeResponse,
} from '../api/reviews';
import {
  createMyVerification,
  deleteVerificationFile,
  getMyVerification,
  getVerificationFiles,
  getMyVerifications,
  uploadVerificationFile,
  type VerificationFileResponse,
  type VerificationResponse,
  type VerificationType,
} from '../api/verifications';
import { getMyPage, updateMyProfile, type UserMyPageResponse } from '../api/users';
import { getErrorMessage } from '../lib/errors';
import { formatDateTime, labelOf } from '../lib/referenceData';
import VerifyTab from './tabs/VerifyTab';
import ReviewsTab from './tabs/ReviewsTab';
import ReportsTab from './tabs/ReportsTab';
import UsageReportTab from './tabs/UsageReportTab';
import type { VerifyStatus } from './tabs/verifyTabShared';

type UserTab = 'account' | 'reviews' | 'reports' | 'certify';
type AdminTab = 'dashboard' | 'freelancers' | 'projects' | 'verify' | 'reports' | 'usage-report';
type Tab = UserTab | AdminTab;

interface ProfileFormState {
  name: string;
  phone: string;
  intro: string;
}

interface FreelancerFormState {
  careerDescription: string;
  caregiverYn: boolean;
  publicYn: boolean;
  activityRegionCodes: string[];
  availableTimeSlotCodes: string[];
  projectTypeCodes: string[];
}

const EMPTY_PROFILE_FORM: ProfileFormState = {
  name: '',
  phone: '',
  intro: '',
};

const EMPTY_FREELANCER_FORM: FreelancerFormState = {
  careerDescription: '',
  caregiverYn: false,
  publicYn: true,
  activityRegionCodes: [],
  availableTimeSlotCodes: [],
  projectTypeCodes: [],
};

const EMPTY_REVIEW_EDITOR = {
  rating: 5,
  tagCodes: [] as string[],
  content: '',
};

function readRequestedTab(): string | null {
  return new URLSearchParams(window.location.search).get('tab');
}

function updateTabQuery(tab: Tab): void {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', tab);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function toFreelancerForm(profile: FreelancerDetailResponse | null): FreelancerFormState {
  if (!profile) {
    return EMPTY_FREELANCER_FORM;
  }

  return {
    careerDescription: profile.careerDescription ?? '',
    caregiverYn: profile.caregiverYn,
    publicYn: profile.publicYn,
    activityRegionCodes: profile.activityRegionCodes,
    availableTimeSlotCodes: profile.availableTimeSlotCodes,
    projectTypeCodes: profile.projectTypeCodes,
  };
}

function toFreelancerRequest(form: FreelancerFormState): FreelancerProfileUpsertRequest {
  return {
    careerDescription: form.careerDescription.trim() || undefined,
    caregiverYn: form.caregiverYn,
    publicYn: form.publicYn,
    activityRegionCodes: form.activityRegionCodes,
    availableTimeSlotCodes: form.availableTimeSlotCodes,
    projectTypeCodes: form.projectTypeCodes,
  };
}

function toggleSelection(values: string[], code: string): string[] {
  return values.includes(code)
    ? values.filter((value) => value !== code)
    : [...values, code];
}

function resolveRequestedTab(user: User | null): Tab {
  const requestedTab = readRequestedTab();

  if (!user) {
    return 'account';
  }

  if (user.role === 'ROLE_ADMIN') {
    const adminTabs: AdminTab[] = ['dashboard', 'freelancers', 'projects', 'verify', 'reports', 'usage-report'];
    return requestedTab && adminTabs.includes(requestedTab as AdminTab)
      ? (requestedTab as AdminTab)
      : 'dashboard';
  }

  const userTabs: UserTab[] = user.role === 'ROLE_FREELANCER'
    ? ['account', 'reviews', 'reports', 'certify']
    : ['account', 'reviews', 'reports'];

  return requestedTab && userTabs.includes(requestedTab as UserTab)
    ? (requestedTab as UserTab)
    : 'account';
}

export default function MyPage2() {
  const [user, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [profileForm, setProfileForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [freelancerForm, setFreelancerForm] = useState<FreelancerFormState>(EMPTY_FREELANCER_FORM);
  const [applyForm, setApplyForm] = useState<FreelancerFormState>(EMPTY_FREELANCER_FORM);
  const [showMateApplyForm, setShowMateApplyForm] = useState(false);
  const [summary, setSummary] = useState<UserMyPageResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewSummaryResponse[]>([]);
  const [reports, setReports] = useState<ReportSummaryResponse[]>([]);
  const [reviewTags, setReviewTags] = useState<ReviewTagCodeResponse[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(EMPTY_REVIEW_EDITOR.rating);
  const [editTagCodes, setEditTagCodes] = useState<string[]>(EMPTY_REVIEW_EDITOR.tagCodes);
  const [editContent, setEditContent] = useState(EMPTY_REVIEW_EDITOR.content);

  const [projectTypeOptions, setProjectTypeOptions] = useState<CodeLookupResponse[]>([]);
  const [regionOptions, setRegionOptions] = useState<CodeLookupResponse[]>([]);
  const [timeSlotOptions, setTimeSlotOptions] = useState<CodeLookupResponse[]>([]);
  const [projectTypeMap, setProjectTypeMap] = useState<Map<string, string>>(new Map());
  const [regionMap, setRegionMap] = useState<Map<string, string>>(new Map());
  const [timeSlotMap, setTimeSlotMap] = useState<Map<string, string>>(new Map());

  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerDetailResponse | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<FreelancerFileResponse[]>([]);
  const [verifications, setVerifications] = useState<VerificationResponse[]>([]);
  const [selectedVerificationId, setSelectedVerificationId] = useState<number | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<VerificationResponse | null>(null);
  const [selectedVerificationFiles, setSelectedVerificationFiles] = useState<VerificationFileResponse[]>([]);
  const [newVerificationType, setNewVerificationType] = useState<VerificationType>('BASIC_IDENTITY');
  const [newVerificationMessage, setNewVerificationMessage] = useState('');

  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardResponse | null>(null);
  const [adminFreelancers, setAdminFreelancers] = useState<AdminFreelancerListItemResponse[]>([]);
  const [selectedAdminFreelancer, setSelectedAdminFreelancer] = useState<AdminFreelancerDetailResponse | null>(null);
  const [adminProjects, setAdminProjects] = useState<AdminProjectSummaryResponse[]>([]);
  const [selectedAdminProject, setSelectedAdminProject] = useState<AdminProjectDetailResponse | null>(null);
  const [adminVerifications, setAdminVerifications] = useState<AdminVerificationListItemResponse[]>([]);
  const [verifyFilter, setVerifyFilter] = useState<VerifyStatus>('ALL');
  const [selectedAdminVerification, setSelectedAdminVerification] = useState<AdminVerificationDetailResponse | null>(null);
  const [adminReviews, setAdminReviews] = useState<AdminReviewListItemResponse[]>([]);
  const [adminReports, setAdminReports] = useState<AdminReportListItemResponse[]>([]);
  const [selectedAdminReport, setSelectedAdminReport] = useState<AdminReportDetailResponse | null>(null);

  useEffect(() => {
    const nextUser = getUser();
    if (!nextUser) {
      window.location.href = '/login';
      return;
    }

    setCurrentUser(nextUser);
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

  useEffect(() => {
    if (!user) {
      return;
    }

    const initialize = async () => {
      setLoading(true);
      setError('');

      try {
        const [projectTypes, regions, timeSlots, tagCodes] = await Promise.all([
          getProjectTypeCodes(),
          getRegionCodes(),
          getAvailableTimeSlotCodes(),
          getReviewTagCodes(),
        ]);

        setProjectTypeOptions(projectTypes);
        setRegionOptions(regions);
        setTimeSlotOptions(timeSlots);
        setReviewTags(tagCodes);
        setProjectTypeMap(new Map(projectTypes.map((item) => [item.code, item.name])));
        setRegionMap(new Map(regions.map((item) => [item.code, item.name])));
        setTimeSlotMap(new Map(timeSlots.map((item) => [item.code, item.name])));

        const isUser = user.role === 'ROLE_USER';
        const [myPageResponse, reviewPage, reportPage] = await Promise.all([
          getMyPage(),
          isUser ? getMyReviews({ page: 0, size: 100 }) : Promise.resolve({ content: [] as typeof reviews }),
          getMyReports({ page: 0, size: 100 }),
        ]);

        setSummary(myPageResponse);
        setReviews(reviewPage.content);
        setReports(reportPage.content);
        setProfileForm({
          name: myPageResponse.user.name,
          phone: myPageResponse.user.phone ?? '',
          intro: myPageResponse.user.intro ?? '',
        });

        if (user.role === 'ROLE_FREELANCER') {
          try {
            const profile = await getMyFreelancerProfile();
            setFreelancerProfile(profile);
            setFreelancerForm(toFreelancerForm(profile));

            const [files, myVerifications] = await Promise.all([
              getMyFreelancerFiles(),
              getMyVerifications(),
            ]);

            setPortfolioFiles(files);
            setVerifications(myVerifications);
          } catch (caughtError) {
            const message = getErrorMessage(caughtError, '');
            if (!message.includes('404')) {
              setError(message);
            }
            setFreelancerProfile(null);
            setFreelancerForm(EMPTY_FREELANCER_FORM);
            setPortfolioFiles([]);
            setVerifications([]);
          }
        }

        if (user.role === 'ROLE_ADMIN') {
          const [
            dashboard,
            freelancerPage,
            projectPage,
            verificationPage,
            reviewPageAdmin,
            reportPageAdmin,
          ] = await Promise.all([
            getAdminDashboard(),
            getAdminFreelancers({ page: 0, size: 50 }),
            getAdminProjects({ page: 0, size: 50 }),
            getAdminVerifications({ page: 0, size: 50 }),
            getAdminReviews({ page: 0, size: 50 }),
            getAdminReports({ page: 0, size: 50 }),
          ]);

          setAdminDashboard(dashboard);
          setAdminFreelancers(freelancerPage.content);
          setAdminProjects(projectPage.content);
          setAdminVerifications(verificationPage.content);
          setAdminReviews(reviewPageAdmin.content);
          setAdminReports(reportPageAdmin.content);
        }
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, '마이페이지 데이터를 불러오지 못했습니다.'));
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [user]);

  async function refreshProfileSummary() {
    const isUser = user?.role === 'ROLE_USER';
    const [myPageResponse, reviewPage, reportPage] = await Promise.all([
      getMyPage(),
      isUser ? getMyReviews({ page: 0, size: 100 }) : Promise.resolve({ content: [] as typeof reviews }),
      getMyReports({ page: 0, size: 100 }),
    ]);

    setSummary(myPageResponse);
    setReviews(reviewPage.content);
    setReports(reportPage.content);
  }

  async function refreshFreelancerWorkspace() {
    if (user?.role !== 'ROLE_FREELANCER') {
      return;
    }

    try {
      const profile = await getMyFreelancerProfile();
      setFreelancerProfile(profile);
      setFreelancerForm(toFreelancerForm(profile));
      const [files, myVerifications] = await Promise.all([
        getMyFreelancerFiles(),
        getMyVerifications(),
      ]);
      setPortfolioFiles(files);
      setVerifications(myVerifications);
    } catch {
      setFreelancerProfile(null);
      setPortfolioFiles([]);
      setVerifications([]);
    }
  }

  async function refreshAdminData() {
    if (user?.role !== 'ROLE_ADMIN') {
      return;
    }

    const [
      dashboard,
      freelancerPage,
      projectPage,
      verificationPage,
      reviewPageAdmin,
      reportPageAdmin,
    ] = await Promise.all([
      getAdminDashboard(),
      getAdminFreelancers({ page: 0, size: 50 }),
      getAdminProjects({ page: 0, size: 50 }),
      getAdminVerifications({ page: 0, size: 50 }),
      getAdminReviews({ page: 0, size: 50 }),
      getAdminReports({ page: 0, size: 50 }),
    ]);

    setAdminDashboard(dashboard);
    setAdminFreelancers(freelancerPage.content);
    setAdminProjects(projectPage.content);
    setAdminVerifications(verificationPage.content);
    setAdminReviews(reviewPageAdmin.content);
    setAdminReports(reportPageAdmin.content);
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    updateTabQuery(tab);
  }

  function startEditReview(review: ReviewSummaryResponse) {
    setEditingReviewId(review.reviewId);
    setEditRating(review.rating);
    setEditTagCodes(review.tagCodes);
    setEditContent(review.content);
  }

  async function handleAccountSave() {
    if (!user) {
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const updated = await updateMyProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || undefined,
        intro: profileForm.intro.trim() || undefined,
      });

      const updatedUser: User = {
        ...user,
        name: updated.name,
        phone: updated.phone ?? undefined,
        intro: updated.intro ?? undefined,
        bio: updated.intro ?? undefined,
        active: updated.active,
      };

      setUser(updatedUser);
      setCurrentUser(updatedUser);
      await refreshProfileSummary();
      setNotice('계정 정보를 저장했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '계정 정보 저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyAsFreelancer() {
    if (!showMateApplyForm) {
      setShowMateApplyForm(true);
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const createdProfile = await createMyFreelancerProfile(toFreelancerRequest(applyForm));
      setNotice('프리랜서 프로필 정보를 동기화하는 중입니다.');
      const nextUser = await bootstrapSession(true);
      const syncedUser = nextUser ?? {
        ...user!,
        role: 'ROLE_FREELANCER' as const,
        roleCode: 'ROLE_FREELANCER' as const,
      };

      setUser(syncedUser);
      setCurrentUser(syncedUser);
      setFreelancerProfile(createdProfile);
      setFreelancerForm(toFreelancerForm(createdProfile));
      setApplyForm(EMPTY_FREELANCER_FORM);
      setShowMateApplyForm(false);
      setPortfolioFiles([]);
      setVerifications(await getMyVerifications());
      await refreshProfileSummary();
      handleTabChange('certify');
      setNotice('프리랜서 프로필 신청이 완료되었습니다. 인증 요청을 등록해 주세요.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '메이트 신청에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleFreelancerProfileSave() {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (freelancerProfile) {
        await updateMyFreelancerProfile(toFreelancerRequest(freelancerForm));
      } else {
        await createMyFreelancerProfile(toFreelancerRequest(freelancerForm));
      }

      await refreshFreelancerWorkspace();
      await refreshProfileSummary();
      setNotice('프리랜서 프로필을 저장했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프리랜서 프로필 저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePortfolioUpload(file: File | null) {
    if (!file) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await uploadMyFreelancerFile(file);
      await refreshFreelancerWorkspace();
      setNotice('포트폴리오 파일을 업로드했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '포트폴리오 업로드에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePortfolioDelete(fileId: number) {
    setSaving(true);
    setError('');

    try {
      await deleteMyFreelancerFile(fileId);
      await refreshFreelancerWorkspace();
      setNotice('포트폴리오 파일을 삭제했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '포트폴리오 파일 삭제에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateVerification() {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const created = await createMyVerification({
        type: newVerificationType,
        requestMessage: newVerificationMessage.trim() || undefined,
      });
      setSelectedVerificationId(created.verificationId);
      setNewVerificationMessage('');
      await refreshFreelancerWorkspace();
      await handleVerificationSelect(created.verificationId, true);
      setNotice('인증 요청을 등록했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 요청 등록에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleVerificationSelect(verificationId: number, forceOpen = false) {
    if (!forceOpen && selectedVerificationId === verificationId) {
      setSelectedVerificationId(null);
      setSelectedVerification(null);
      setSelectedVerificationFiles([]);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const [verification, files] = await Promise.all([
        getMyVerification(verificationId),
        getVerificationFiles(verificationId),
      ]);

      setSelectedVerificationId(verificationId);
      setSelectedVerification(verification);
      setSelectedVerificationFiles(files);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 요청 상세를 불러오지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleVerificationFileUpload(file: File | null) {
    if (!file || !selectedVerificationId) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await uploadVerificationFile(selectedVerificationId, file);
      await handleVerificationSelect(selectedVerificationId, true);
      await refreshFreelancerWorkspace();
      setNotice('인증 파일을 업로드했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 파일 업로드에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleVerificationFileDelete(fileId: number) {
    if (!selectedVerificationId) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await deleteVerificationFile(fileId);
      await handleVerificationSelect(selectedVerificationId, true);
      await refreshFreelancerWorkspace();
      setNotice('인증 파일을 삭제했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 파일 삭제에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  function handleEditTagToggle(tagCode: string) {
    setEditTagCodes((current) => toggleSelection(current, tagCode));
  }

  async function handleReviewUpdate(reviewId: number) {
    const target = reviews.find((review) => review.reviewId === reviewId);
    if (!target || !canModifyOwnReview(user, { reviewerUserId: target.reviewerUserId })) {
      window.location.href = '/error?code=403';
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateMyReview(reviewId, {
        rating: editRating,
        tagCodes: editTagCodes,
        content: editContent,
      });

      setEditingReviewId(null);
      await refreshProfileSummary();
      setNotice('리뷰를 수정했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '리뷰 수정에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleReviewDelete(reviewId: number) {
    const target = reviews.find((review) => review.reviewId === reviewId);
    if (!target || !canModifyOwnReview(user, { reviewerUserId: target.reviewerUserId })) {
      window.location.href = '/error?code=403';
      return;
    }

    setSaving(true);
    setError('');

    try {
      await deleteMyReview(reviewId);
      setEditingReviewId(null);
      await refreshProfileSummary();
      setNotice('리뷰를 삭제했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '리뷰 삭제에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAdminFreelancer(freelancerProfileId: number) {
    if (selectedAdminFreelancer?.freelancerProfileId === freelancerProfileId) {
      setSelectedAdminFreelancer(null);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const detail = await getAdminFreelancer(freelancerProfileId);
      setSelectedAdminFreelancer(detail);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프리랜서 상세를 불러오지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAdminFreelancerVisibility(freelancerProfileId: number, publicYn: boolean) {
    setSaving(true);
    setError('');

    try {
      await updateAdminFreelancerVisibility(freelancerProfileId, !publicYn);
      await refreshAdminData();
      if (selectedAdminFreelancer?.freelancerProfileId === freelancerProfileId) {
        const detail = await getAdminFreelancer(freelancerProfileId);
        setSelectedAdminFreelancer(detail);
      }
      setNotice('프리랜서 공개 여부를 변경했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프리랜서 공개 여부 변경에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAdminFreelancerActive(freelancerProfileId: number, activeYn: boolean) {
    setSaving(true);
    setError('');

    try {
      await updateAdminFreelancerActive(freelancerProfileId, !activeYn);
      await refreshAdminData();
      if (selectedAdminFreelancer?.freelancerProfileId === freelancerProfileId) {
        const detail = await getAdminFreelancer(freelancerProfileId);
        setSelectedAdminFreelancer(detail);
      }
      setNotice('프리랜서 활성 상태를 변경했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프리랜서 활성 상태 변경에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAdminProject(projectId: number) {
    if (selectedAdminProject?.projectId === projectId) {
      setSelectedAdminProject(null);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const detail = await getAdminProject(projectId);
      setSelectedAdminProject(detail);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프로젝트 상세를 불러오지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelAdminProject(projectId: number) {
    const reason = window.prompt('취소 사유를 입력하세요.');
    if (!reason?.trim()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await cancelAdminProject(projectId, reason.trim());
      await refreshAdminData();
      if (selectedAdminProject?.projectId === projectId) {
        const detail = await getAdminProject(projectId);
        setSelectedAdminProject(detail);
      }
      setNotice('프로젝트를 취소했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프로젝트 취소에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAdminVerification(verificationId: number) {
    if (selectedAdminVerification?.verificationId === verificationId) {
      setSelectedAdminVerification(null);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const detail = await getAdminVerification(verificationId);
      setSelectedAdminVerification(detail);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 요청 상세를 불러오지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleApproveVerification(verificationId: number) {
    if (!canManageVerification(user)) {
      window.location.href = '/error?code=403';
      return;
    }

    setSaving(true);
    setError('');

    try {
      await approveAdminVerification(verificationId);
      await refreshAdminData();
      setSelectedAdminVerification(null);
      setNotice('인증 요청을 승인했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 승인에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRejectVerification(verificationId: number) {
    if (!canManageVerification(user)) {
      window.location.href = '/error?code=403';
      return;
    }

    const reviewComment = window.prompt('반려 사유를 입력하세요.');
    if (!reviewComment?.trim()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await rejectAdminVerification(verificationId, reviewComment.trim());
      await refreshAdminData();
      setSelectedAdminVerification(null);
      setNotice('인증 요청을 반려했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 반려에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAdminBlindToggle(reviewId: number, blindedYn: boolean) {
    if (!canModerateReviews(user)) {
      window.location.href = '/error?code=403';
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (blindedYn) {
        await unblindAdminReview(reviewId);
      } else {
        const reason = window.prompt('블라인드 사유를 입력하세요.')?.trim() || '관리자 조치';
        await blindAdminReview(reviewId, reason);
      }

      await refreshAdminData();
      setNotice('리뷰 노출 상태를 변경했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '리뷰 상태 변경에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAdminReport(reportId: number) {
    if (selectedAdminReport?.reportId === reportId) {
      setSelectedAdminReport(null);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const detail = await getAdminReport(reportId);
      setSelectedAdminReport(detail);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '신고 상세를 불러오지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleResolveAdminReport(reportId: number) {
    setSaving(true);
    setError('');

    try {
      await resolveAdminReport(reportId);
      await refreshAdminData();
      setSelectedAdminReport(null);
      setNotice('신고를 승인 처리했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '신고 승인 처리에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRejectAdminReport(reportId: number) {
    setSaving(true);
    setError('');

    try {
      await rejectAdminReport(reportId);
      await refreshAdminData();
      setSelectedAdminReport(null);
      setNotice('신고를 반려 처리했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '신고 반려 처리에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  if (!user || loading) {
    return (
      <div className="mypage">
        <AppHeader activePage="mypage" />
        <main className="mypage-content">
          <p className="empty-msg">마이페이지를 준비하는 중입니다.</p>
        </main>
      </div>
    );
  }

  const isAdmin = user.role === 'ROLE_ADMIN';
  const isFreelancer = user.role === 'ROLE_FREELANCER';

  return (
    <div className="mypage">
      <AppHeader activePage="mypage" />

      <main className="mypage-content">
        <div className="profile-section">
          <div className="avatar-wrap">
            <span className="avatar-initial">{user.name[0].toUpperCase()}</span>
          </div>
          <div className="profile-info">
            <h1 className="username">{user.name}</h1>
            <p className="email">{user.email}</p>
            <div className="profile-badges">
              <span className={`role-badge role-badge--${user.role.toLowerCase().replace('role_', '')}`}>{user.role}</span>
              {summary?.freelancerProfile?.verifiedYn && <span className="verified-badge">인증 프로필</span>}
            </div>
          </div>
        </div>

        {error && <p className="login-error">{error}</p>}
        {notice && <p className="login-success">{notice}</p>}

        <div className="tab-bar">
          {!isAdmin && (
            <>
              <button className={`tab-btn${activeTab === 'account' ? ' active' : ''}`} onClick={() => handleTabChange('account')}>계정 정보</button>
              <button className={`tab-btn${activeTab === 'reviews' ? ' active' : ''}`} onClick={() => handleTabChange('reviews')}>리뷰</button>
              <button className={`tab-btn${activeTab === 'reports' ? ' active' : ''}`} onClick={() => handleTabChange('reports')}>신고</button>
              {isFreelancer && (
                <button className={`tab-btn${activeTab === 'certify' ? ' active' : ''}`} onClick={() => handleTabChange('certify')}>인증/포트폴리오</button>
              )}
            </>
          )}

          {isAdmin && (
            <>
              <button className={`tab-btn${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => handleTabChange('dashboard')}>대시보드</button>
              <button className={`tab-btn${activeTab === 'freelancers' ? ' active' : ''}`} onClick={() => handleTabChange('freelancers')}>프리랜서</button>
              <button className={`tab-btn${activeTab === 'projects' ? ' active' : ''}`} onClick={() => handleTabChange('projects')}>프로젝트</button>
              <button className={`tab-btn${activeTab === 'verify' ? ' active' : ''}`} onClick={() => handleTabChange('verify')}>인증 심사</button>
              <button className={`tab-btn${activeTab === 'reports' ? ' active' : ''}`} onClick={() => handleTabChange('reports')}>리뷰/신고</button>
              <button className={`tab-btn${activeTab === 'usage-report' ? ' active' : ''}`} onClick={() => handleTabChange('usage-report')}>운영 리포트</button>
            </>
          )}
        </div>

        {activeTab === 'account' && !isAdmin && (
          <div className="account-card">
            <div className="account-card-head">
              <h2>계정 정보</h2>
              <button className="btn-edit" onClick={() => void handleAccountSave()} disabled={saving}>저장</button>
            </div>

            <div className="account-edit-form">
              <div className="account-field">
                <label>이름</label>
                <input className="account-input" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="account-field account-field--readonly">
                <label>이메일</label>
                <span>{user.email}</span>
              </div>
              <div className="account-field">
                <label>전화번호</label>
                <input className="account-input" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
              </div>
              <div className="account-field">
                <label>소개</label>
                <textarea className="account-textarea" rows={4} value={profileForm.intro} onChange={(event) => setProfileForm((current) => ({ ...current, intro: event.target.value }))} />
              </div>
            </div>

            {summary && (
              <div className="admin-grid" style={{ marginTop: '1.5rem' }}>
                <div className="metric-card">
                  <span className="metric-label">총 프로젝트</span>
                  <strong className="metric-value">{summary.projectStats.totalProjects}</strong>
                </div>
                <div className="metric-card">
                  <span className="metric-label">완료 프로젝트</span>
                  <strong className="metric-value">{summary.projectStats.completedProjects}</strong>
                </div>
                <div className="metric-card">
                  <span className="metric-label">작성 리뷰</span>
                  <strong className="metric-value">{summary.reviewStats.writtenReviewCount}</strong>
                </div>
                <div className="metric-card">
                  <span className="metric-label">미읽음 알림</span>
                  <strong className="metric-value">{summary.notificationSummary.unreadNotificationCount}</strong>
                </div>
              </div>
            )}

            {!isFreelancer && (
              <div className="account-card" style={{ marginTop: '1.5rem' }}>
                <div className="account-card-head">
                  <h2>메이트 신청</h2>
                  <button className="btn-edit" onClick={() => setShowMateApplyForm((current) => !current)} disabled={saving}>
                    {showMateApplyForm ? '접기' : '신청하기'}
                  </button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  메이트로 등록하면 돌봄 서비스를 제공하고 의뢰를 받을 수 있습니다. 아래 정보를 입력하고 신청하세요.
                </p>

                {showMateApplyForm && (
                <div className="account-edit-form">
                  <div className="account-field">
                    <label>경력 소개</label>
                    <textarea
                      className="account-textarea"
                      rows={4}
                      placeholder="본인의 경력이나 돌봄 경험을 간략히 소개해 주세요"
                      value={applyForm.careerDescription}
                      onChange={(event) => setApplyForm((current) => ({ ...current, careerDescription: event.target.value }))}
                    />
                  </div>
                  <div className="account-field">
                    <label>프로필 공개 설정</label>
                    <div className="type-selector">
                      <button
                        type="button"
                        className={`type-btn${applyForm.publicYn ? ' selected' : ''}`}
                        onClick={() => setApplyForm((current) => ({ ...current, publicYn: !current.publicYn }))}
                      >
                        {applyForm.publicYn ? '공개' : '비공개'}
                      </button>
                      <button
                        type="button"
                        className={`type-btn${applyForm.caregiverYn ? ' selected' : ''}`}
                        onClick={() => setApplyForm((current) => ({ ...current, caregiverYn: !current.caregiverYn }))}
                      >
                        {applyForm.caregiverYn ? '요양보호사' : '일반 활동자'}
                      </button>
                    </div>
                  </div>
                  <div className="account-field">
                    <label>활동 지역 (복수 선택)</label>
                    <div className="type-selector">
                      {regionOptions.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          className={`type-btn${applyForm.activityRegionCodes.includes(option.code) ? ' selected' : ''}`}
                          onClick={() => setApplyForm((current) => ({
                            ...current,
                            activityRegionCodes: toggleSelection(current.activityRegionCodes, option.code),
                          }))}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="account-field">
                    <label>가능 시간대 (복수 선택)</label>
                    <div className="type-selector">
                      {timeSlotOptions.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          className={`type-btn${applyForm.availableTimeSlotCodes.includes(option.code) ? ' selected' : ''}`}
                          onClick={() => setApplyForm((current) => ({
                            ...current,
                            availableTimeSlotCodes: toggleSelection(current.availableTimeSlotCodes, option.code),
                          }))}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="account-field">
                    <label>제공 서비스 유형 (복수 선택)</label>
                    <div className="type-selector">
                      {projectTypeOptions.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          className={`type-btn${applyForm.projectTypeCodes.includes(option.code) ? ' selected' : ''}`}
                          onClick={() => setApplyForm((current) => ({
                            ...current,
                            projectTypeCodes: toggleSelection(current.projectTypeCodes, option.code),
                          }))}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => void handleApplyAsFreelancer()}
                    disabled={saving}
                  >
                    제출하기
                  </button>
                </div>
                )}
              </div>
            )}

            {isFreelancer && (
              <div className="account-card" style={{ marginTop: '1.5rem' }}>
                <div className="account-card-head">
                  <h2>프리랜서 프로필</h2>
                  <button className="btn-edit" onClick={() => void handleFreelancerProfileSave()} disabled={saving}>저장</button>
                </div>

                <div className="account-edit-form">
                  <div className="account-field">
                    <label>경력 설명</label>
                    <textarea
                      className="account-textarea"
                      rows={4}
                      value={freelancerForm.careerDescription}
                      onChange={(event) => setFreelancerForm((current) => ({ ...current, careerDescription: event.target.value }))}
                    />
                  </div>
                  <div className="account-field">
                    <label>공개 설정</label>
                    <div className="type-selector">
                      <button type="button" className={`type-btn${freelancerForm.publicYn ? ' selected' : ''}`} onClick={() => setFreelancerForm((current) => ({ ...current, publicYn: !current.publicYn }))}>
                        {freelancerForm.publicYn ? '공개중' : '비공개'}
                      </button>
                      <button type="button" className={`type-btn${freelancerForm.caregiverYn ? ' selected' : ''}`} onClick={() => setFreelancerForm((current) => ({ ...current, caregiverYn: !current.caregiverYn }))}>
                        {freelancerForm.caregiverYn ? '요양보호사' : '일반 활동자'}
                      </button>
                    </div>
                  </div>
                  <div className="account-field">
                    <label>활동 지역</label>
                    <div className="type-selector">
                      {regionOptions.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          className={`type-btn${freelancerForm.activityRegionCodes.includes(option.code) ? ' selected' : ''}`}
                          onClick={() => setFreelancerForm((current) => ({
                            ...current,
                            activityRegionCodes: toggleSelection(current.activityRegionCodes, option.code),
                          }))}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="account-field">
                    <label>가능 시간대</label>
                    <div className="type-selector">
                      {timeSlotOptions.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          className={`type-btn${freelancerForm.availableTimeSlotCodes.includes(option.code) ? ' selected' : ''}`}
                          onClick={() => setFreelancerForm((current) => ({
                            ...current,
                            availableTimeSlotCodes: toggleSelection(current.availableTimeSlotCodes, option.code),
                          }))}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="account-field">
                    <label>서비스 유형</label>
                    <div className="type-selector">
                      {projectTypeOptions.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          className={`type-btn${freelancerForm.projectTypeCodes.includes(option.code) ? ' selected' : ''}`}
                          onClick={() => setFreelancerForm((current) => ({
                            ...current,
                            projectTypeCodes: toggleSelection(current.projectTypeCodes, option.code),
                          }))}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && !isAdmin && (
          <ReviewsTab
            reviews={reviews}
            editingReviewId={editingReviewId}
            editRating={editRating}
            editTagCodes={editTagCodes}
            editContent={editContent}
            reviewTags={reviewTags}
            canEdit
            setEditingReviewId={setEditingReviewId}
            setEditRating={setEditRating}
            setEditContent={setEditContent}
            handleEditTagToggle={handleEditTagToggle}
            handleReviewUpdate={(reviewId) => void handleReviewUpdate(reviewId)}
            handleReviewDelete={(reviewId) => void handleReviewDelete(reviewId)}
            startEditReview={startEditReview}
          />
        )}

        {activeTab === 'reports' && !isAdmin && (
          <ReportsTab mode="user" reports={reports} />
        )}

        {activeTab === 'certify' && isFreelancer && (
          <div className="tab-content">
            <div className="account-card">
              <div className="account-card-head">
                <h2>포트폴리오</h2>
                <label className="btn-edit">
                  파일 업로드
                  <input hidden type="file" onChange={(event) => void handlePortfolioUpload(event.target.files?.[0] ?? null)} />
                </label>
              </div>
              {portfolioFiles.length === 0 ? (
                <p className="empty-msg">등록된 포트폴리오 파일이 없습니다.</p>
              ) : (
                <ul className="admin-list">
                  {portfolioFiles.map((file) => (
                    <li key={file.fileId} className="admin-item">
                      <div>
                        <strong>{file.originalFilename}</strong>
                        <p className="admin-subtext">{formatDateTime(file.uploadedAt)}</p>
                      </div>
                      <div className="admin-item-right">
                        <a className="btn-edit" href={resolveApiAssetUrl(file.viewUrl)} target="_blank" rel="noreferrer">보기</a>
                        <a className="btn-edit" href={resolveApiAssetUrl(file.downloadUrl)}>다운로드</a>
                        <button className="btn-cancel" onClick={() => void handlePortfolioDelete(file.fileId)}>삭제</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="account-card" style={{ marginTop: '1.5rem' }}>
              <div className="account-card-head">
                <h2>인증 요청</h2>
                <button className="btn-edit" onClick={() => void handleCreateVerification()} disabled={saving}>등록</button>
              </div>
              <div className="account-edit-form">
                <div className="account-field">
                  <label>인증 유형</label>
                  <select className="account-input" value={newVerificationType} onChange={(event) => setNewVerificationType(event.target.value as VerificationType)}>
                    <option value="BASIC_IDENTITY">기본 신원</option>
                    <option value="LICENSE">자격증</option>
                    <option value="CAREGIVER">요양보호사</option>
                  </select>
                </div>
                <div className="account-field">
                  <label>요청 메시지</label>
                  <textarea className="account-textarea" rows={4} value={newVerificationMessage} onChange={(event) => setNewVerificationMessage(event.target.value)} />
                </div>
              </div>

              <ul className="verify-list">
                {verifications.map((verification) => (
                  <li key={verification.verificationId} className="verify-item">
                    <div className="verify-info">
                      <div className="verify-name">{verification.type}</div>
                      <div className="verify-email">{formatDateTime(verification.requestedAt)}</div>
                    </div>
                    <div className="verify-right">
                      <span className={`verify-status verify-status--${verification.status.toLowerCase()}`}>{verification.status}</span>
                      <button className="verify-btn verify-btn--detail" onClick={() => void handleVerificationSelect(verification.verificationId)}>
                        {selectedVerificationId === verification.verificationId ? '닫기' : '상세'}
                      </button>
                    </div>
                  </li>
                ))}
                {verifications.length === 0 && <p className="empty-msg">등록된 인증 요청이 없습니다.</p>}
              </ul>
            </div>

            {selectedVerification && (
              <div className="account-card" style={{ marginTop: '1.5rem' }}>
                <div className="account-card-head">
                  <h2>인증 파일 관리</h2>
                  <label className="btn-edit">
                    파일 업로드
                    <input hidden type="file" onChange={(event) => void handleVerificationFileUpload(event.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <ul className="account-info-list">
                  <li><span>유형</span><span>{selectedVerification.type}</span></li>
                  <li><span>상태</span><span>{selectedVerification.status}</span></li>
                  <li><span>요청일</span><span>{formatDateTime(selectedVerification.requestedAt)}</span></li>
                  <li><span>반려 사유</span><span>{selectedVerification.rejectReason || '-'}</span></li>
                </ul>
                {selectedVerificationFiles.length === 0 ? (
                  <p className="empty-msg">첨부 파일이 없습니다.</p>
                ) : (
                  <ul className="admin-list">
                    {selectedVerificationFiles.map((file) => (
                      <li key={file.verificationFileId} className="admin-item">
                        <div>
                          <strong>{file.originalFilename}</strong>
                          <p className="admin-subtext">{formatDateTime(file.uploadedAt)}</p>
                        </div>
                        <div className="admin-item-right">
                          <a className="btn-edit" href={resolveApiAssetUrl(file.viewUrl)} target="_blank" rel="noreferrer">보기</a>
                          <a className="btn-edit" href={resolveApiAssetUrl(file.downloadUrl)}>다운로드</a>
                          <button className="btn-cancel" onClick={() => void handleVerificationFileDelete(file.verificationFileId)}>삭제</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && isAdmin && adminDashboard && (
          <div className="tab-content">
            <div className="admin-grid">
              <div className="metric-card">
                <span className="metric-label">전체 사용자</span>
                <strong className="metric-value">{adminDashboard.totalUsers}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">프리랜서</span>
                <strong className="metric-value">{adminDashboard.totalFreelancers}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">대기 검증</span>
                <strong className="metric-value">{adminDashboard.pendingVerifications}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">미처리 신고</span>
                <strong className="metric-value">{adminDashboard.pendingReports}</strong>
              </div>
            </div>

            <div className="admin-list" style={{ marginTop: '1.5rem' }}>
              {adminDashboard.recentProjects.map((project) => (
                <div key={project.projectId} className="admin-item">
                  <div>
                    <strong>{project.title}</strong>
                    <p className="admin-subtext">작성자 {project.ownerName}</p>
                  </div>
                  <span className="admin-subtext">{project.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'freelancers' && isAdmin && (
          <div className="tab-content">
            <ul className="admin-list">
              {adminFreelancers.map((freelancer) => (
                <li key={freelancer.freelancerProfileId} className="admin-item">
                  <div>
                    <strong>{freelancer.name}</strong>
                    <p className="admin-subtext">{freelancer.email}</p>
                  </div>
                  <div className="admin-item-right">
                    <span className="skill-tag">{freelancer.verifiedYn ? '검증완료' : '미검증'}</span>
                    <button className="btn-edit" onClick={() => void handleSelectAdminFreelancer(freelancer.freelancerProfileId)}>상세</button>
                    <button className="btn-edit" onClick={() => void handleToggleAdminFreelancerVisibility(freelancer.freelancerProfileId, freelancer.publicYn)}>
                      {freelancer.publicYn ? '비공개' : '공개'}
                    </button>
                    <button className="btn-cancel" onClick={() => void handleToggleAdminFreelancerActive(freelancer.freelancerProfileId, freelancer.activeYn)}>
                      {freelancer.activeYn ? '비활성' : '활성'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {selectedAdminFreelancer && (
              <div className="account-card" style={{ marginTop: '1.5rem' }}>
                <h2>{selectedAdminFreelancer.name}</h2>
                <ul className="account-info-list">
                  <li><span>이메일</span><span>{selectedAdminFreelancer.email}</span></li>
                  <li><span>공개 여부</span><span>{selectedAdminFreelancer.publicYn ? '공개' : '비공개'}</span></li>
                  <li><span>활성 여부</span><span>{selectedAdminFreelancer.activeYn ? '활성' : '비활성'}</span></li>
                  <li><span>평점</span><span>{selectedAdminFreelancer.averageRating ?? '-'}</span></li>
                  <li><span>활동 지역</span><span>{selectedAdminFreelancer.activityRegionCodes.map((code) => labelOf(regionMap, code)).join(', ') || '-'}</span></li>
                  <li><span>가능 시간대</span><span>{selectedAdminFreelancer.availableTimeSlotCodes.map((code) => labelOf(timeSlotMap, code)).join(', ') || '-'}</span></li>
                  <li><span>서비스 유형</span><span>{selectedAdminFreelancer.projectTypeCodes.map((code) => labelOf(projectTypeMap, code)).join(', ') || '-'}</span></li>
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && isAdmin && (
          <div className="tab-content">
            <ul className="admin-list">
              {adminProjects.map((project) => (
                <li key={project.projectId} className="admin-item">
                  <div>
                    <strong>{project.title}</strong>
                    <p className="admin-subtext">{project.owner.name} / {project.projectTypeCode}</p>
                  </div>
                  <div className="admin-item-right">
                    <span className="skill-tag">{project.status}</span>
                    <button className="btn-edit" onClick={() => void handleSelectAdminProject(project.projectId)}>상세</button>
                    <button className="btn-cancel" onClick={() => void handleCancelAdminProject(project.projectId)}>취소</button>
                  </div>
                </li>
              ))}
            </ul>

            {selectedAdminProject && (
              <div className="account-card" style={{ marginTop: '1.5rem' }}>
                <h2>{selectedAdminProject.title}</h2>
                <ul className="account-info-list">
                  <li><span>상태</span><span>{selectedAdminProject.status}</span></li>
                  <li><span>작성자</span><span>{selectedAdminProject.owner.name}</span></li>
                  <li><span>지역</span><span>{labelOf(regionMap, selectedAdminProject.serviceRegionCode)}</span></li>
                  <li><span>주소</span><span>{selectedAdminProject.serviceAddress}</span></li>
                  <li><span>일정</span><span>{formatDateTime(selectedAdminProject.requestedStartAt)} ~ {formatDateTime(selectedAdminProject.requestedEndAt)}</span></li>
                  <li><span>수락 프리랜서</span><span>{selectedAdminProject.acceptedProposal?.freelancer.name || '-'}</span></li>
                  <li><span>취소 사유</span><span>{selectedAdminProject.cancelledReason || '-'}</span></li>
                </ul>
                <p className="review-content">{selectedAdminProject.requestDetail}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'verify' && isAdmin && (
          <VerifyTab
            verifications={adminVerifications}
            verifyFilter={verifyFilter}
            setVerifyFilter={setVerifyFilter}
            selectedVerification={selectedAdminVerification}
            onSelectVerification={(verificationId) => void handleSelectAdminVerification(verificationId)}
            onApproveVerification={(verificationId) => void handleApproveVerification(verificationId)}
            onRejectVerification={(verificationId) => void handleRejectVerification(verificationId)}
          />
        )}

        {activeTab === 'reports' && isAdmin && (
          <ReportsTab
            mode="admin"
            reviews={adminReviews}
            reports={adminReports}
            selectedReport={selectedAdminReport}
            onBlindToggle={(reviewId, blindedYn) => void handleAdminBlindToggle(reviewId, blindedYn)}
            onSelectReport={(reportId) => void handleSelectAdminReport(reportId)}
            onResolveReport={(reportId) => void handleResolveAdminReport(reportId)}
            onRejectReport={(reportId) => void handleRejectAdminReport(reportId)}
          />
        )}

        {activeTab === 'usage-report' && isAdmin && (
          <UsageReportTab
            dashboard={adminDashboard}
            freelancers={adminFreelancers}
            projects={adminProjects}
            reviews={adminReviews}
            reports={adminReports}
          />
        )}
      </main>
    </div>
  );
}

