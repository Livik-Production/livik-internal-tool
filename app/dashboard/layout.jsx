import DashboardLayoutContent from './DashboardLayoutContent';

export const metadata = {
  title: 'Dashboard',
};

export default function DashboardLayout({ children }) {
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}
