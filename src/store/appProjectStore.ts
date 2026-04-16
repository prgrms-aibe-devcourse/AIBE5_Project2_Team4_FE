import { removeProposalsByProjectId } from './appProposalStore';

export type ProjectType = 'HOSPITAL' | 'GOVERNMENT' | 'OUTING' | 'DAILY' | 'OTHER';
export type ProjectStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: number;
  title: string;
  type: ProjectType;
  date: string;
  time: string;
  location: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  requesterName: string;
  requesterEmail: string;
  freelancerId?: number;
  freelancerName?: string;
  freelancerEmail?: string;
}

export interface CreateProjectInput {
  title: string;
  type: ProjectType;
  date: string;
  time: string;
  location: string;
  description: string;
  requesterName: string;
  requesterEmail: string;
}

const PROJECTS_KEY = 'stella_projects';

const DEFAULT_PROJECTS: Project[] = [
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
    requesterName: '보호자',
    requesterEmail: 'user@stella.ai',
    freelancerId: 1,
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
    requesterName: '보호자',
    requesterEmail: 'user@stella.ai',
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
    requesterName: '보호자',
    requesterEmail: 'user@stella.ai',
    freelancerId: 1,
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
    requesterName: '보호자',
    requesterEmail: 'user@stella.ai',
    freelancerId: 1,
    freelancerName: '김지수',
    freelancerEmail: 'free@stella.ai',
  },
  {
    id: 6,
    title: '정형외과 진료 동행',
    type: 'HOSPITAL',
    date: '2025-04-25',
    time: '10:30',
    location: '서울 강남구 역삼동',
    description: '정형외과 진료 접수와 귀가 동행이 필요합니다.',
    status: 'REQUESTED',
    createdAt: '2025.04.18',
    requesterName: '보호자',
    requesterEmail: 'user@stella.ai',
  },
];

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function writeProjects(projects: Project[]): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function getProjects(): Project[] {
  const storage = getStorage();
  if (!storage) {
    return DEFAULT_PROJECTS;
  }

  const stored = storage.getItem(PROJECTS_KEY);
  if (!stored) {
    writeProjects(DEFAULT_PROJECTS);
    return DEFAULT_PROJECTS;
  }

  return JSON.parse(stored) as Project[];
}

export function createProject(input: CreateProjectInput): Project {
  const nextProject: Project = {
    id: Date.now(),
    ...input,
    status: 'REQUESTED',
    createdAt: new Date().toLocaleDateString('ko-KR'),
  };

  writeProjects([nextProject, ...getProjects()]);
  return nextProject;
}

export function updateProjectStatus(projectId: number, status: ProjectStatus): Project | null {
  let updatedProject: Project | null = null;
  const nextProjects = getProjects().map((project) => {
    if (project.id !== projectId) {
      return project;
    }

    updatedProject = { ...project, status };
    return updatedProject;
  });

  writeProjects(nextProjects);
  return updatedProject;
}

export function assignProjectFreelancer(
  projectId: number,
  freelancer: { freelancerId: number; freelancerName: string; freelancerEmail?: string },
): Project | null {
  let updatedProject: Project | null = null;
  const nextProjects = getProjects().map((project) => {
    if (project.id !== projectId) {
      return project;
    }

    updatedProject = {
      ...project,
      status: 'ACCEPTED',
      freelancerId: freelancer.freelancerId,
      freelancerName: freelancer.freelancerName,
      freelancerEmail: freelancer.freelancerEmail,
    };
    return updatedProject;
  });

  writeProjects(nextProjects);
  return updatedProject;
}

export function cancelProject(projectId: number): void {
  removeProposalsByProjectId(projectId);
  writeProjects(getProjects().filter((project) => project.id !== projectId));
}

export function getProjectById(projectId: number): Project | null {
  return getProjects().find((project) => project.id === projectId) ?? null;
}

export type EditableProjectFields = Pick<Project, 'title' | 'type' | 'date' | 'time' | 'location' | 'description'>;

export function updateProject(projectId: number, fields: EditableProjectFields): Project | null {
  let updated: Project | null = null;
  const next = getProjects().map((project) => {
    if (project.id !== projectId) return project;
    updated = { ...project, ...fields };
    return updated;
  });
  writeProjects(next);
  return updated;
}
