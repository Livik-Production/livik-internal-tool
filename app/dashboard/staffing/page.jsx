'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Layers,
  Users,
  FolderKanban,
  Briefcase,
  UserPlus,
  X,
  FileText,
  Upload,
  Paperclip,
  FolderCheck,
  FolderPlus,
  Search,
  Plus,
  Calendar,
  TrendingUp,
  BarChart3,
  Rocket,
  Building2,
  ChevronDown,
  Globe,
  Edit,
  Pencil,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import TabButton from '../../components/Buttons/TabButton';
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import CustomModalForm from '../../components/CustomModalForm';
import Button from '../../components/Buttons/Button';
import HyperlinkButton from '../../components/Buttons/HyperlinkButton';
import BenchPortfolio from '../../components/BenchDetails/BenchPortfolio';
import ProjectPortfolio from '../../components/ProjectDetails/ProjectPortfolio';
import '../../globals.css';

/* ===== TAB CONFIG ===== */
const TABS = [
  { id: 'project', label: 'Project Details' },
  { id: 'bench', label: 'Bench Details' },
];

/* ====================================================================
   MAIN PAGE
   ==================================================================== */
function StaffingContent() {
  const [activeTab, setActiveTab] = useState('project');
  const [animating, setAnimating] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [projectData, setProjectData] = useState([]);
  const [benchData, setBenchData] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const [projRes, empRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/employees'),
      ]);

      let mappedProjects = [];

      if (projRes.ok) {
        const pData = await projRes.json();
        mappedProjects = Array.isArray(pData)
          ? pData.map((p) => ({
              ...p,
              start: p.startDate,
              end: p.endDate,
              team: Array.isArray(p.members)
                ? p.members.map(
                    (m) =>
                      `${m.employee?.firstName || ''} ${m.employee?.lastName || ''}`
                  )
                : [],
            }))
          : [];
        setProjectData(mappedProjects);
      }

      if (empRes.ok) {
        const eData = await empRes.json();
        setBenchData(
          Array.isArray(eData)
            ? eData.map((emp) => {
                // Parse mapped projects securely from backend relation
                const projects = (emp.projectMembers || [])
                  .map((pm) => {
                    const p = pm.project;
                    return p
                      ? {
                          ...p,
                          status:
                            p.status === 'Completed'
                              ? 'Completed'
                              : 'In Progress',
                        }
                      : null;
                  })
                  .filter(Boolean);

                const isAssigned =
                  Array.isArray(emp.projectMembers) &&
                  emp.projectMembers.length > 0;

                // Calculate bench days
                const startDateStr =
                  emp.benchDetail?.benchStartDate ||
                  emp.dateOfJoining ||
                  emp.createdAt;
                const benchDays =
                  !isAssigned && startDateStr
                    ? Math.max(
                        0,
                        Math.floor(
                          (Date.now() - new Date(startDateStr).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )
                    : 0;

                return {
                  ...emp,
                  name: `${emp.firstName} ${emp.lastName}`,
                  skills: Array.isArray(emp.skills)
                    ? emp.skills
                    : emp.skills
                      ? emp.skills.split(',')
                      : [],
                  experience: emp.totalExperience || '0Y',
                  projectsDone:
                    projects
                      .filter((p) => p.status === 'Completed')
                      .length.toString() ||
                    emp.projectsDone ||
                    '0',
                  projects: projects, // Pass for the UI history
                  location: emp.workLocation || 'Not Specified',
                  benchDays,
                  benchStartDate: emp.benchDetail?.benchStartDate || null,
                  status: isAssigned ? 'Assigned' : 'Available',
                  avatar: emp.photo || `https://i.pravatar.cc/150?u=${emp.id}`,
                };
              })
            : []
        );
      }
    } catch (err) {
      console.error('Staffing fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabSwitch = (tabId) => {
    if (tabId === activeTab) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setAnimating(false);
    }, 300);
  };

  return (
    <div className="h-auto min-h-screen md:pb-0 no-scroll">
      {/* Page Header */}
      <header className="bg-white rounded-xl shadow-md p-2 m-0.5 border border-gray-200">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-[#33a8d9] rounded-xl">
              <Layers size={30} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Staffing & Project Details
              </h1>
              <p className="text-sm text-gray-900 mt-1">
                Manage bench resources and track active project allocations.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <Briefcase size={18} className="text-[#004475]" />
            <span className="text-sm font-semibold text-[#004475]">
              Resourcing Overview
            </span>
          </div>
        </div>
      </header>

      {/* Card with Tabs */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 m-1 min-h-full h-auto">
        {/* Tab Nav */}
        <nav
          role="tablist"
          aria-label="Staffing tabs"
          className="flex space-x-1.5 pl-2  pt-2 border-b border-gray-300 mb-2 bg-transparent overflow-x-auto no-scroll"
        >
          {TABS.map((t) => {
            const active = activeTab === t.id && !animating;
            return (
              <TabButton
                key={t.id}
                isActive={active}
                onClick={() => handleTabSwitch(t.id)}
                disabled={animating}
              >
                <span className="flex items-center gap-1.5">
                  {t.icon}
                  {t.label}
                </span>
              </TabButton>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div
          key={activeTab}
          className={`transition-all duration-300 ${
            animating ? 'opacity-0 translate-y-4' : 'animate-dashboard-reveal'
          }`}
        >
          {activeTab === 'bench' && (
            <BenchPortfolio
              projects={projectData}
              benchData={benchData}
              setBenchData={setBenchData}
              loading={loading}
              refreshData={fetchData}
            />
          )}
          {activeTab === 'project' && (
            <ProjectPortfolio
              projectData={projectData}
              setProjectData={setProjectData}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function StaffingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">Loading staffing module...</div>
      }
    >
      <StaffingContent />
    </Suspense>
  );
}
